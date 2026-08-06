// Progression curve: 50 levels, each requiring more XP than the last.
// Formula-based rather than a hand-typed table so the curve stays easy to
// re-tune — level N needs BASE + (N-1)*STEP XP to advance from N to N+1.
const BASE_XP_PER_LEVEL = 250;
const XP_STEP_PER_LEVEL = 45;
export const MAX_LEVEL = 50;

export function xpRequiredForLevel(level: number): number {
  // XP needed to go from `level` to `level + 1`.
  return BASE_XP_PER_LEVEL + (level - 1) * XP_STEP_PER_LEVEL;
}

export interface LevelReward {
  coins: number;
  /** True on milestone levels (every 5) — bigger coin bonus, and the level-up UI treats it as a bigger moment. */
  milestone: boolean;
}

export function rewardForLevel(level: number): LevelReward {
  const milestone = level % 5 === 0;
  const coins = milestone ? 150 + level * 4 : 50 + level * 2;
  return { coins, milestone };
}

/** Given a lifetime total XP, derive the current level and progress toward the next one. */
export function levelFromTotalXp(totalXp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
  let level = 1;
  let remaining = totalXp;
  while (level < MAX_LEVEL) {
    const need = xpRequiredForLevel(level);
    if (remaining < need) break;
    remaining -= need;
    level += 1;
  }
  const xpForNextLevel = level >= MAX_LEVEL ? 0 : xpRequiredForLevel(level);
  return { level, xpIntoLevel: remaining, xpForNextLevel };
}

export const XP_AWARDS = {
  matchComplete: 100,
  matchWin: 200, // in addition to matchComplete
  elimination: 50,
  per500Damage: 50,
  firstWinOfDay: 500,
} as const;

export const COIN_AWARDS = {
  matchComplete: 20,
  matchWin: 40,
} as const;
