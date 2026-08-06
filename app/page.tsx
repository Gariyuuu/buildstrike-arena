"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useGameStore } from "@/stores/gameStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { soundManager } from "@/game/audio/soundManager";
import { MainMenu } from "@/components/ui/MainMenu";
import { InstructionsModal } from "@/components/ui/InstructionsModal";
import { SettingsPanel } from "@/components/ui/SettingsPanel";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const GameCanvas = dynamic(() => import("@/components/game/GameCanvas").then((m) => m.GameCanvas), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Home() {
  const screen = useGameStore((s) => s.screen);
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const muted = useSettingsStore((s) => s.muted);

  useEffect(() => {
    soundManager.setVolumes(masterVolume, sfxVolume, muted);
  }, [masterVolume, sfxVolume, muted]);

  return (
    <div className="h-full w-full">
      {screen === "menu" && <MainMenu />}
      {screen === "instructions" && <InstructionsModal />}
      {screen === "settings" && <SettingsPanel />}
      {screen === "playing" && <GameCanvas />}
    </div>
  );
}
