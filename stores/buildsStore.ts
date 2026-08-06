"use client";

import { create } from "zustand";
import type { BuildInstance } from "@/game/building/types";

interface BuildsState {
  builds: BuildInstance[];
  add: (build: BuildInstance) => void;
  damage: (id: string, newHealth: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useBuildsStore = create<BuildsState>((set) => ({
  builds: [],
  add: (build) => set((s) => ({ builds: [...s.builds, build] })),
  damage: (id, newHealth) =>
    set((s) => ({ builds: s.builds.map((b) => (b.id === id ? { ...b, health: newHealth } : b)) })),
  remove: (id) => set((s) => ({ builds: s.builds.filter((b) => b.id !== id) })),
  clear: () => set({ builds: [] }),
}));
