"use client";

import { create } from "zustand";
import { WEAPONS, WEAPON_ORDER, type WeaponId } from "@/game/config/weapons";
import { HEALING } from "@/game/config/healing";
import { MATCH_CONFIG } from "@/game/config/match";
import type { BuildKind } from "@/game/config/builds";

export type SelectedItem = WeaponId | "shieldPotion" | "medkit";

export interface HudState {
  health: number;
  shield: number;
  ammoInMag: number;
  reserveAmmo: number;
  weapon: WeaponId;
  selected: SelectedItem;
  isBuildMode: boolean;
  buildKind: BuildKind;
  isReloading: boolean;
  isHealing: boolean;
  healProgress: number;
  healingCounts: { shieldPotion: number; medkit: number };
  isDead: boolean;
  connectionPing: number;
}

interface PlayerState {
  local: HudState;
  opponent: { health: number; shield: number; connected: boolean };
  hitMarker: number; // timestamp trigger for hit marker flash
  damageFlash: number; // timestamp trigger for damage screen flash
  buildDenied: number; // timestamp trigger for build-rejected flash
  eliminationMessage: string | null;
  setLocal: (partial: Partial<HudState>) => void;
  setOpponent: (partial: Partial<PlayerState["opponent"]>) => void;
  triggerHitMarker: () => void;
  triggerDamageFlash: () => void;
  triggerBuildDenied: () => void;
  setEliminationMessage: (msg: string | null) => void;
  cycleWeapon: () => void;
  resetForRound: () => void;
}

function freshHud(): HudState {
  return {
    health: MATCH_CONFIG.maxHealth,
    shield: 0,
    ammoInMag: WEAPONS.rifle.magazineSize,
    reserveAmmo: WEAPONS.rifle.magazineSize * 3,
    weapon: "rifle",
    selected: "rifle",
    isBuildMode: false,
    buildKind: "wall",
    isReloading: false,
    isHealing: false,
    healProgress: 0,
    healingCounts: {
      shieldPotion: HEALING.shieldPotion.startingCount,
      medkit: HEALING.medkit.startingCount,
    },
    isDead: false,
    connectionPing: 0,
  };
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  local: freshHud(),
  opponent: { health: MATCH_CONFIG.maxHealth, shield: 0, connected: false },
  hitMarker: 0,
  damageFlash: 0,
  buildDenied: 0,
  eliminationMessage: null,
  setLocal: (partial) => set((s) => ({ local: { ...s.local, ...partial } })),
  setOpponent: (partial) => set((s) => ({ opponent: { ...s.opponent, ...partial } })),
  triggerHitMarker: () => set({ hitMarker: performance.now() }),
  triggerDamageFlash: () => set({ damageFlash: performance.now() }),
  triggerBuildDenied: () => set({ buildDenied: performance.now() }),
  setEliminationMessage: (msg) => set({ eliminationMessage: msg }),
  cycleWeapon: () => {
    const cur = get().local.weapon;
    const idx = WEAPON_ORDER.indexOf(cur);
    const next = WEAPON_ORDER[(idx + 1) % WEAPON_ORDER.length];
    set((s) => ({ local: { ...s.local, weapon: next, selected: next } }));
  },
  resetForRound: () =>
    set((s) => ({
      local: freshHud(),
      opponent: { ...s.opponent, health: MATCH_CONFIG.maxHealth, shield: 0 },
    })),
}));
