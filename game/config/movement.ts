// Player movement tuning shared by local player, remote players and bots.
export const MOVEMENT = {
  walkSpeed: 5.2,
  sprintMultiplier: 1.55,
  airControl: 0.5,
  jumpVelocity: 6.2,
  gravity: -18,
  capsuleRadius: 0.4,
  capsuleHalfHeight: 0.55, // half-height of cylinder part, total height ~ 2*(half+radius)
  eyeHeight: 1.55,
  maxFallSpeed: -30,
  turnSmoothing: 14, // higher = snappier body rotation toward aim
} as const;

export const ARENA_BOUNDS = {
  halfX: 22,
  halfZ: 22,
  wallHeight: 8,
} as const;
