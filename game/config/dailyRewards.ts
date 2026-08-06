export type DailyRewardKind = "coins" | "cosmetic";

export interface DailyReward {
  day: number; // 1-7
  kind: DailyRewardKind;
  coins?: number;
  /** For "cosmetic" days, a rarity hint shown before the cosmetic system resolves an actual item. */
  cosmeticRarity?: "uncommon" | "rare";
  label: string;
}

export const DAILY_REWARD_CYCLE: DailyReward[] = [
  { day: 1, kind: "coins", coins: 100, label: "100 Coins" },
  { day: 2, kind: "coins", coins: 150, label: "150 Coins" },
  { day: 3, kind: "coins", coins: 200, label: "200 Coins" },
  { day: 4, kind: "cosmetic", cosmeticRarity: "uncommon", label: "Uncommon Cosmetic" },
  { day: 5, kind: "coins", coins: 250, label: "250 Coins" },
  { day: 6, kind: "coins", coins: 300, label: "300 Coins" },
  { day: 7, kind: "cosmetic", cosmeticRarity: "rare", label: "Rare Cosmetic or 500 Coins" },
];
