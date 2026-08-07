export interface RedeemCode {
  code: string; // matched case-insensitively, stored here uppercase
  coins?: number;
  unlockAllCosmetics?: boolean;
  description: string;
}

// One-time-per-code redemption (see stores/redeemedCodesStore.ts) — Arena
// Coins only, never real money, matches the no-gambling/no-real-purchases
// constraint the whole coin system already follows.
export const REDEEM_CODES: RedeemCode[] = [
  { code: "WELCOME100", coins: 100, description: "+100 Coins" },
  { code: "ARENA500", coins: 500, description: "+500 Coins" },
  { code: "BUILDSTRIKE", coins: 1000, description: "+1000 Coins" },
  { code: "GARIYUU", coins: 999999, unlockAllCosmetics: true, description: "Dev code: unlimited coins + every cosmetic unlocked" },
];

export function findCode(input: string): RedeemCode | null {
  const normalized = input.trim().toUpperCase();
  return REDEEM_CODES.find((c) => c.code === normalized) ?? null;
}
