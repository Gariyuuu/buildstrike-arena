// Layout of the static arena: floor size, boundary walls and the classic
// center double-ramp structure. All original geometry, no external assets.
export const ARENA = {
  floorSize: 44,
  boundaryHeight: 8,
  boundaryThickness: 1,
  centerRampSpan: 10,
} as const;

export interface DecorProp {
  position: [number, number, number];
  scale: [number, number, number];
  rotationY: number;
  kind: "pillar" | "crate" | "spire";
}

// Decorative scenery placed OUTSIDE the playable zone (beyond boundary walls).
export const ARENA_DECOR: DecorProp[] = [
  { position: [-30, 3, -30], scale: [2, 6, 2], rotationY: 0.3, kind: "pillar" },
  { position: [30, 4, -30], scale: [2, 8, 2], rotationY: -0.2, kind: "spire" },
  { position: [-30, 3, 30], scale: [2, 6, 2], rotationY: 0.5, kind: "pillar" },
  { position: [30, 3, 30], scale: [2, 6, 2], rotationY: -0.4, kind: "pillar" },
  { position: [-26, 1, 0], scale: [1.6, 2, 1.6], rotationY: 0.2, kind: "crate" },
  { position: [26, 1, 0], scale: [1.6, 2, 1.6], rotationY: -0.3, kind: "crate" },
  { position: [0, 5, -34], scale: [2.4, 10, 2.4], rotationY: 0, kind: "spire" },
  { position: [0, 5, 34], scale: [2.4, 10, 2.4], rotationY: 0, kind: "spire" },
];
