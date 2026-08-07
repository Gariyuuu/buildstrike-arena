"use client";

import { create } from "zustand";
import type { WeaponId } from "@/game/config/weapons";
import type { HealingItemId } from "@/game/config/healing";
import type { SquadSize } from "@/game/config/battleRoyale";
import { generateRoster, playersAlive, squadCountAlive, LOCAL_AGENT_ID, type BRAgentSpawn } from "@/game/br/roster";

export type BRPhase = "deploying" | "combat" | "victory" | "eliminated";

export interface BRAgentState extends BRAgentSpawn {
  alive: boolean;
  health: number;
}

interface BRLocalWeaponSlot {
  weapon: WeaponId | null;
  ammoInMag: number;
}

interface BRMatchState {
  phase: BRPhase;
  squadSize: SquadSize;
  agents: BRAgentState[];
  matchStartedAt: number; // performance.now() ms, baseline for zone timer
  resetSignal: number;

  // Local player runtime state — kept in this same store (rather than a
  // second one) since BR's HUD needs both match + local state together and
  // they're always consumed as a pair.
  health: number;
  shield: number;
  isDead: boolean;
  slots: [BRLocalWeaponSlot, BRLocalWeaponSlot];
  selectedSlot: 0 | 1;
  isReloading: boolean;
  healingCounts: Record<HealingItemId, number>;
  isHealing: boolean;
  healProgress: number;
  selectedHeal: HealingItemId | null;
  claimedLootIds: string[];
  killedBy: string | null;
  placement: number | null; // 1 = won, N = squads remaining when eliminated

  deploy: (squadSize: SquadSize) => void;
  beginCombat: () => void;
  setLocal: (partial: Partial<Pick<BRMatchState, "health" | "shield" | "isDead" | "isReloading" | "isHealing" | "healProgress" | "selectedHeal" | "selectedSlot">>) => void;
  setSlot: (index: 0 | 1, slot: BRLocalWeaponSlot) => void;
  addHealCharge: (item: HealingItemId, amount: number) => void;
  consumeHealCharge: (item: HealingItemId) => void;
  claimLoot: (id: string) => void;
  damageAgent: (id: string, amount: number) => void;
  eliminateLocal: () => void;
  reset: () => void;
}

const freshSlots = (): [BRLocalWeaponSlot, BRLocalWeaponSlot] => [
  { weapon: null, ammoInMag: 0 },
  { weapon: null, ammoInMag: 0 },
];

export const useBRStore = create<BRMatchState>((set) => ({
  phase: "deploying",
  squadSize: 1,
  agents: [],
  matchStartedAt: 0,
  resetSignal: 0,
  health: 100,
  shield: 0,
  isDead: false,
  slots: freshSlots(),
  selectedSlot: 0,
  isReloading: false,
  healingCounts: { shieldPotion: 0, medkit: 0 },
  isHealing: false,
  healProgress: 0,
  selectedHeal: null,
  claimedLootIds: [],
  killedBy: null,
  placement: null,

  deploy: (squadSize) =>
    set((s) => ({
      phase: "deploying",
      squadSize,
      agents: generateRoster(squadSize).map((a) => ({ ...a, alive: true, health: 100 })),
      health: 100,
      shield: 0,
      isDead: false,
      slots: freshSlots(),
      selectedSlot: 0,
      isReloading: false,
      healingCounts: { shieldPotion: 0, medkit: 0 },
      isHealing: false,
      healProgress: 0,
      selectedHeal: null,
      claimedLootIds: [],
      killedBy: null,
      placement: null,
      resetSignal: s.resetSignal + 1,
    })),

  beginCombat: () => set({ phase: "combat", matchStartedAt: performance.now() }),

  setLocal: (partial) => set(partial),

  setSlot: (index, slot) =>
    set((s) => {
      const slots = [...s.slots] as [BRLocalWeaponSlot, BRLocalWeaponSlot];
      slots[index] = slot;
      return { slots };
    }),

  addHealCharge: (item, amount) =>
    set((s) => ({ healingCounts: { ...s.healingCounts, [item]: Math.min(6, s.healingCounts[item] + amount) } })),

  consumeHealCharge: (item) =>
    set((s) => ({ healingCounts: { ...s.healingCounts, [item]: Math.max(0, s.healingCounts[item] - 1) } })),

  claimLoot: (id) => set((s) => ({ claimedLootIds: [...s.claimedLootIds, id] })),

  damageAgent: (id, amount) =>
    set((s) => {
      const agents = s.agents.map((a) => {
        if (a.id !== id || !a.alive) return a;
        const health = Math.max(0, a.health - amount);
        return { ...a, health, alive: health > 0 };
      });
      const alive = playersAlive(agents);
      const squadsLeft = squadCountAlive(agents);
      const localSquad = agents.find((a) => a.id === LOCAL_AGENT_ID)?.squadId;
      const localSquadAlive = agents.some((a) => a.squadId === localSquad && a.alive);
      if (s.phase === "combat" && localSquadAlive && squadsLeft <= 1 && alive > 0) {
        return { agents, phase: "victory" as BRPhase, placement: 1 };
      }
      return { agents };
    }),

  eliminateLocal: () =>
    set((s) => {
      if (s.phase !== "combat") return s;
      const squadsLeft = squadCountAlive(s.agents);
      return { isDead: true, phase: "eliminated" as BRPhase, placement: squadsLeft };
    }),

  reset: () =>
    set((s) => ({
      phase: "deploying",
      agents: [],
      claimedLootIds: [],
      resetSignal: s.resetSignal + 1,
    })),
}));
