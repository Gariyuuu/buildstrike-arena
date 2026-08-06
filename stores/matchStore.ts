"use client";

import { create } from "zustand";
import { MATCH_CONFIG } from "@/game/config/match";

export type RoundPhase = "countdown" | "combat" | "round-end" | "match-end";
export type Side = "local" | "opponent";

interface MatchState {
  score: Record<Side, number>;
  round: number;
  phase: RoundPhase;
  countdown: number;
  roundWinner: Side | null;
  matchWinner: Side | null;
  opponentDisconnected: boolean;
  resetSignal: number;
  /** Cumulative damage the local player has dealt this match (persists across rounds, resets on a new match/rematch) — used for profile XP/stat tracking. */
  damageDealt: number;
  addDamageDealt: (amount: number) => void;
  startMatch: () => void;
  setCountdown: (value: number) => void;
  beginCombat: () => void;
  endRound: (winner: Side) => void;
  advanceRound: () => void;
  manualReset: () => void;
  setOpponentDisconnected: (v: boolean) => void;
  reset: () => void;
  applyServerRoundEnd: (winner: Side, score: Record<Side, number>) => void;
  applyServerMatchEnd: (winner: Side) => void;
  applyServerCountdown: (countdown: number, isNewMatch: boolean) => void;
  applyServerCombatStart: (round: number) => void;
  applyServerRoundReset: () => void;
  applyServerResume: (phase: RoundPhase, round: number, score: Record<Side, number>) => void;
}

const initial = {
  score: { local: 0, opponent: 0 },
  round: 1,
  phase: "countdown" as RoundPhase,
  countdown: MATCH_CONFIG.countdownSeconds,
  roundWinner: null,
  matchWinner: null,
  opponentDisconnected: false,
  resetSignal: 0,
  damageDealt: 0,
};

export const useMatchStore = create<MatchState>((set, get) => ({
  ...initial,
  addDamageDealt: (amount) => set((s) => ({ damageDealt: s.damageDealt + Math.max(0, amount) })),
  startMatch: () =>
    set((s) => ({
      ...initial,
      score: { local: 0, opponent: 0 },
      phase: "countdown",
      countdown: MATCH_CONFIG.countdownSeconds,
      resetSignal: s.resetSignal + 1,
    })),
  setCountdown: (value) => set({ countdown: value }),
  beginCombat: () => set({ phase: "combat" }),
  endRound: (winner) => {
    const score = { ...get().score };
    score[winner] += 1;
    const matchWinner = score[winner] >= MATCH_CONFIG.roundsToWin ? winner : null;
    set({
      score,
      roundWinner: winner,
      phase: matchWinner ? "match-end" : "round-end",
      matchWinner,
    });
  },
  advanceRound: () =>
    set((s) => ({
      round: s.round + 1,
      phase: "countdown",
      countdown: MATCH_CONFIG.countdownSeconds,
      roundWinner: null,
      resetSignal: s.resetSignal + 1,
    })),
  manualReset: () => set((s) => ({ resetSignal: s.resetSignal + 1 })),
  setOpponentDisconnected: (v) => set({ opponentDisconnected: v }),
  reset: () => set({ ...initial, score: { local: 0, opponent: 0 }, damageDealt: 0 }),
  applyServerRoundEnd: (winner, score) => {
    const matchWinner = score[winner] >= MATCH_CONFIG.roundsToWin ? winner : null;
    set({ score, roundWinner: winner, phase: matchWinner ? "match-end" : "round-end", matchWinner });
  },
  applyServerMatchEnd: (winner) => set({ phase: "match-end", matchWinner: winner }),
  applyServerCountdown: (countdown, isNewMatch) =>
    // "matchStart" fires for two different situations that look identical
    // except for this flag: a genuinely fresh match/rematch (score must
    // reset to 0-0 — see BUG-007) and the ordinary countdown before every
    // next round within an already-running match (score must NOT reset —
    // the first version of this fix got this wrong and reset score after
    // every round, see BUG-009 in TASKS.md/DECISIONS.md).
    set((s) => ({
      phase: "countdown",
      countdown,
      round: isNewMatch ? 1 : s.round,
      score: isNewMatch ? { local: 0, opponent: 0 } : s.score,
      damageDealt: isNewMatch ? 0 : s.damageDealt,
      roundWinner: null,
      matchWinner: null,
      resetSignal: s.resetSignal + 1,
    })),
  applyServerCombatStart: (round) => set({ phase: "combat", round }),
  applyServerRoundReset: () => set((s) => ({ resetSignal: s.resetSignal + 1 })),
  // Hydrates a client that reconnected mid-match (see MatchResumeMsg /
  // BUG-008) so it lands directly back in the ongoing match instead of the
  // pre-match lobby. Does NOT bump resetSignal — the reconnecting player's
  // own position/spawn should not reset; RemotePlayer/LocalPlayer pick up
  // health/shield/builds separately from the same resume message.
  applyServerResume: (phase, round, score) =>
    // Note: MatchResumeMsg doesn't carry a winner, so reconnecting exactly
    // during a match-end/round-end window won't show the winner banner
    // correctly until the next round-end message — a known, minor gap.
    set({ phase, round, score, roundWinner: null, matchWinner: null }),
}));
