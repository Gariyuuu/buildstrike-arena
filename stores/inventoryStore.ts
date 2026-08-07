"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SKIN_ID, DEFAULT_WRAP_ID, DEFAULT_PICKAXE_ID, type CosmeticCategory } from "@/game/config/cosmetics";

const DEFAULT_BANNER_ID = "banner-default";
const DEFAULT_ICON_ID = "icon-default";

export type EquippedSlots = {
  skin: string;
  backAccessory: string | null;
  pickaxe: string;
  weaponWrap: string;
  emote: (string | null)[]; // up to 4 equipped emote slots
  banner: string;
  icon: string;
};

interface InventoryState {
  owned: string[]; // cosmetic ids, across all categories
  equipped: EquippedSlots;
  isOwned: (id: string) => boolean;
  grant: (id: string) => void;
  equip: (category: CosmeticCategory, id: string | null, emoteSlot?: number) => void;
  reset: () => void;
}

const STARTER_OWNED = [DEFAULT_SKIN_ID, DEFAULT_WRAP_ID, DEFAULT_PICKAXE_ID, DEFAULT_BANNER_ID, DEFAULT_ICON_ID];

const freshEquipped = (): EquippedSlots => ({
  skin: DEFAULT_SKIN_ID,
  backAccessory: null,
  pickaxe: DEFAULT_PICKAXE_ID,
  weaponWrap: DEFAULT_WRAP_ID,
  emote: [null, null, null, null],
  banner: DEFAULT_BANNER_ID,
  icon: DEFAULT_ICON_ID,
});

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      owned: [...STARTER_OWNED],
      equipped: freshEquipped(),
      isOwned: (id) => get().owned.includes(id),
      grant: (id) => set((s) => (s.owned.includes(id) ? s : { owned: [...s.owned, id] })),
      equip: (category, id, emoteSlot) =>
        set((s) => {
          if (category === "emote") {
            const slot = emoteSlot ?? 0;
            const emote = [...s.equipped.emote];
            emote[slot] = id;
            return { equipped: { ...s.equipped, emote } };
          }
          if (category === "skin") return { equipped: { ...s.equipped, skin: id ?? DEFAULT_SKIN_ID } };
          if (category === "weaponWrap") return { equipped: { ...s.equipped, weaponWrap: id ?? DEFAULT_WRAP_ID } };
          if (category === "pickaxe") return { equipped: { ...s.equipped, pickaxe: id ?? DEFAULT_PICKAXE_ID } };
          if (category === "banner") return { equipped: { ...s.equipped, banner: id ?? DEFAULT_BANNER_ID } };
          if (category === "icon") return { equipped: { ...s.equipped, icon: id ?? DEFAULT_ICON_ID } };
          return { equipped: { ...s.equipped, [category]: id } };
        }),
      reset: () => set({ owned: [...STARTER_OWNED], equipped: freshEquipped() }),
    }),
    { name: "buildstrike-inventory" }
  )
);
