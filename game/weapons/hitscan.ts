import * as THREE from "three";
import type { WeaponConfig } from "@/game/config/weapons";
import { raycastDamageables, type DamageableEntry, type RaycastHit } from "@/game/physics/damageable";

export interface ShotResult {
  hits: RaycastHit[];
  tracerEnd: THREE.Vector3;
}

const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpDir = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const right = new THREE.Vector3(1, 0, 0);

/**
 * Fires one shot (which may consist of multiple pellets for shotguns).
 * Returns all registered-entity hits plus a tracer endpoint for the primary pellet.
 */
export function fireWeapon(
  weapon: WeaponConfig,
  origin: THREE.Vector3,
  forward: THREE.Vector3,
  entries: DamageableEntry[],
  excludeId: string
): ShotResult {
  const hits: RaycastHit[] = [];
  let tracerEnd = origin.clone().addScaledVector(forward, weapon.range);

  for (let i = 0; i < weapon.pellets; i++) {
    const spreadYaw = (Math.random() - 0.5) * 2 * weapon.spread;
    const spreadPitch = (Math.random() - 0.5) * 2 * weapon.spread;
    tmpDir.copy(forward);
    tmpEuler.set(spreadPitch, spreadYaw, 0);
    tmpQuat.setFromEuler(tmpEuler);
    // Rotate the forward vector within a small cone around itself using an
    // approximate local basis (right/up derived from forward).
    const basisRight = right.clone().crossVectors(up, forward).normalize();
    const basisUp = new THREE.Vector3().crossVectors(forward, basisRight).normalize();
    tmpDir
      .copy(forward)
      .addScaledVector(basisRight, spreadYaw)
      .addScaledVector(basisUp, spreadPitch)
      .normalize();

    const hit = raycastDamageables(entries, origin, tmpDir, weapon.range, excludeId);
    if (i === 0) tracerEnd = hit ? hit.point.clone() : origin.clone().addScaledVector(tmpDir, weapon.range);
    if (hit) hits.push(hit);
  }

  return { hits, tracerEnd };
}

export function computeDamage(weapon: WeaponConfig, headshot: boolean): number {
  return Math.round(weapon.damage * (headshot ? weapon.headshotMultiplier : 1));
}
