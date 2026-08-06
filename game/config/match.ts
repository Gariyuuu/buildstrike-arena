export const MATCH_CONFIG = {
  roundsToWin: 5,
  countdownSeconds: 3,
  roundEndDelay: 3, // seconds shown on round winner banner before reset
  maxHealth: 100,
  maxShield: 100,
} as const;

// Forward direction is derived from yaw as (-sin(yaw), 0, -cos(yaw)) — see
// components/game/LocalPlayer.tsx's camera/aim quaternion (Euler "YXZ",
// pitch 0). So yaw 0 faces -Z and yaw PI faces +Z. Each spawn's yaw must
// point back toward the arena center (Z=0), i.e. toward the opposite
// spawn, not away from it — verified live via a two-client Online 1v1
// test (BUG-006, see TASKS.md): with the previous values (a: yaw 0, b:
// yaw PI) both players spawned facing outward/away from each other and
// every shot missed.
export const PLAYER_SPAWNS = {
  a: { position: [0, 1.1, -16] as [number, number, number], yaw: Math.PI },
  b: { position: [0, 1.1, 16] as [number, number, number], yaw: 0 },
} as const;
