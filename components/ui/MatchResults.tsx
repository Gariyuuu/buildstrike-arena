"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useMatchStore } from "@/stores/matchStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useBuildsStore } from "@/stores/buildsStore";
import { useNetworkStore } from "@/stores/networkStore";
import { getActiveClient } from "@/game/networking/activeClient";
import { soundManager } from "@/game/audio/soundManager";

export function MatchResults() {
  const mode = useGameStore((s) => s.mode);
  const setScreen = useGameStore((s) => s.setScreen);
  const matchWinner = useMatchStore((s) => s.matchWinner);
  const score = useMatchStore((s) => s.score);
  const [rematchRequested, setRematchRequested] = useState(false);

  const won = matchWinner === "local";

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
        <h2 className={`mt-2 text-5xl font-black ${won ? "text-bs-cyan" : "text-bs-orange"}`}>{won ? "Victory" : "Defeat"}</h2>
        <p className="mt-3 font-mono text-2xl text-white/80">
          {score.local} — {score.opponent}
        </p>

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
