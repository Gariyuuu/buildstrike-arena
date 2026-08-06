"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useMatchStore } from "@/stores/matchStore";
import { useBuildsStore } from "@/stores/buildsStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useNetworkStore } from "@/stores/networkStore";
import { getActiveClient } from "@/game/networking/activeClient";
import { soundManager } from "@/game/audio/soundManager";
import { SettingsPanel } from "@/components/ui/SettingsPanel";

export function PauseMenu({ requestUnlock }: { requestUnlock: () => void }) {
  const setPaused = useGameStore((s) => s.setPaused);
  const setScreen = useGameStore((s) => s.setScreen);
  const mode = useGameStore((s) => s.mode);
  const [showSettings, setShowSettings] = useState(false);

  function resume() {
    soundManager.play("uiClick");
    setPaused(false);
    requestUnlock();
  }

  function resetArena() {
    soundManager.play("uiClick");
    useBuildsStore.getState().clear();
    usePlayerStore.getState().resetForRound();
    if (mode === "online") {
      getActiveClient()?.send({ type: "resetRequest" });
    } else {
      useMatchStore.getState().manualReset();
    }
  }

  function returnToMenu() {
    soundManager.play("uiClick");
    setPaused(false);
    if (mode === "online") getActiveClient()?.send({ type: "leave" });
    useNetworkStore.getState().reset();
    useMatchStore.getState().reset();
    useBuildsStore.getState().clear();
    useGameStore.getState().setMode(null);
    setScreen("menu");
  }

  if (showSettings) {
    return (
      <div className="absolute inset-0 z-30">
        <SettingsPanel onBack={() => setShowSettings(false)} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel bs-pop-in w-full max-w-sm p-6">
        <h2 className="mb-5 text-center text-2xl font-black text-white">Paused</h2>
        <div className="flex flex-col gap-3">
          <button className="btn-primary" onClick={resume}>
            Resume
          </button>
          <button className="btn-secondary" onClick={resetArena}>
            Reset Arena
          </button>
          <button className="btn-secondary" onClick={() => setShowSettings(true)}>
            Settings
          </button>
          <button className="btn-orange" onClick={returnToMenu}>
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
