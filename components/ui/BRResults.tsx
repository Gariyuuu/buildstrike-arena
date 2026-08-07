"use client";

import { useBRStore } from "@/stores/brStore";
import { useGameStore } from "@/stores/gameStore";
import { useProfileStore } from "@/stores/profileStore";
import { soundManager } from "@/game/audio/soundManager";

export function BRResults() {
  const phase = useBRStore((s) => s.phase);
  const placement = useBRStore((s) => s.placement);
  const won = phase === "victory";

  if (phase !== "victory" && phase !== "eliminated") return null;

  function backToLobby() {
    soundManager.play("uiClick");
    if (won) useProfileStore.getState().addCoins(500);
    else useProfileStore.getState().addCoins(100);
    useBRStore.getState().reset();
    useGameStore.getState().setMode(null);
    useGameStore.getState().setScreen("menu");
  }

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel bs-pop-in w-full max-w-md p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Battle Royale</p>
        <h2 className={`mt-2 text-4xl font-black ${won ? "text-bs-cyan" : "text-white"}`}>{won ? "Victory Royale!" : "Eliminated"}</h2>
        {!won && placement && <p className="mt-2 text-lg font-semibold text-white/60">#{placement} — {placement} squads remained</p>}
        <p className="mt-4 font-mono text-sm text-bs-orange">+{won ? 500 : 100} Coins</p>
        <button className="btn-primary mt-6 w-full" onClick={backToLobby}>
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
