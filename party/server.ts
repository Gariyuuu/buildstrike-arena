import { Server, routePartykitRequest, type Connection, type ConnectionContext } from "partyserver";
import { WEAPONS, type WeaponId } from "../game/config/weapons";
import { HEALING } from "../game/config/healing";
import { MATCH_CONFIG } from "../game/config/match";
import { MOVEMENT } from "../game/config/movement";
import { BUILD_TYPES } from "../game/config/builds";
import { validatePlacement } from "../game/building/grid";
import type { ClientMessage, ServerMessage, Side, Vec3 } from "../game/networking/types";

interface PlayerInfo {
  displayName: string;
  level: number;
  skinId: string;
  primaryWeapon: WeaponId;
  secondaryWeapon: WeaponId;
}

interface MatchSettings {
  roundsToWin: number;
  headshotsEnabled: boolean;
  healingEnabled: boolean;
  infiniteBuilds: boolean;
}

const ALLOWED_ROUNDS_TO_WIN = [3, 5, 10];

interface PlayerSlot {
  side: Side;
  token: string;
  name: string;
  connectionId: string | null;
  connected: boolean;
  ready: boolean;
  health: number;
  shield: number;
  lastFire: Partial<Record<string, number>>;
  lastState: { position: Vec3; timestamp: number } | null;
  disconnectTimer: ReturnType<typeof setTimeout> | null;
  rematchRequested: boolean;
  info: PlayerInfo | null;
}

interface BuildRecord {
  id: string;
  kind: "wall" | "floor" | "ramp";
  owner: Side;
  position: Vec3;
  rotationY: number;
  health: number;
  maxHealth: number;
}

type Phase = "lobby" | "countdown" | "combat" | "round-end" | "match-end";

const RECONNECT_GRACE_MS = 25_000;
const MAX_SPEED = MOVEMENT.walkSpeed * MOVEMENT.sprintMultiplier * 1.6; // tolerance margin
let buildCounter = 0;

export class GameRoom extends Server<Env> {
  slots: Record<Side, PlayerSlot | null> = { a: null, b: null };
  builds: BuildRecord[] = [];
  score: Record<Side, number> = { a: 0, b: 0 };
  round = 1;
  phase: Phase = "lobby";
  matchSettings: MatchSettings = {
    roundsToWin: MATCH_CONFIG.roundsToWin,
    headshotsEnabled: true,
    healingEnabled: true,
    infiniteBuilds: false,
  };

  private send(connection: Connection, msg: ServerMessage) {
    connection.send(JSON.stringify(msg));
  }

  private broadcastMsg(msg: ServerMessage, exclude: string[] = []) {
    this.broadcast(JSON.stringify(msg), exclude);
  }

  private slotByConnection(id: string): PlayerSlot | null {
    if (this.slots.a?.connectionId === id) return this.slots.a;
    if (this.slots.b?.connectionId === id) return this.slots.b;
    return null;
  }

  private otherSide(side: Side): Side {
    return side === "a" ? "b" : "a";
  }

  private opponentConnection(side: Side): Connection | undefined {
    const opp = this.slots[this.otherSide(side)];
    if (!opp?.connectionId) return undefined;
    return this.getConnection(opp.connectionId);
  }

  private broadcastRoomStatus() {
    const a = this.slots.a;
    const b = this.slots.b;
    if (a?.connectionId) {
      const conn = this.getConnection(a.connectionId);
      if (conn) this.send(conn, { type: "roomStatus", opponentPresent: !!b, opponentConnected: !!b?.connected, opponentReady: !!b?.ready });
    }
    if (b?.connectionId) {
      const conn = this.getConnection(b.connectionId);
      if (conn) this.send(conn, { type: "roomStatus", opponentPresent: !!a, opponentConnected: !!a?.connected, opponentReady: !!a?.ready });
    }
  }

