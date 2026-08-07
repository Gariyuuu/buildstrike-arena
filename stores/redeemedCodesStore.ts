"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RedeemedCodesState {
  redeemed: string[];
  markRedeemed: (code: string) => void;
}

export const useRedeemedCodesStore = create<RedeemedCodesState>()(
  persist(
    (set) => ({
      redeemed: [],
      markRedeemed: (code) => set((s) => (s.redeemed.includes(code) ? s : { redeemed: [...s.redeemed, code] })),
    }),
    { name: "buildstrike-redeemed-codes" }
  )
);
