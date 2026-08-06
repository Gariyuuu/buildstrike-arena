"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { levelFromTotalXp, rewardForLevel, XP_AWARDS, COIN_AWARDS, MAX_LEVEL } from "@/game/config/levels";
import { DAILY_REWARD_CYCLE, type DailyReward } from "@/game/config/dailyRewards";

const SAVE_VERSION = 1;

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export interface ProfileStats {
  wins: number;
  losses: number;
  matchesPlayed: number;
  eliminations: number;
  totalDamage: number;
  currentWinStreak: number;
  highestWinStreak: number;
  weaponDamage: Record<string, number>;
}

interface MatchResultInput {
  won: boolean;
  eliminations: number;
  damage: number;
}

interface MatchResultOutcome {
  xpGained: number;
  coinsGained: number;
  leveledUp: boolean;
  newLevel: number;
  firstWinOfDay: boolean;
}

interface ProfileState {
  saveVersion: number;
  displayName: string;
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  coins: number;
  stats: ProfileStats;
  dailyRewardLastClaimed: string | null;
  dailyRewardCycleDay: number; // 1-7, the day that will be claimed next
  lastWinDate: string | null;
  setDisplayName: (name: string) => void;
  addXp: (amount: number) => { leveledUp: boolean; newLevel: number };
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addWeaponDamage: (weaponId: string, amount: number) => void;
  recordMatchResult: (input: MatchResultInput) => MatchResultOutcome;
  canClaimDailyReward: () => boolean;
  claimDailyReward: () => DailyReward | null;
  reset: () => void;
}

const initialStats: ProfileStats = {
  wins: 0,
  losses: 0,
  matchesPlayed: 0,
  eliminations: 0,
  totalDamage: 0,
  currentWinStreak: 0,
  highestWinStreak: 0,
  weaponDamage: {},
};

function freshState() {
  return {
    saveVersion: SAVE_VERSION,
    displayName: "Recruit",
    totalXp: 0,
    level: 1,
    xpIntoLevel: 0,
    xpForNextLevel: 250,
    coins: 0,
    stats: { ...initialStats, weaponDamage: {} },
    dailyRewardLastClaimed: null as string | null,
    dailyRewardCycleDay: 1,
    lastWinDate: null as string | null,
  };
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      ...freshState(),

      setDisplayName: (name) => set({ displayName: name.trim().slice(0, 16) || "Recruit" }),

      addXp: (amount) => {
        const prevLevel = get().level;
        const totalXp = get().totalXp + Math.max(0, amount);
        const { level, xpIntoLevel, xpForNextLevel } = levelFromTotalXp(totalXp);
        let coinsBonus = 0;
        for (let lv = prevLevel; lv < level; lv++) coinsBonus += rewardForLevel(lv + 1).coins;
        set((s) => ({ totalXp, level, xpIntoLevel, xpForNextLevel, coins: s.coins + coinsBonus }));
        return { leveledUp: level > prevLevel, newLevel: level };
      },

      addCoins: (amount) => set((s) => ({ coins: s.coins + Math.max(0, amount) })),

      spendCoins: (amount) => {
        if (get().coins < amount) return false;
        set((s) => ({ coins: s.coins - amount }));
        return true;
      },

      addWeaponDamage: (weaponId, amount) =>
        set((s) => ({
          stats: {
            ...s.stats,
            weaponDamage: { ...s.stats.weaponDamage, [weaponId]: (s.stats.weaponDamage[weaponId] ?? 0) + amount },
          },
        })),

      recordMatchResult: ({ won, eliminations, damage }) => {
        const today = todayKey();
        const firstWinOfDay = won && get().lastWinDate !== today;

        let xpGained = XP_AWARDS.matchComplete;
        xpGained += eliminations * XP_AWARDS.elimination;
        xpGained += Math.floor(damage / 500) * XP_AWARDS.per500Damage;
        if (won) xpGained += XP_AWARDS.matchWin;
        if (firstWinOfDay) xpGained += XP_AWARDS.firstWinOfDay;

        let coinsGained = COIN_AWARDS.matchComplete;
        if (won) coinsGained += COIN_AWARDS.matchWin;

        set((s) => {
          const nextStreak = won ? s.stats.currentWinStreak + 1 : 0;
          return {
            stats: {
              ...s.stats,
              wins: s.stats.wins + (won ? 1 : 0),
              losses: s.stats.losses + (won ? 0 : 1),
              matchesPlayed: s.stats.matchesPlayed + 1,
              eliminations: s.stats.eliminations + eliminations,
              totalDamage: s.stats.totalDamage + damage,
              currentWinStreak: nextStreak,
              highestWinStreak: Math.max(s.stats.highestWinStreak, nextStreak),
            },
            lastWinDate: firstWinOfDay ? today : s.lastWinDate,
            coins: s.coins + coinsGained,
          };
        });

        const { leveledUp, newLevel } = get().addXp(xpGained);
        return { xpGained, coinsGained, leveledUp, newLevel, firstWinOfDay };
      },

      canClaimDailyReward: () => get().dailyRewardLastClaimed !== todayKey(),

      claimDailyReward: () => {
        const today = todayKey();
        const { dailyRewardLastClaimed, dailyRewardCycleDay } = get();
        if (dailyRewardLastClaimed === today) return null;

        // Missing more than one calendar day resets the cycle back to day 1
        // instead of letting it silently skip ahead.
        const dayIndex =
          dailyRewardLastClaimed && daysBetween(dailyRewardLastClaimed, today) === 1 ? dailyRewardCycleDay : 1;
        const reward = DAILY_REWARD_CYCLE[dayIndex - 1];
        const nextCycleDay = dayIndex >= 7 ? 1 : dayIndex + 1;

        set({ dailyRewardLastClaimed: today, dailyRewardCycleDay: nextCycleDay });
        if (reward.kind === "coins" && reward.coins) get().addCoins(reward.coins);
        else if (reward.kind === "cosmetic") get().addCoins(reward.cosmeticRarity === "rare" ? 500 : 100); // cosmetic pool not wired yet — coin fallback, see Phase 7
        return { ...reward, day: dayIndex };
      },

      reset: () => set(freshState()),
    }),
    {
      name: "buildstrike-profile",
      version: SAVE_VERSION,
      migrate: (persisted) => persisted as ProfileState, // no prior versions exist yet; placeholder for future migrations
    }
  )
);

export { MAX_LEVEL };
