import type { BuildKind } from "../config/builds";
import type { EntitySide } from "../shared/side";

export interface BuildInstance {
  id: string;
  kind: BuildKind;
  owner: EntitySide;
  position: [number, number, number];
  rotationY: number; // 0, PI/2, PI, 3PI/2
  health: number;
  maxHealth: number;
}
