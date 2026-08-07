"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type KeybindAction =
  | "buildWall"
  | "buildFloor"
  | "buildRamp"
  | "toggleBuildMode"
  | "reload"
  | "rotateBuild"
  | "melee"
  | "sprint"
  | "jump"
  | "emoteWheel";

export const KEYBIND_LABELS: Record<KeybindAction, string> = {
  buildWall: "Build Wall",
  buildFloor: "Build Floor",
  buildRamp: "Build Ramp",
  toggleBuildMode: "Toggle Build Mode",
  reload: "Reload",
  rotateBuild: "Rotate Build",
  melee: "Melee Attack",
  sprint: "Sprint",
  jump: "Jump",
  emoteWheel: "Emote Wheel",
};

// Values here MUST match hooks/useKeyboard.ts's normalizeKey() output format
// exactly (lowercase single chars, "shift", " " for space) — both the game
// loop (via useKeyboard) and HUD.tsx's raw emote-wheel listener compare
// against these same strings.
export const DEFAULT_KEYBINDS: Record<KeybindAction, string> = {
  buildWall: "z",
  buildFloor: "x",
  buildRamp: "c",
  toggleBuildMode: "q",
  reload: "r",
  rotateBuild: "f",
  melee: "v",
  sprint: "shift",
  jump: " ",
  emoteWheel: "b",
};

export function formatKeyLabel(key: string): string {
  if (key === " ") return "Space";
  if (key === "shift") return "Shift";
  if (key === "escape") return "Esc";
  if (key === "control") return "Ctrl";
  if (key === "alt") return "Alt";
  return key.toUpperCase();
}

interface KeybindsState {
  binds: Record<KeybindAction, string>;
  setBind: (action: KeybindAction, key: string) => void;
  reset: () => void;
}

export const useKeybindsStore = create<KeybindsState>()(
  persist(
    (set) => ({
      binds: { ...DEFAULT_KEYBINDS },
      setBind: (action, key) => set((s) => ({ binds: { ...s.binds, [action]: key } })),
      reset: () => set({ binds: { ...DEFAULT_KEYBINDS } }),
    }),
    { name: "buildstrike-keybinds" }
  )
);
