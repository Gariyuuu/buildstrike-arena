"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useMatchStore } from "@/stores/matchStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useBuildsStore } from "@/stores/buildsStore";
import { useNetworkStore } from "@/stores/networkStore";
import { useProfileStore } from "@/stores/profileStore";
import { useQuestStore } from "@/stores/questStore";
import { useAchievementStore } from "@/stores/achievementStore";
import { getActiveClient } from "@/game/networking/activeClient";
import { soundManager } from "@/game/audio/soundManager";

export function MatchResults() {
  const mode = useGameStore((s) => s.mode);
  const setScreen = useGameStore((s) => s.setScreen);
  const matchWinner = useMatchStore((s) => s.matchWinner);
  const score = useMatchStore((s) => s.score);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [reward, setReward] = useState<{ xpGained: number; coinsGained: number; leveledUp: boolean; newLevel: number; firstWinOfDay: boolean } | null>(null);
  const awarded = useRef(false);

  const won = matchWinner === "local";

  // Fires exactly once per match-end: this component only mounts while
  // matchPhase === "match-end" (see HUD.tsx), so an empty-deps effect maps
  // 1:1 onto "a match just finished" regardless of mode or rematch cycles.
  useEffect(() => {
    if (awarded.current) return;
    awarded.current = true;
    const damage = Math.round(useMatchStore.getState().damageDealt);
    const outcome = useProfileStore.getState().recordMatchResult({
      won,
      eliminations: score.local,
      damage,
      healedThisMatch: useMatchStore.getState().healedThisMatch,
    });
    setReward(outcome);
    if (outcome.leveledUp) {
      setTimeout(() => soundManager.play("levelUp"), 500);
    }

    const quests = useQuestStore.getState();
    quests.ensureToday();
    quests.addProgress("matchesPlayed", 1);
    quests.addProgress("damage", damage);
    quests.addProgress("eliminations", score.local);
    if (won) quests.addProgress("wins", 1);
    useAchievementStore.getState().checkAchievements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function rematch() {
    soundManager.play("uiClick");
    if (mode === "bot") {
      usePlayerStore.getState().resetForRound();
      useBuildsStore.getState().clear();
      useMatchStore.getState().startMatch();
    } else {
      setRematchRequested(true);
      getActiveClient()?.send({ type: "rematchRequest" });
    }
  }

  function returnToMenu() {
    soundManager.play("uiClick");
    if (mode === "online") getActiveClient()?.send({ type: "leave" });
    useNetworkStore.getState().reset();
    useMatchStore.getState().reset();
    useBuildsStore.getState().clear();
    useGameStore.getState().setMode(null);
    setScreen("menu");
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel bs-pop-in w-full max-w-md p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Match Complete</p>
        <h2
          className={`fx-glitch mt-2 text-5xl font-black ${won ? "text-bs-cyan" : "text-bs-orange"}`}
          data-text={won ? "Victory" : "Defeat"}
          style={won ? ({ "--ink-2": "#ff8a33", "--ink-3": "#ff4d4d" } as CSSProperties) : ({ "--ink-2": "#33e6ff", "--ink-3": "#ffffff" } as CSSProperties)}
        >
          {won ? "Victory" : "Defeat"}
        </h2>
        <p className="mt-3 font-mono text-2xl text-white/80">
          {score.local} — {score.opponent}
        </p>

        {reward && (
          <div className="bs-pop-in mt-5 flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-4 py-3">
            {reward.leveledUp && (
              <p className="text-sm font-black uppercase tracking-wider text-bs-cyan">Level Up! → {reward.newLevel}</p>
            )}
            <div className="flex items-center gap-4 font-mono text-sm">
              <span className="text-bs-cyan">+{reward.xpGained} XP</span>
              <span className="text-bs-orange">+{reward.coinsGained} Coins</span>
            </div>
            {reward.firstWinOfDay && <p className="text-[11px] text-white/50">First win of the day bonus included</p>}
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3">
          <button className="btn-primary" onClick={rematch} disabled={rematchRequested}>
            {rematchRequested ? "Waiting for opponent…" : "Rematch"}
          </button>
          <button className="btn-orange" onClick={returnToMenu}>
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
