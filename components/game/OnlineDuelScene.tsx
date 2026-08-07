"use client";

import { useEffect, useMemo, useRef } from "react";
import { PLAYER_SPAWNS } from "@/game/config/match";
import { GameNetworkClient } from "@/game/networking/client";
import { setActiveClient } from "@/game/networking/activeClient";
import { createOnlineAdapter } from "@/game/networking/onlineAdapter";
import type { OpponentStateMsg, OpponentFiredMsg, ServerMessage, Side } from "@/game/networking/types";
import { useNetworkStore } from "@/stores/networkStore";
import { useMatchStore } from "@/stores/matchStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useBuildsStore } from "@/stores/buildsStore";
import { useProfileStore } from "@/stores/profileStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useLoadoutStore } from "@/stores/loadoutStore";
import { effectsBus } from "@/game/effects/effectsBus";
import { soundManager } from "@/game/audio/soundManager";
import { positionTracker } from "@/game/state/positionTracker";
import { bearingToWorldPoint } from "@/game/state/combatFeel";
import { LocalPlayer } from "@/components/game/LocalPlayer";
import { RemotePlayer } from "@/components/game/RemotePlayer";

function translate(side: Side): "local" | "opponent" {
  return side === useNetworkStore.getState().mySide ? "local" : "opponent";
}

function handleMessage(
  msg: ServerMessage,
  netStateRef: React.RefObject<OpponentStateMsg | null>,
  fireEventRef: React.RefObject<OpponentFiredMsg | null>,
  client: GameNetworkClient
) {
  const net = useNetworkStore.getState();
  switch (msg.type) {
    case "welcome": {
      net.setMySide(msg.side);
      net.setStatus("connected");
      net.setOpponentPresent(msg.opponentPresent);
      const profile = useProfileStore.getState();
      const loadout = useLoadoutStore.getState();
      client.send({
        type: "playerInfo",
        displayName: profile.displayName,
        level: profile.level,
        skinId: useInventoryStore.getState().equipped.skin,
        primaryWeapon: loadout.primary,
        secondaryWeapon: loadout.secondary,
      });
      break;
    }
    case "opponentInfo":
      net.setOpponentInfo({
        displayName: msg.displayName,
        level: msg.level,
        skinId: msg.skinId,
        primaryWeapon: msg.primaryWeapon,
        secondaryWeapon: msg.secondaryWeapon,
      });
      break;
    case "matchSettings":
      net.setMatchSettings({
        roundsToWin: msg.roundsToWin,
        headshotsEnabled: msg.headshotsEnabled,
        healingEnabled: msg.healingEnabled,
        infiniteBuilds: msg.infiniteBuilds,
      });
      break;
    case "roomStatus":
      net.setOpponentPresent(msg.opponentPresent);
      net.setOpponentConnected(msg.opponentConnected);
      net.setOpponentReady(msg.opponentReady);
      break;
    case "matchStart":
      net.setMatchStarted(true);
      usePlayerStore.getState().resetForRound();
      useBuildsStore.getState().clear();
      useMatchStore.getState().applyServerCountdown(msg.countdown, msg.isNewMatch);
      soundManager.play("countdown");
      break;
    case "roundStart":
      useMatchStore.getState().applyServerCombatStart(msg.round);
      break;
    case "opponentState":
      netStateRef.current = msg;
      break;
    case "opponentFired":
      fireEventRef.current = msg;
      break;
    case "damageApplied": {
      const target = translate(msg.target);
      if (target === "local") {
        usePlayerStore.getState().setLocal({ health: msg.health, shield: msg.shield });
        const local = positionTracker.local;
        const opp = positionTracker.opponent;
        usePlayerStore.getState().triggerDamageFlash(bearingToWorldPoint(local.x, local.z, opp.x, opp.z));
        soundManager.play("takeDamage");
      } else {
        usePlayerStore.getState().setOpponent({ health: msg.health, shield: msg.shield });
      }
      break;
    }
    case "buildConfirmed": {
      const owner = translate(msg.build.owner);
      useBuildsStore.getState().add({
        id: msg.build.id,
        kind: msg.build.kind,
        owner,
        position: msg.build.position,
        rotationY: msg.build.rotationY,
        health: msg.build.health,
        maxHealth: msg.build.maxHealth,
      });
      break;
    }
    case "buildRejected":
      usePlayerStore.getState().triggerBuildDenied();
      soundManager.play("buildDenied", { volume: 0.5 });
      break;
    case "buildDamaged":
      useBuildsStore.getState().damage(msg.buildId, msg.health);
      break;
    case "buildDestroyed": {
      const build = useBuildsStore.getState().builds.find((b) => b.id === msg.buildId);
      if (build) effectsBus.emit({ kind: "destruction", point: build.position });
      soundManager.play("buildDestroy");
      useBuildsStore.getState().remove(msg.buildId);
      break;
    }
    case "healApplied": {
      const side = translate(msg.side);
      if (side === "local") {
        usePlayerStore.getState().setLocal({ health: msg.health, shield: msg.shield });
      } else {
        usePlayerStore.getState().setOpponent({ health: msg.health, shield: msg.shield });
        if (msg.event === "start") soundManager.play(msg.item === "shieldPotion" ? "potionUse" : "medkitUse", { volume: 0.5 });
      }
      break;
    }
    case "roundEnd": {
      const mine = net.mySide;
      if (!mine) break;
      const other: Side = mine === "a" ? "b" : "a";
      const translatedScore: Record<"local" | "opponent", number> = { local: msg.score[mine], opponent: msg.score[other] };
      useMatchStore.getState().applyServerRoundEnd(translate(msg.winner), translatedScore);
      soundManager.play(translate(msg.winner) === "local" ? "roundVictory" : "elimination");
      break;
    }
    case "matchEnd":
      useMatchStore.getState().applyServerMatchEnd(translate(msg.winner));
      break;
    case "roundReset":
      usePlayerStore.getState().resetForRound();
      useBuildsStore.getState().clear();
      useMatchStore.getState().applyServerRoundReset();
      break;
    case "opponentDisconnected":
      net.setOpponentConnected(false);
      useMatchStore.getState().setOpponentDisconnected(true);
      break;
    case "opponentReconnected":
      net.setOpponentConnected(true);
      useMatchStore.getState().setOpponentDisconnected(false);
      break;
    case "matchResume": {
      // We reconnected mid-match (see BUG-008): hydrate every store from the
      // server's authoritative snapshot instead of sitting on the pre-match
      // lobby overlay forever, since no fresh matchStart/roundStart message
      // is sent for an already-in-progress match.
      net.setMatchStarted(true);
      const mine = net.mySide;
      if (mine) {
        const other: Side = mine === "a" ? "b" : "a";
        useMatchStore.getState().applyServerResume(msg.phase, msg.round, { local: msg.score[mine], opponent: msg.score[other] });
      }
      usePlayerStore.getState().setLocal({ health: msg.yourHealth, shield: msg.yourShield });
      usePlayerStore.getState().setOpponent({ health: msg.opponentHealth, shield: msg.opponentShield, connected: true });
      useBuildsStore.getState().clear();
      for (const b of msg.builds) {
        useBuildsStore.getState().add({
          id: b.id,
          kind: b.kind,
          owner: translate(b.owner),
          position: b.position,
          rotationY: b.rotationY,
          health: b.health,
          maxHealth: b.maxHealth,
        });
      }
      break;
    }
    case "pong":
      net.setPing(Date.now() - msg.t);
      break;
    case "error":
      net.setError(msg.message);
      break;
  }
}

