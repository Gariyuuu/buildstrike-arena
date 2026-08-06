export const HEALING = {
  shieldPotion: {
    id: "shieldPotion" as const,
    restore: 50,
    duration: 3.2, // seconds to consume
    startingCount: 3,
  },
  medkit: {
    id: "medkit" as const,
    restore: 100, // fills to full
    duration: 5.5,
    startingCount: 1,
  },
} as const;

export type HealingItemId = keyof typeof HEALING;
