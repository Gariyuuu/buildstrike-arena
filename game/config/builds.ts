export type BuildKind = "wall" | "floor" | "ramp";

export interface BuildTypeConfig {
  kind: BuildKind;
  health: number;
  width: number;
  height: number;
  depth: number;
}

export const BUILD_TYPES: Record<BuildKind, BuildTypeConfig> = {
  wall: { kind: "wall", health: 150, width: 4, height: 4, depth: 0.3 },
  floor: { kind: "floor", health: 150, width: 4, height: 0.3, depth: 4 },
  ramp: { kind: "ramp", health: 150, width: 4, height: 4, depth: 4 },
};

export const BUILD_CONFIG = {
  gridSize: 4,
  maxActivePerPlayer: 12,
  placementCooldown: 0.25, // seconds
  placeRange: 8, // max distance from player to placement point
  destructionEffectDuration: 0.6,
} as const;
