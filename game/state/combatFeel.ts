/**
 * Frame-updated combat-feel signals shared between LocalPlayer (which
 * computes them) and HTML overlay components outside the R3F canvas
 * (Crosshair, directional damage indicator) that can't read refs directly.
 * Same rationale as positionTracker.ts: avoids a React re-render every
 * frame for values that change continuously.
 */
class CombatFeel {
  /** 0-1, how "open" the crosshair should be right now (movement + recent fire). */
  crosshairBloom = 0;
  /** Local player's current camera yaw (radians), updated every frame — read when translating a hit's world direction into a screen-relative bearing. */
  localYaw = 0;
}

export const combatFeel = new CombatFeel();

/** Bearing (radians) from the local player's current facing to a world point — 0 = directly ahead, +/-PI = directly behind. Matches this project's yaw convention: forward = (-sin(yaw), 0, -cos(yaw)). */
export function bearingToWorldPoint(fromX: number, fromZ: number, toX: number, toZ: number): number {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  const worldAngle = Math.atan2(-dx, -dz);
  let bearing = worldAngle - combatFeel.localYaw;
  bearing = ((bearing + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (bearing < -Math.PI) bearing += Math.PI * 2;
  return bearing;
}
