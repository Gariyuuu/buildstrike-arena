import * as THREE from "three";
import type RAPIER from "@dimforge/rapier3d-compat";

export interface WorldRayHit {
  point: THREE.Vector3;
  toi: number;
  normal: THREE.Vector3;
}

/** Casts a ray against the static/physical Rapier world (arena, builds) — not the visual damageable registry. */
export function castWorldRay(
  rapier: typeof RAPIER,
  world: RAPIER.World,
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  maxToi: number
): WorldRayHit | null {
  const ray = new rapier.Ray({ x: origin.x, y: origin.y, z: origin.z }, { x: dir.x, y: dir.y, z: dir.z });
  const hit = world.castRayAndGetNormal(ray, maxToi, true);
  if (!hit) return null;
  const point = new THREE.Vector3(
    origin.x + dir.x * hit.timeOfImpact,
    origin.y + dir.y * hit.timeOfImpact,
    origin.z + dir.z * hit.timeOfImpact
  );
  const normal = new THREE.Vector3(hit.normal.x, hit.normal.y, hit.normal.z);
  return { point, toi: hit.timeOfImpact, normal };
}
