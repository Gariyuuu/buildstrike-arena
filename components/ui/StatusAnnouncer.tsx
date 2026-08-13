"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useMatchStore, type RoundPhase } from "@/stores/matchStore";
import { useNetworkStore, type ConnectionStatus } from "@/stores/networkStore";
import { usePlayerStore } from "@/stores/playerStore";

const SCREEN_LABEL: Record<string, string> = {
  menu: "Main menu",
  instructions: "Instructions",
  settings: "Settings",
  playing: "Match",
};

interface Snapshot {
  screen: string;
  paused: boolean;
  phase: RoundPhase;
  scoreLocal: number;
  scoreOpponent: number;
  connectionStatus: ConnectionStatus;
  opponentDisconnected: boolean;
  isDead: boolean;
  healthWarned: boolean;
}

/** Visually-hidden aria-live region that narrates the state a sighted player
 * gets for free from the HUD/canvas — score, round, phase, connection,
 * elimination, health — so a screen reader user isn't locked out of a
 * WebGL scene with no DOM representation of what's happening.
 *
 * Announcements are edge-triggered by comparing live store values against a
 * snapshot of the previous render, following React's documented pattern for
 * adjusting state when a value changes without an Effect
 * (https://react.dev/learn/you-might-not-need-an-effect) — a setState call
 * here re-enters render immediately, so a single store update that changes
 * several of these at once (e.g. matchStore.endRound sets phase, score, and
 * roundWinner together) cascades through the chain across a couple of extra
 * renders instead of losing everything but the first branch. */
export function StatusAnnouncer() {
  const [message, setMessage] = useState("");

  const screen = useGameStore((s) => s.screen);
  const paused = useGameStore((s) => s.paused);
  const phase = useMatchStore((s) => s.phase);
  const round = useMatchStore((s) => s.round);
  const roundWinner = useMatchStore((s) => s.roundWinner);
  const matchWinner = useMatchStore((s) => s.matchWinner);
  const scoreLocal = useMatchStore((s) => s.score.local);
  const scoreOpponent = useMatchStore((s) => s.score.opponent);
  const opponentDisconnected = useMatchStore((s) => s.opponentDisconnected);
  const connectionStatus = useNetworkStore((s) => s.status);
  const health = usePlayerStore((s) => s.local.health);
  const isDead = usePlayerStore((s) => s.local.isDead);

  const [snap, setSnap] = useState<Snapshot>(() => ({
    screen,
    paused,
    phase,
    scoreLocal,
    scoreOpponent,
    connectionStatus,
    opponentDisconnected,
    isDead,
    healthWarned: false,
  }));

  if (screen !== snap.screen) {
    setSnap({ ...snap, screen });
    setMessage(`${SCREEN_LABEL[screen] ?? screen} opened`);
  } else if (paused !== snap.paused) {
    setSnap({ ...snap, paused });
    setMessage(paused ? "Game paused" : "Game resumed");
  } else if (phase !== snap.phase) {
    setSnap({ ...snap, phase });
    if (phase === "combat") setMessage(`Round ${round} — fight`);
    else if (phase === "round-end" && roundWinner) setMessage(roundWinner === "local" ? "Round won" : "Round lost");
    else if (phase === "match-end" && matchWinner) setMessage(matchWinner === "local" ? "Match won" : "Match lost");
  } else if (scoreLocal !== snap.scoreLocal || scoreOpponent !== snap.scoreOpponent) {
    setSnap({ ...snap, scoreLocal, scoreOpponent });
    setMessage(`Score: you ${scoreLocal}, opponent ${scoreOpponent}`);
  } else if (connectionStatus !== snap.connectionStatus) {
    setSnap({ ...snap, connectionStatus });
    setMessage(`Connection: ${connectionStatus}`);
  } else if (opponentDisconnected !== snap.opponentDisconnected) {
    setSnap({ ...snap, opponentDisconnected });
    if (opponentDisconnected) setMessage("Opponent disconnected, waiting to reconnect");
  } else if (isDead !== snap.isDead) {
    setSnap({ ...snap, isDead, healthWarned: false });
    if (isDead) setMessage("You were eliminated");
  } else if (!isDead && health <= 25 && !snap.healthWarned) {
    setSnap({ ...snap, healthWarned: true });
    setMessage("Health critical");
  } else if (!isDead && health > 25 && snap.healthWarned) {
    setSnap({ ...snap, healthWarned: false });
  }

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
