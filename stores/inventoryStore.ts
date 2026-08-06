"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SKIN_ID, type CosmeticCategory } from "@/game/config/cosmetics";

export type EquippedSlots = {
  skin: string;
  backAccessory: string | null;
  pickaxe: string | null;
  weaponWrap: string | null;
  emote: (string | null)[]; // up to 4 equipped emote slots
  banner: string | null;
  icon: string | null;
};

interface InventoryState {
  owned: string[]; // cosmetic ids, across all categories
  equipped: EquippedSlots;
  isOwned: (id: string) => boolean;
  grant: (id: string) => void;
  equip: (category: CosmeticCategory, id: string | null, emoteSlot?: number) => void;
  reset: () => void;
}

const freshEquipped = (): EquippedSlots => ({
  skin: DEFAULT_SKIN_ID,
  backAccessory: null,
  pickaxe: null,
  weaponWrap: null,
  emote: [null, null, null, null],
  banner: null,
  icon: null,
});

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      owned: [DEFAULT_SKIN_ID],
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
          return { equipped: { ...s.equipped, [category]: id } };
        }),
      reset: () => set({ owned: [DEFAULT_SKIN_ID], equipped: freshEquipped() }),
    }),
    { name: "buildstrike-inventory" }
  )
);
