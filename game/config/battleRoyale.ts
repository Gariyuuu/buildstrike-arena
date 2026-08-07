export type SquadSize = 1 | 2 | 3 | 4;

export const SQUAD_SIZE_LABEL: Record<SquadSize, string> = {
  1: "Solo",
  2: "Duo",
  3: "Trio",
  4: "Squad",
};

export const BR_MAX_PLAYERS = 20;

export interface ZonePhase {
  /** Seconds the zone holds still before it starts shrinking toward this phase's radius. */
  waitSeconds: number;
  /** Seconds it takes to shrink from the previous radius to this one. */
  shrinkSeconds: number;
  radius: number;
  damagePerSecond: number;
}

// 8 phases modeled loosely on a classic BR zone progression: long early waits
// and gentle damage, tightening into short, punishing late phases.
export const ZONE_PHASES: ZonePhase[] = [
  { waitSeconds: 40, shrinkSeconds: 55, radius: 150, damagePerSecond: 1 },
  { waitSeconds: 35, shrinkSeconds: 50, radius: 110, damagePerSecond: 1 },
  { waitSeconds: 30, shrinkSeconds: 45, radius: 78, damagePerSecond: 2 },
  { waitSeconds: 28, shrinkSeconds: 40, radius: 52, damagePerSecond: 3 },
  { waitSeconds: 24, shrinkSeconds: 35, radius: 32, damagePerSecond: 4 },
  { waitSeconds: 20, shrinkSeconds: 28, radius: 18, damagePerSecond: 6 },
  { waitSeconds: 16, shrinkSeconds: 22, radius: 9, damagePerSecond: 8 },
  { waitSeconds: 12, shrinkSeconds: 18, radius: 3, damagePerSecond: 10 },
];

export const BR_MAP_RADIUS = 190; // playable half-extent before the first zone shrink starts

export const BR_CONFIG = {
  maxPlayers: BR_MAX_PLAYERS,
  chestCount: 22,
  groundLootCount: 55,
  pickupRange: 2.2,
  chestOpenRange: 2.5,
} as const;
