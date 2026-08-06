import type { WeaponId } from "@/game/config/weapons";
import type { BuildKind } from "@/game/config/builds";
import type { HealingItemId } from "@/game/config/healing";

export type Vec3 = [number, number, number];

/**
 * Abstracts "how the local player's actions reach the rest of the match" so
 * combat/building/healing logic in LocalPlayer works identically whether
 * we're in a fully local bot duel or a networked 1v1.
 */
export interface GameAdapter {
  mode: "bot" | "online";
  requestBuildPlacement: (kind: BuildKind, position: Vec3, rotationY: number) => void;
  reportFire: (
    weapon: WeaponId,
    origin: Vec3,
    direction: Vec3,
    hit?: { kind: "player"; headshot: boolean; pellets: number } | { kind: "build"; buildId: string; pellets: number }
  ) => void;
  reportHeal: (item: HealingItemId, event: "start" | "cancel" | "complete") => void;
  sendState: (state: {
    position: Vec3;
    rotationY: number;
    isBuildMode: boolean;
    buildKind: BuildKind;
    weapon: WeaponId;
  }) => void;
  getOpponentPosition: () => Vec3 | null;
}
