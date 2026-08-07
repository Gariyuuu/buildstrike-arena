"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WeaponId } from "@/game/config/weapons";

interface LoadoutState {
  primary: WeaponId;
  secondary: WeaponId;
  setPrimary: (id: WeaponId) => void;
  setSecondary: (id: WeaponId) => void;
  setDefault: () => void;
}

// Defaults preserve this project's original loadout exactly (rifle +
// shotgun), so a player who never opens the loadout picker gets identical
// behavior to before this system existed.
const DEFAULTS = { primary: "rifle" as WeaponId, secondary: "shotgun" as WeaponId };

export const useLoadoutStore = create<LoadoutState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setPrimary: (id) => set({ primary: id }),
      setSecondary: (id) => set({ secondary: id }),
      setDefault: () => set(DEFAULTS),
    }),
    { name: "buildstrike-loadout" }
  )
);
