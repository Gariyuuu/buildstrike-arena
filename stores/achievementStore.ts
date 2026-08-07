"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ACHIEVEMENTS, type AchievementMetric } from "@/game/config/achievements";
import { useProfileStore, type ProfileStats } from "@/stores/profileStore";

interface AchievementState {
  unlocked: string[];
  newlyUnlocked: string[]; // cleared by the UI after showing a toast — see ProfileTab/checkAchievements callers
  isUnlocked: (id: string) => boolean;
  checkAchievements: () => string[]; // returns ids newly unlocked this call
  clearNewlyUnlocked: () => void;
}

function statFor(metric: AchievementMetric, stats: ProfileStats, level: number): number {
  switch (metric) {
    case "wins":
      return stats.wins;
    case "eliminations":
      return stats.eliminations;
    case "buildsPlaced":
      return stats.buildsPlaced;
    case "totalDamage":
      return stats.totalDamage;
    case "highestWinStreak":
      return stats.highestWinStreak;
    case "matchesPlayed":
      return stats.matchesPlayed;
    case "healsUsed":
      return stats.healsUsed;
    case "level":
      return level;
    case "wonWithoutHealing":
      return stats.hasWonWithoutHealing ? 1 : 0;
    default:
      return 0;
  }
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlocked: [],
      newlyUnlocked: [],
      isUnlocked: (id) => get().unlocked.includes(id),
      checkAchievements: () => {
        const profile = useProfileStore.getState();
        const newly: string[] = [];
        for (const def of ACHIEVEMENTS) {
          if (get().unlocked.includes(def.id)) continue;
          if (statFor(def.metric, profile.stats, profile.level) >= def.target) newly.push(def.id);
        }
        if (newly.length > 0) {
          set((s) => ({ unlocked: [...s.unlocked, ...newly], newlyUnlocked: [...s.newlyUnlocked, ...newly] }));
          const totalReward = newly.reduce((sum, id) => sum + (ACHIEVEMENTS.find((a) => a.id === id)?.rewardCoins ?? 0), 0);
          if (totalReward > 0) useProfileStore.getState().addCoins(totalReward);
        }
        return newly;
      },
      clearNewlyUnlocked: () => set({ newlyUnlocked: [] }),
    }),
    { name: "buildstrike-achievements" }
  )
);
