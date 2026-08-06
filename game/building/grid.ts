import { BUILD_CONFIG, BUILD_TYPES, type BuildKind } from "../config/builds";
import { ARENA_BOUNDS, MOVEMENT } from "../config/movement";
import type { BuildInstance } from "./types";

export function snapToGrid(value: number, grid: number = BUILD_CONFIG.gridSize): number {
  return Math.round(value / grid) * grid;
}

/** World-space half-extents of a build's AABB accounting for 90-degree rotation. */
export function footprintHalfExtents(kind: BuildKind, rotationY: number): [number, number, number] {
  const cfg = BUILD_TYPES[kind];
  const rotated = Math.abs(Math.round(rotationY / (Math.PI / 2))) % 2 === 1;
  const w = rotated ? cfg.depth : cfg.width;
  const d = rotated ? cfg.width : cfg.depth;
  return [w / 2, cfg.height / 2, d / 2];
}

export function aabbOverlap(
  aPos: [number, number, number],
  aHalf: [number, number, number],
  bPos: [number, number, number],
  bHalf: [number, number, number],
  tolerance = 0.15
): boolean {
  return (
    Math.abs(aPos[0] - bPos[0]) < aHalf[0] + bHalf[0] - tolerance &&
    Math.abs(aPos[1] - bPos[1]) < aHalf[1] + bHalf[1] - tolerance &&
    Math.abs(aPos[2] - bPos[2]) < aHalf[2] + bHalf[2] - tolerance
  );
}

export function isWithinArenaBounds(pos: [number, number, number], half: [number, number, number]): boolean {
  return (
    pos[0] - half[0] > -ARENA_BOUNDS.halfX &&
    pos[0] + half[0] < ARENA_BOUNDS.halfX &&
    pos[2] - half[2] > -ARENA_BOUNDS.halfZ &&
    pos[2] + half[2] < ARENA_BOUNDS.halfZ &&
    pos[1] < ARENA_BOUNDS.wallHeight
  );
}

export function overlapsAnyPlayer(
  pos: [number, number, number],
  half: [number, number, number],
  playerPositions: [number, number, number][],
  clearance = MOVEMENT.capsuleRadius + 0.5
): boolean {
  return playerPositions.some((p) => {
    const dx = Math.abs(pos[0] - p[0]);
    const dz = Math.abs(pos[2] - p[2]);
    return dx < half[0] + clearance && dz < half[2] + clearance;
  });
}

export interface PlacementResult {
  valid: boolean;
  position: [number, number, number];
  rotationY: number;
}

export type OverlapCandidate = Pick<BuildInstance, "kind" | "position" | "rotationY">;

export function validatePlacement(
  kind: BuildKind,
  rawPosition: [number, number, number],
  rotationY: number,
  existingBuilds: OverlapCandidate[],
  playerPositions: [number, number, number][],
  activeCountForOwner: number
): PlacementResult {
  const grid = BUILD_CONFIG.gridSize;
  const cfg = BUILD_TYPES[kind];
  const snappedX = snapToGrid(rawPosition[0], grid);
  const snappedZ = snapToGrid(rawPosition[2], grid);
  const groundY = cfg.height / 2;
  const snappedY = snapToGrid(Math.max(rawPosition[1], groundY), cfg.height) || groundY;
  const position: [number, number, number] = [snappedX, snappedY, snappedZ];
  const half = footprintHalfExtents(kind, rotationY);

  if (activeCountForOwner >= BUILD_CONFIG.maxActivePerPlayer) {
    return { valid: false, position, rotationY };
  }
  if (!isWithinArenaBounds(position, half)) {
    return { valid: false, position, rotationY };
  }
  if (overlapsAnyPlayer(position, half, playerPositions)) {
    return { valid: false, position, rotationY };
  }
  const overlapsBuild = existingBuilds.some((b) => {
    const bHalf = footprintHalfExtents(b.kind, b.rotationY);
    return aabbOverlap(position, half, b.position, bHalf);
  });
  if (overlapsBuild) {
    return { valid: false, position, rotationY };
  }
  return { valid: true, position, rotationY };
}
