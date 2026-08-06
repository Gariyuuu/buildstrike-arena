import * as THREE from "three";
import { BOT_DIFFICULTY, type BotDifficulty } from "@/game/config/bots";
import type { BuildKind } from "@/game/config/builds";
import type { HealingItemId } from "@/game/config/healing";

export type BotState = "idle" | "search" | "chase" | "attack" | "build-defense" | "retreat" | "heal";

export interface BotPerception {
  botPos: THREE.Vector3;
  playerPos: THREE.Vector3;
  distance: number;
  canSee: boolean;
  botHealth: number;
  botShield: number;
  recentlyDamaged: boolean;
  healCharges: Record<HealingItemId, number>;
}

export interface BotIntent {
  state: BotState;
  moveTarget: THREE.Vector3 | null;
  wantsToShoot: boolean;
  wantsToJump: boolean;
  wantsToBuild: BuildKind | null;
  wantsToHeal: HealingItemId | null;
  aimAt: THREE.Vector3 | null;
}

const ATTACK_RANGE = 24;
const CLOSE_RANGE = 8;
const RETREAT_DISTANCE = 14;

export class BotBrain {
  state: BotState = "idle";
  private difficulty: BotDifficulty;
  private stateTimer = 0;
  private lastSeenPos: THREE.Vector3 | null = null;
  private nextFireDecision = 0;
  private lastBuildRequest = -10;
  private healTarget: HealingItemId | null = null;
  private jumpCooldown = 0;
  private wanderTarget: THREE.Vector3 | null = null;
  private continuousSightTime = 0;
  private nextPushDecision = 0;
  private pushDecision = true;

  constructor(difficulty: BotDifficulty) {
    this.difficulty = difficulty;
  }

  setDifficulty(d: BotDifficulty) {
    this.difficulty = d;
  }

  update(dt: number, p: BotPerception, now: number): BotIntent {
    const cfg = BOT_DIFFICULTY[this.difficulty];
    this.stateTimer += dt;
    this.jumpCooldown -= dt;
    if (p.canSee) {
      this.lastSeenPos = p.playerPos.clone();
      this.continuousSightTime += dt;
    } else {
      this.continuousSightTime = 0;
    }
    const hasReacted = this.continuousSightTime >= cfg.reactionTime;

    const healthFrac = (p.botHealth + p.botShield) / 200;
    const wantsHeal =
      healthFrac < cfg.healThreshold &&
      ((p.botShield < 100 && p.healCharges.shieldPotion > 0) || (p.botHealth < 100 && p.healCharges.medkit > 0));

    // ---- Transitions ----
    if (this.state !== "heal" && wantsHeal && !p.recentlyDamaged) {
      this.transition("heal");
    } else if (p.recentlyDamaged && this.state !== "retreat" && this.state !== "build-defense" && healthFrac < 0.4) {
      this.transition("retreat");
    } else if (p.recentlyDamaged && Math.random() < cfg.buildLikelihood * dt * 2 && now - this.lastBuildRequest > 4) {
      this.transition("build-defense");
    } else if (p.canSee && p.distance <= ATTACK_RANGE && hasReacted) {
      if (this.state !== "attack") this.transition("attack");
    } else if (this.lastSeenPos && this.state !== "attack") {
      this.transition("search");
    } else if (this.state === "idle" || this.state === "search") {
      if (!p.canSee && this.stateTimer > 3) this.transition("idle");
    }

    if (this.state === "retreat" && (!p.recentlyDamaged || this.stateTimer > 2.5)) {
      this.transition(p.canSee ? "attack" : "search");
    }
    if (this.state === "build-defense" && this.stateTimer > 1.2) {
      this.transition(p.canSee ? "attack" : "search");
    }
    if (this.state === "heal" && (!wantsHeal || this.stateTimer > 6)) {
      this.transition(p.canSee ? "attack" : "search");
    }

    return this.act(dt, p, cfg, now);
  }

  private transition(next: BotState) {
    this.state = next;
    this.stateTimer = 0;
  }

  private act(
    dt: number,
    p: BotPerception,
    cfg: (typeof BOT_DIFFICULTY)[BotDifficulty],
    now: number
  ): BotIntent {
    const intent: BotIntent = {
      state: this.state,
      moveTarget: null,
      wantsToShoot: false,
      wantsToJump: false,
      wantsToBuild: null,
      wantsToHeal: null,
      aimAt: null,
    };

    if (this.jumpCooldown <= 0 && (this.state === "chase" || this.state === "attack") && Math.random() < 0.15 * dt) {
      intent.wantsToJump = true;
      this.jumpCooldown = 2.5 + Math.random() * 2;
    }

    switch (this.state) {
      case "idle": {
        if (!this.wanderTarget || this.wanderTarget.distanceTo(p.botPos) < 1) {
          this.wanderTarget = p.botPos
            .clone()
            .add(new THREE.Vector3((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8));
        }
        intent.moveTarget = this.wanderTarget;
        break;
      }
      case "search": {
        intent.moveTarget = this.lastSeenPos ?? p.botPos;
        break;
      }
      case "chase": {
        intent.moveTarget = p.playerPos;
        break;
      }
      case "attack": {
        intent.aimAt = p.playerPos;
        if (now >= this.nextPushDecision) {
          this.pushDecision = Math.random() < cfg.aggression;
          this.nextPushDecision = now + 1.5;
        }
        if (p.distance > CLOSE_RANGE * 1.4 && this.pushDecision) {
          intent.moveTarget = p.playerPos;
        } else if (p.distance < CLOSE_RANGE * 0.6) {
          // Back off slightly to avoid point-blank shotgun trades every time.
          const away = p.botPos.clone().sub(p.playerPos).normalize();
          intent.moveTarget = p.botPos.clone().addScaledVector(away, 3);
        }
        if (now >= this.nextFireDecision && p.canSee) {
          intent.wantsToShoot = true;
          this.nextFireDecision = now + cfg.fireDecisionInterval * (0.6 + Math.random() * 0.8);
        }
        break;
      }
      case "build-defense": {
        if (now - this.lastBuildRequest > 3) {
          intent.wantsToBuild = p.distance < 10 ? "wall" : "ramp";
          this.lastBuildRequest = now;
        }
        const away = p.botPos.clone().sub(p.playerPos).normalize();
        intent.moveTarget = p.botPos.clone().addScaledVector(away, 0.5);
        intent.aimAt = p.playerPos;
        break;
      }
      case "retreat": {
        const away = p.botPos.clone().sub(p.playerPos).normalize();
        intent.moveTarget = p.botPos.clone().addScaledVector(away, RETREAT_DISTANCE);
        intent.aimAt = p.canSee ? p.playerPos : null;
        if (p.canSee && now >= this.nextFireDecision) {
          intent.wantsToShoot = true;
          this.nextFireDecision = now + cfg.fireDecisionInterval * 1.4;
        }
        break;
      }
      case "heal": {
        intent.moveTarget = null;
        if (p.botShield < 100 && p.healCharges.shieldPotion > 0) intent.wantsToHeal = "shieldPotion";
        else if (p.botHealth < 100 && p.healCharges.medkit > 0) intent.wantsToHeal = "medkit";
        break;
      }
    }

    return intent;
  }
}