export function OnlineDuelScene({ domElement }: { domElement: React.RefObject<HTMLDivElement | null> }) {
  const client = useMemo(() => new GameNetworkClient(), []);
  const adapter = useMemo(() => createOnlineAdapter(client), [client]);
  const netStateRef = useRef<OpponentStateMsg | null>(null);
  const fireEventRef = useRef<OpponentFiredMsg | null>(null);
  const mySide = useNetworkStore((s) => s.mySide);
  const opponentPresent = useNetworkStore((s) => s.opponentPresent);
  const opponentConnected = useNetworkStore((s) => s.opponentConnected);

  useEffect(() => {
    const { roomCode, playerName } = useNetworkStore.getState();
    if (!roomCode) return;
    useNetworkStore.getState().setStatus("connecting");
    try {
      client.connect(roomCode, playerName);
    } catch (err) {
      useNetworkStore.getState().setStatus("disconnected");
      useNetworkStore.getState().setError(err instanceof Error ? err.message : "Failed to connect.");
      return;
    }
    setActiveClient(client);

    const unsub = client.onMessage((msg: ServerMessage) => handleMessage(msg, netStateRef, fireEventRef, client));

    return () => {
      unsub();
      setActiveClient(null);
      client.disconnect();
    };
  }, [client]);

  if (!mySide) return null;

  const spawn = mySide === "a" ? PLAYER_SPAWNS.a : PLAYER_SPAWNS.b;
  const opponentSpawn = mySide === "a" ? PLAYER_SPAWNS.b : PLAYER_SPAWNS.a;

  return (
    <>
      <LocalPlayer mode="online" adapter={adapter} spawn={spawn} domElement={domElement} />
      <RemotePlayer
        netStateRef={netStateRef}
        fireEventRef={fireEventRef}
        connected={opponentConnected || opponentPresent}
        spawn={opponentSpawn.position}
      />
    </>
  );
}
