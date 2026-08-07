import { ZONE_PHASES, BR_MAP_RADIUS } from "@/game/config/battleRoyale";

export interface ZoneState {
  radius: number;
  phaseIndex: number;
  nextRadius: number;
  shrinking: boolean;
  phaseTimeRemaining: number;
  finalPhase: boolean;
}

/** Pure function of match-elapsed seconds — the zone center is fixed at the
 * map origin for simplicity (no re-centering drift between phases). */
export function computeZoneState(elapsedSeconds: number): ZoneState {
  let t = elapsedSeconds;
  let prevRadius = BR_MAP_RADIUS;
  for (let i = 0; i < ZONE_PHASES.length; i++) {
    const phase = ZONE_PHASES[i];
    if (t < phase.waitSeconds) {
      return { radius: prevRadius, phaseIndex: i, nextRadius: phase.radius, shrinking: false, phaseTimeRemaining: phase.waitSeconds - t, finalPhase: false };
    }
    t -= phase.waitSeconds;
    if (t < phase.shrinkSeconds) {
      const frac = t / phase.shrinkSeconds;
      const radius = prevRadius + (phase.radius - prevRadius) * frac;
      return { radius, phaseIndex: i, nextRadius: phase.radius, shrinking: true, phaseTimeRemaining: phase.shrinkSeconds - t, finalPhase: false };
    }
    t -= phase.shrinkSeconds;
    prevRadius = phase.radius;
  }
  return { radius: prevRadius, phaseIndex: ZONE_PHASES.length - 1, nextRadius: prevRadius, shrinking: false, phaseTimeRemaining: 0, finalPhase: true };
}

export function damagePerSecondFor(phaseIndex: number): number {
  const idx = Math.max(0, Math.min(ZONE_PHASES.length - 1, phaseIndex));
  return ZONE_PHASES[idx].damagePerSecond;
}

export function isOutsideZone(x: number, z: number, radius: number): boolean {
  return Math.sqrt(x * x + z * z) > radius;
}
