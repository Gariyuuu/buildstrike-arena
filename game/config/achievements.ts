// Lifetime achievements, checked against profileStore.stats (and level)
// after every match. All read cumulative career stats already tracked
// there — no separate achievement-only counters needed except the
// "Win Without Healing" special flag (see stats.hasWonWithoutHealing).
export type AchievementMetric = "wins" | "eliminations" | "buildsPlaced" | "totalDamage" | "highestWinStreak" | "matchesPlayed" | "healsUsed" | "level" | "wonWithoutHealing";

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  metric: AchievementMetric;
  target: number;
  rewardCoins: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "ach-first-win", name: "First Win", description: "Win your first match.", metric: "wins", target: 1, rewardCoins: 200 },
  { id: "ach-10-wins", name: "Getting Good", description: "Win 10 matches.", metric: "wins", target: 10, rewardCoins: 400 },
  { id: "ach-50-wins", name: "Arena Veteran", description: "Win 50 matches.", metric: "wins", target: 50, rewardCoins: 1000 },
  { id: "ach-100-wins", name: "Arena Legend", description: "Win 100 matches.", metric: "wins", target: 100, rewardCoins: 2000 },
  { id: "ach-first-elim", name: "First Blood", description: "Get your first elimination.", metric: "eliminations", target: 1, rewardCoins: 100 },
  { id: "ach-50-elims", name: "Sharpshooter", description: "Reach 50 career eliminations.", metric: "eliminations", target: 50, rewardCoins: 400 },
  { id: "ach-100-elims", name: "Centurion", description: "Reach 100 career eliminations.", metric: "eliminations", target: 100, rewardCoins: 700 },
  { id: "ach-500-elims", name: "Executioner", description: "Reach 500 career eliminations.", metric: "eliminations", target: 500, rewardCoins: 1500 },
  { id: "ach-builds-100", name: "Handyman", description: "Place 100 builds.", metric: "buildsPlaced", target: 100, rewardCoins: 300 },
  { id: "ach-builds-1000", name: "Master Builder", description: "Place 1,000 builds.", metric: "buildsPlaced", target: 1000, rewardCoins: 1200 },
  { id: "ach-damage-10000", name: "Heavy Hitter", description: "Deal 10,000 career damage.", metric: "totalDamage", target: 10000, rewardCoins: 500 },
  { id: "ach-damage-100000", name: "Wrecking Ball", description: "Deal 100,000 career damage.", metric: "totalDamage", target: 100000, rewardCoins: 2000 },
  { id: "ach-streak-5", name: "On a Roll", description: "Reach a 5 match win streak.", metric: "highestWinStreak", target: 5, rewardCoins: 500 },
  { id: "ach-streak-10", name: "Unstoppable", description: "Reach a 10 match win streak.", metric: "highestWinStreak", target: 10, rewardCoins: 1000 },
  { id: "ach-no-heal-win", name: "Win Without Healing", description: "Win a match without using a single healing item.", metric: "wonWithoutHealing", target: 1, rewardCoins: 600 },
  { id: "ach-matches-10", name: "Regular", description: "Play 10 matches.", metric: "matchesPlayed", target: 10, rewardCoins: 200 },
  { id: "ach-matches-50", name: "Dedicated", description: "Play 50 matches.", metric: "matchesPlayed", target: 50, rewardCoins: 600 },
  { id: "ach-matches-100", name: "Committed", description: "Play 100 matches.", metric: "matchesPlayed", target: 100, rewardCoins: 1200 },
  { id: "ach-heals-50", name: "Field Medic", description: "Use 50 healing items.", metric: "healsUsed", target: 50, rewardCoins: 400 },
  { id: "ach-level-10", name: "Rising Star", description: "Reach level 10.", metric: "level", target: 10, rewardCoins: 300 },
  { id: "ach-level-25", name: "Seasoned", description: "Reach level 25.", metric: "level", target: 25, rewardCoins: 800 },
  { id: "ach-level-50", name: "Max Level", description: "Reach level 50.", metric: "level", target: 50, rewardCoins: 2500 },
];
