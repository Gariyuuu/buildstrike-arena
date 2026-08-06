"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BotDifficulty } from "@/game/config/bots";

export type GraphicsQuality = "low" | "medium" | "high";

interface SettingsState {
  mouseSensitivity: number; // 0.1 - 3
  masterVolume: number; // 0-1
  sfxVolume: number; // 0-1
  graphicsQuality: GraphicsQuality;
  shadowsEnabled: boolean;
  fov: number; // degrees
  crosshairSize: number; // px
  crosshairOpacity: number; // 0-1
  botDifficulty: BotDifficulty;
  showFps: boolean;
  muted: boolean;
  set: (partial: Partial<Omit<SettingsState, "set" | "reset">>) => void;
  reset: () => void;
}

const DEFAULTS = {
  mouseSensitivity: 1,
  masterVolume: 0.8,
  sfxVolume: 0.9,
  graphicsQuality: "medium" as GraphicsQuality,
  shadowsEnabled: true,
  fov: 75,
  crosshairSize: 6,
  crosshairOpacity: 0.9,
  botDifficulty: "normal" as BotDifficulty,
  showFps: false,
  muted: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (partial) => set(partial),
      reset: () => set(DEFAULTS),
    }),
    { name: "buildstrike-settings" }
  )
);
