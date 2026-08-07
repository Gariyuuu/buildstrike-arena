// Daily quest templates. 3 are picked deterministically each day (see
// stores/questStore.ts) from this pool, matching the shop's date-seeded
// rotation approach (game/shop/rotation.ts).
export type QuestMetric = "wins" | "damage" | "eliminations" | "builds" | "matchesPlayed" | "healsUsed";

export interface QuestTemplate {
  id: string;
  description: string;
  metric: QuestMetric;
  target: number;
  xpReward: number;
  coinReward: number;
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  { id: "quest-win-2-rounds", description: "Win 2 rounds", metric: "eliminations", target: 2, xpReward: 150, coinReward: 75 },
  { id: "quest-win-4-rounds", description: "Win 4 rounds", metric: "eliminations", target: 4, xpReward: 250, coinReward: 125 },
  { id: "quest-damage-500", description: "Deal 500 damage", metric: "damage", target: 500, xpReward: 150, coinReward: 75 },
  { id: "quest-damage-1000", description: "Deal 1,000 damage", metric: "damage", target: 1000, xpReward: 250, coinReward: 125 },
  { id: "quest-damage-2000", description: "Deal 2,000 damage", metric: "damage", target: 2000, xpReward: 400, coinReward: 200 },
  { id: "quest-elims-5", description: "Get 5 eliminations", metric: "eliminations", target: 5, xpReward: 200, coinReward: 100 },
  { id: "quest-elims-10", description: "Get 10 eliminations", metric: "eliminations", target: 10, xpReward: 350, coinReward: 175 },
  { id: "quest-builds-20", description: "Place 20 builds", metric: "builds", target: 20, xpReward: 150, coinReward: 75 },
  { id: "quest-builds-50", description: "Place 50 builds", metric: "builds", target: 50, xpReward: 300, coinReward: 150 },
  { id: "quest-heals-3", description: "Use 3 healing items", metric: "healsUsed", target: 3, xpReward: 120, coinReward: 60 },
  { id: "quest-heals-6", description: "Use 6 healing items", metric: "healsUsed", target: 6, xpReward: 220, coinReward: 110 },
  { id: "quest-matches-2", description: "Play 2 matches", metric: "matchesPlayed", target: 2, xpReward: 150, coinReward: 75 },
  { id: "quest-matches-3", description: "Play 3 matches", metric: "matchesPlayed", target: 3, xpReward: 220, coinReward: 110 },
  { id: "quest-win-1-match", description: "Win 1 match", metric: "wins", target: 1, xpReward: 250, coinReward: 150 },
  { id: "quest-win-2-matches", description: "Win 2 matches", metric: "wins", target: 2, xpReward: 400, coinReward: 250 },
];

export const DAILY_QUEST_COUNT = 3;
