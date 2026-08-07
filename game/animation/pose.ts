// Procedural animation pose data for CharacterModel's rig. No GLTF/skeletal
// assets are used anywhere in this project (see README.md) — every pose here
// is a set of target joint rotations (radians) that CharacterModel damps
// toward each frame, giving smooth, blended state transitions without a
// real animation-clip system.

import { WEAPONS, type WeaponId } from "@/game/config/weapons";

export type ArmPoseId = "none" | "rifle" | "shotgun" | "pistol" | "reload" | "heal" | "shield" | "build" | "melee";

/** All 8 weapons share one of these 3 base holding poses via their `visual` class (marksman reuses the rifle stance — both are two-handed long guns). */
export function weaponArmPose(weaponId: WeaponId): ArmPoseId {
  const visual = WEAPONS[weaponId].visual;
  return visual === "pistol" ? "pistol" : visual === "shotgun" ? "shotgun" : "rifle";
}
export type LocomotionId = "idle" | "walk" | "sprint" | "jump" | "fall" | "land";

export interface ArmPoseTarget {
  /** Shoulder pitch (raise forward), left/right. */
  shoulderX: [number, number];
  /** Shoulder roll (spread away from body), left/right. */
  shoulderZ: [number, number];
  /** Elbow bend, left/right. */
  elbowX: [number, number];
  /** Forward torso lean while holding this pose. */
  spineLean: number;
}

export const ARM_POSES: Record<ArmPoseId, ArmPoseTarget> = {
  none: { shoulderX: [0.06, 0.06], shoulderZ: [0.12, 0.12], elbowX: [0.18, 0.18], spineLean: 0 },
  rifle: { shoulderX: [0.95, 1.05], shoulderZ: [0.22, 0.05], elbowX: [1.35, 1.5], spineLean: 0.05 },
  shotgun: { shoulderX: [0.9, 1.0], shoulderZ: [0.26, 0.06], elbowX: [1.25, 1.4], spineLean: 0.06 },
  pistol: { shoulderX: [0.55, 0.85], shoulderZ: [0.3, 0.08], elbowX: [1.1, 1.55], spineLean: 0.03 },
  reload: { shoulderX: [0.75, 0.5], shoulderZ: [0.35, 0.4], elbowX: [1.6, 1.9], spineLean: 0.12 },
  heal: { shoulderX: [0.3, 1.15], shoulderZ: [0.15, 0.1], elbowX: [0.5, 1.85], spineLean: 0.02 },
  shield: { shoulderX: [0.3, 1.15], shoulderZ: [0.15, 0.1], elbowX: [0.5, 1.85], spineLean: 0.02 },
  build: { shoulderX: [0.4, 1.2], shoulderZ: [0.2, 0.04], elbowX: [0.7, 0.35], spineLean: 0.1 },
  melee: { shoulderX: [0.3, 1.8], shoulderZ: [0.15, 0.35], elbowX: [0.4, 0.6], spineLean: 0.2 },
};

export interface LocomotionTarget {
  /** Leg swing amplitude multiplier (0 = still). */
  legAmplitude: number;
  /** Extra hip drop (crouch-like, meters). */
  hipDrop: number;
  /** Forward torso lean. */
  spineLean: number;
  /** Fixed knee bend applied on top of the swing (e.g. tucked while airborne). */
  kneeBend: [number, number];
}

export const LOCOMOTION_POSES: Record<LocomotionId, LocomotionTarget> = {
  idle: { legAmplitude: 0, hipDrop: 0, spineLean: 0, kneeBend: [0.08, 0.08] },
  walk: { legAmplitude: 0.55, hipDrop: 0, spineLean: 0.02, kneeBend: [0.1, 0.1] },
  sprint: { legAmplitude: 0.95, hipDrop: 0.01, spineLean: 0.16, kneeBend: [0.12, 0.12] },
  jump: { legAmplitude: 0, hipDrop: -0.02, spineLean: -0.04, kneeBend: [0.55, 0.75] },
  fall: { legAmplitude: 0, hipDrop: 0, spineLean: -0.02, kneeBend: [0.35, 0.45] },
  land: { legAmplitude: 0, hipDrop: 0.08, spineLean: 0.1, kneeBend: [0.45, 0.45] },
};

/** How quickly (damp lambda) each animation layer blends toward its target — higher = snappier.
 * arms was tuned to 10 (faster than every other layer, including spine at
 * 9) which made the arms visibly snap into pose ahead of the rest of the
 * body — read as stiff/robotic ("arm physics") rather than a natural,
 * connected motion. Lowered to flow at roughly the same rate as the torso. */
export const ANIM_DAMPING = {
  arms: 8,
  locomotion: 8,
  spine: 9,
  headLook: 7,
} as const;

/** Duration (ms) of the one-shot reactive kicks layered on top of the base pose. */
export const ONE_SHOT_DURATIONS = {
  fire: 90,
  hit: 220,
} as const;
