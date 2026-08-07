"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useGameStore } from "@/stores/gameStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useThemeStore } from "@/stores/themeStore";
import { THEMES, DEFAULT_THEME_ID } from "@/game/config/themes";
import { soundManager } from "@/game/audio/soundManager";
import { Lobby } from "@/components/ui/Lobby";
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
  const themeId = useThemeStore((s) => s.themeId);

  useEffect(() => {
    soundManager.setVolumes(masterVolume, sfxVolume, muted);
  }, [masterVolume, sfxVolume, muted]);

  useEffect(() => {
    const theme = THEMES.find((t) => t.id === themeId) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;
    const root = document.documentElement.style;
    root.setProperty("--bs-cyan", theme.cyan);
    root.setProperty("--bs-cyan-dim", theme.cyanDim);
    root.setProperty("--bs-orange", theme.orange);
  }, [themeId]);

  return (
    <div className="h-full w-full">
      {screen === "menu" && <Lobby />}
      {screen === "instructions" && <InstructionsModal />}
      {screen === "settings" && <SettingsPanel />}
      {screen === "playing" && <GameCanvas />}
    </div>
  );
}