  async onConnect(connection: Connection, ctx: ConnectionContext) {
    const url = new URL(ctx.request.url);
    const token = url.searchParams.get("token") || connection.id;
    const name = (url.searchParams.get("name") || "Player").slice(0, 16);

    let slot = this.slots.a?.token === token ? this.slots.a : this.slots.b?.token === token ? this.slots.b : null;
    const isReconnect = !!slot;

    if (!slot) {
      if (!this.slots.a) {
        slot = this.freshSlot("a", token, name);
        this.slots.a = slot;
      } else if (!this.slots.b) {
        slot = this.freshSlot("b", token, name);
        this.slots.b = slot;
      } else {
        this.send(connection, { type: "error", message: "Room is full." });
        connection.close(4001, "room-full");
        return;
      }
    } else {
      if (slot.disconnectTimer) {
        clearTimeout(slot.disconnectTimer);
        slot.disconnectTimer = null;
      }
    }

    slot.connectionId = connection.id;
    slot.connected = true;
    connection.setState({ side: slot.side });

    this.send(connection, {
      type: "welcome",
      side: slot.side,
      roomCode: this.name,
      opponentPresent: !!this.slots[this.otherSide(slot.side)],
    });

    if (isReconnect && this.phase !== "lobby") {
      const opponentSlot = this.slots[this.otherSide(slot.side)];
      this.send(connection, {
        type: "matchResume",
        phase: this.phase,
        round: this.round,
        score: this.score,
        yourHealth: slot.health,
        yourShield: slot.shield,
        opponentHealth: opponentSlot?.health ?? MATCH_CONFIG.maxHealth,
        opponentShield: opponentSlot?.shield ?? 0,
        builds: this.builds.map((b) => ({
          id: b.id,
          kind: b.kind,
          owner: b.owner,
          position: b.position,
          rotationY: b.rotationY,
          health: b.health,
          maxHealth: b.maxHealth,
        })),
      });
    }

    const opponentConn = this.opponentConnection(slot.side);
    if (opponentConn) this.send(opponentConn, { type: "opponentReconnected" });
    this.broadcastRoomStatus();

    this.send(connection, { type: "matchSettings", ...this.matchSettings });
    const opponentSlot = this.slots[this.otherSide(slot.side)];
    if (opponentSlot?.info) {
      this.send(connection, { type: "opponentInfo", ...opponentSlot.info });
    }
  }

  private freshSlot(side: Side, token: string, name: string): PlayerSlot {
    return {
      side,
      token,
      name,
      connectionId: null,
      connected: false,
      ready: false,
      health: MATCH_CONFIG.maxHealth,
      shield: 0,
      lastFire: {},
      lastState: null,
      disconnectTimer: null,
      rematchRequested: false,
      info: null,
    };
  }

