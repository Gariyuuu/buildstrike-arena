"use client";

import { create } from "zustand";

export type GameScreen = "menu" | "instructions" | "settings" | "playing";

export type GameMode = "bot" | "online" | "training" | null;

interface GameState {
  screen: GameScreen;
  mode: GameMode;
  paused: boolean;
  hasSeenControls: boolean;
  setScreen: (screen: GameScreen) => void;
  setMode: (mode: GameMode) => void;
  setPaused: (paused: boolean) => void;
  markControlsSeen: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  screen: "menu",
  mode: null,
  paused: false,
  hasSeenControls: false,
  setScreen: (screen) => set({ screen }),
  setMode: (mode) => set({ mode }),
  setPaused: (paused) => set({ paused }),
  markControlsSeen: () => set({ hasSeenControls: true }),
}));