  async onMessage(connection: Connection, raw: string | ArrayBuffer | ArrayBufferView) {
    if (typeof raw !== "string") return;
    const slot = this.slotByConnection(connection.id);
    if (!slot) return;

    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case "ping":
        this.send(connection, { type: "pong", t: msg.t });
        return;
      case "ready":
        slot.ready = true;
        this.broadcastRoomStatus();
        this.maybeStartMatch();
        return;
      case "state":
        this.handleState(slot, msg);
        return;
      case "fire":
        this.handleFire(slot, msg);
        return;
      case "buildPlace":
        this.handleBuildPlace(slot, msg);
        return;
      case "healStart":
      case "healCancel":
      case "healComplete":
        this.handleHeal(slot, msg);
        return;
      case "resetRequest":
        // Only meaningful mid-round (e.g. from the pause menu). Reject
        // outside "combat" so it can't clobber the round-end→countdown→
        // combat sequence already in flight (BUG-003).
        if (this.phase !== "combat") return;
        this.resetRound(false);
        return;
      case "rematchRequest":
        slot.rematchRequested = true;
        const other = this.slots[this.otherSide(slot.side)];
        if (other?.rematchRequested) {
          this.score = { a: 0, b: 0 };
          this.round = 1;
          slot.rematchRequested = false;
          other.rematchRequested = false;
          // resetRound(false) here deliberately does NOT send its own
          // matchStart/countdown — maybeStartMatch(true) below is the single
          // source of the rematch's matchStart broadcast (isNewMatch: true).
          // Previously this called resetRound(true), which ALSO broadcasts a
          // matchStart (isNewMatch: false, meant for ordinary round-to-round
          // transitions) — two competing matchStart messages and countdown
          // timers on every rematch (BUG-009, found via a live two-client
          // test alongside BUG-007/BUG-008 — see DECISIONS.md/TASKS.md).
          this.resetRound(false);
          this.maybeStartMatch(true);
        }
        return;
      case "leave":
        connection.close(1000, "left");
        return;
      case "playerInfo":
        slot.info = {
          displayName: msg.displayName.slice(0, 16),
          level: msg.level,
          skinId: msg.skinId,
          primaryWeapon: msg.primaryWeapon,
          secondaryWeapon: msg.secondaryWeapon,
        };
        const oppConn = this.opponentConnection(slot.side);
        if (oppConn) this.send(oppConn, { type: "opponentInfo", ...slot.info });
        return;
      case "hostSettings":
        // Only the room creator (side "a" by construction — see PlayTab.tsx's
        // create-vs-join flow) may change match settings, and only pre-match
        // — settings are locked in once combat is already running.
        if (slot.side !== "a" || this.phase !== "lobby") return;
        this.matchSettings = {
          roundsToWin: ALLOWED_ROUNDS_TO_WIN.includes(msg.roundsToWin) ? msg.roundsToWin : this.matchSettings.roundsToWin,
          headshotsEnabled: msg.headshotsEnabled,
          healingEnabled: msg.healingEnabled,
          infiniteBuilds: msg.infiniteBuilds,
        };
        this.broadcastMsg({ type: "matchSettings", ...this.matchSettings });
        return;
    }
  }

  private maybeStartMatch(force = false) {
    if (this.phase !== "lobby" && !force) return;
    if (!this.slots.a?.ready || !this.slots.b?.ready) return;
    this.phase = "countdown";
    this.broadcastMsg({ type: "matchStart", countdown: MATCH_CONFIG.countdownSeconds, isNewMatch: true });
    setTimeout(() => {
      this.phase = "combat";
      this.broadcastMsg({ type: "roundStart", round: this.round });
    }, MATCH_CONFIG.countdownSeconds * 1000);
  }

  private handleState(slot: PlayerSlot, msg: Extract<ClientMessage, { type: "state" }>) {
    const now = Date.now();
    if (slot.lastState) {
      const dt = Math.max(0.001, (msg.timestamp - slot.lastState.timestamp) / 1000);
      const dx = msg.position[0] - slot.lastState.position[0];
      const dz = msg.position[2] - slot.lastState.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist / dt > MAX_SPEED) {
        // Impossible movement speed — ignore this update, keep last known good state.
        return;
      }
    }
    slot.lastState = { position: msg.position, timestamp: msg.timestamp };
    const opp = this.opponentConnection(slot.side);
    if (opp) {
      this.send(opp, {
        type: "opponentState",
        position: msg.position,
        rotationY: msg.rotationY,
        isBuildMode: msg.isBuildMode,
        buildKind: msg.buildKind,
        weapon: msg.weapon,
        timestamp: msg.timestamp,
      });
    }
    void now;
  }

  private handleFire(slot: PlayerSlot, msg: Extract<ClientMessage, { type: "fire" }>) {
    if (this.phase !== "combat") return;
    const weapon = WEAPONS[msg.weapon];
    if (!weapon) return;

    const now = Date.now();
    const last = slot.lastFire[msg.weapon] ?? 0;
    const minInterval = (1000 / weapon.fireRate) * 0.8; // tolerance for jitter
    if (now - last < minInterval) return; // fire rate violation — drop
    slot.lastFire[msg.weapon] = now;

    const opp = this.opponentConnection(slot.side);
    if (opp) {
      this.send(opp, { type: "opponentFired", weapon: msg.weapon, origin: msg.origin, direction: msg.direction });
    }

    if (msg.hitPlayer) {
      const target = this.slots[this.otherSide(slot.side)];
      if (target) {
        const headshot = this.matchSettings.headshotsEnabled && msg.hitPlayer.headshot;
        const pellets = Math.min(Math.max(msg.hitPlayer.pellets, 1), weapon.pellets);
        const perPellet = weapon.damage * (headshot ? weapon.headshotMultiplier : 1);
        const totalDamage = Math.round(perPellet * pellets);
        this.applyDamage(target, totalDamage, headshot);
      }
    } else if (msg.hitBuild) {
      const build = this.builds.find((b) => b.id === msg.hitBuild!.buildId);
      if (build) {
        const pellets = Math.min(Math.max(msg.hitBuild.pellets, 1), weapon.pellets);
        const totalDamage = Math.round(weapon.damage * pellets);
        build.health -= totalDamage;
        if (build.health <= 0) {
          this.builds = this.builds.filter((b) => b.id !== build.id);
          this.broadcastMsg({ type: "buildDestroyed", buildId: build.id });
        } else {
          this.broadcastMsg({ type: "buildDamaged", buildId: build.id, health: build.health });
        }
      }
    }
  }

  private applyDamage(target: PlayerSlot, amount: number, headshot: boolean) {
    let remaining = amount;
    if (target.shield > 0) {
      const absorbed = Math.min(target.shield, remaining);
      target.shield -= absorbed;
      remaining -= absorbed;
    }
    target.health = Math.max(0, target.health - remaining);

    this.broadcastMsg({
      type: "damageApplied",
      target: target.side,
      health: target.health,
      shield: target.shield,
      damage: amount,
      headshot,
    });

    if (target.health <= 0 && this.phase === "combat") {
      this.endRound(this.otherSide(target.side));
    }
  }

  private endRound(winner: Side) {
    this.phase = "round-end";
    this.score[winner] += 1;
    this.broadcastMsg({ type: "roundEnd", winner, score: this.score });

    if (this.score[winner] >= this.matchSettings.roundsToWin) {
      this.phase = "match-end";
      this.broadcastMsg({ type: "matchEnd", winner });
      return;
    }

    setTimeout(() => {
      this.round += 1;
      this.resetRound(true);
    }, MATCH_CONFIG.roundEndDelay * 1000);
  }

  private resetRound(startCountdown: boolean) {
    this.builds = [];
    if (this.slots.a) {
      this.slots.a.health = MATCH_CONFIG.maxHealth;
      this.slots.a.shield = 0;
    }
    if (this.slots.b) {
      this.slots.b.health = MATCH_CONFIG.maxHealth;
      this.slots.b.shield = 0;
    }
    this.broadcastMsg({ type: "roundReset" });
    if (startCountdown) {
      this.phase = "countdown";
      // isNewMatch: false — this branch only runs for the ordinary next-round
      // countdown within an already-running match (see endRound's setTimeout
      // below); the score must NOT reset here. Rematch's fresh-match
      // countdown goes through maybeStartMatch() instead (isNewMatch: true).
      this.broadcastMsg({ type: "matchStart", countdown: MATCH_CONFIG.countdownSeconds, isNewMatch: false });
      setTimeout(() => {
        this.phase = "combat";
        this.broadcastMsg({ type: "roundStart", round: this.round });
      }, MATCH_CONFIG.countdownSeconds * 1000);
    } else {
      this.phase = "combat";
    }
  }

  private handleBuildPlace(slot: PlayerSlot, msg: Extract<ClientMessage, { type: "buildPlace" }>) {
    if (this.phase !== "combat") return;
    const opponentPos = this.slots[this.otherSide(slot.side)]?.lastState?.position;
    const selfPos = slot.lastState?.position;
    const playerPositions: Vec3[] = [opponentPos, selfPos].filter(Boolean) as Vec3[];
    const activeCount = this.matchSettings.infiniteBuilds ? -1 : this.builds.filter((b) => b.owner === slot.side).length;

    const result = validatePlacement(
      msg.kind,
      msg.position,
      msg.rotationY,
      this.builds.map((b) => ({ id: b.id, kind: b.kind, owner: b.owner, position: b.position, rotationY: b.rotationY, health: b.health, maxHealth: b.maxHealth })),
      playerPositions,
      activeCount
    );

    const connection = this.getConnection(slot.connectionId!);
    if (!result.valid) {
      if (connection) this.send(connection, { type: "buildRejected", clientId: msg.clientId });
      return;
    }

    buildCounter += 1;
    const build: BuildRecord = {
      id: `b${this.name}-${buildCounter}`,
      kind: msg.kind,
      owner: slot.side,
      position: result.position,
      rotationY: result.rotationY,
      health: BUILD_TYPES[msg.kind].health,
      maxHealth: BUILD_TYPES[msg.kind].health,
    };
    this.builds.push(build);
    this.broadcastMsg({ type: "buildConfirmed", clientId: msg.clientId, build });
  }

  private handleHeal(slot: PlayerSlot, msg: Extract<ClientMessage, { type: "healStart" | "healCancel" | "healComplete" }>) {
    if (!this.matchSettings.healingEnabled) return;
    const event = msg.type === "healStart" ? "start" : msg.type === "healCancel" ? "cancel" : "complete";
    if (event === "complete") {
      const item = HEALING[msg.item];
      if (msg.item === "shieldPotion") {
        slot.shield = Math.min(MATCH_CONFIG.maxShield, slot.shield + item.restore);
      } else {
        slot.health = Math.min(MATCH_CONFIG.maxHealth, slot.health + item.restore);
      }
    }
    this.broadcastMsg({ type: "healApplied", side: slot.side, item: msg.item, health: slot.health, shield: slot.shield, event });
  }

  async onClose(connection: Connection) {
    const slot = this.slotByConnection(connection.id);
    if (!slot) return;
    slot.connected = false;
    const opp = this.opponentConnection(slot.side);
    if (opp) this.send(opp, { type: "opponentDisconnected" });
    this.broadcastRoomStatus();

    slot.disconnectTimer = setTimeout(() => {
      if (this.slots[slot.side] === slot && !slot.connected) {
        this.slots[slot.side] = null;
      }
    }, RECONNECT_GRACE_MS);
  }

  async onError(connection: Connection) {
    await this.onClose(connection);
  }
}

interface Env {
  GameRoom: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env) {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("BuildStrike Arena realtime server. Connect via /parties/game-room/<room-code>.", { status: 200 })
    );
  },
} satisfies ExportedHandler<Env>;
