"use client";

import { useMemo } from "react";
import { useRapier } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

export interface MoveResult {
  position: THREE.Vector3;
  grounded: boolean;
}

/**
 * Thin wrapper around Rapier's kinematic character controller shared by the
 * local player and bots so movement/collision (walls, floors, ramps, the
 * other player) behaves identically for everyone.
 */
export function useCharacterMover() {
  const { world } = useRapier();

  const controller = useMemo(() => {
    const c = world.createCharacterController(0.04);
    c.enableAutostep(0.35, 0.2, true);
    c.enableSnapToGround(0.4);
    c.setMaxSlopeClimbAngle((55 * Math.PI) / 180);
    c.setMinSlopeSlideAngle((42 * Math.PI) / 180);
    c.setSlideEnabled(true);
    c.setApplyImpulsesToDynamicBodies(false);
    return c;
  }, [world]);
  // Not explicitly removed on unmount: the whole Rapier World (and every
  // controller/collider/body it owns) is torn down when <Physics> unmounts,
  // and removing it eagerly here is unsafe under React StrictMode's
  // dev-only double-invoked effects (the memoized controller would be
  // freed while still referenced).

  function move(rigidBody: RapierRigidBody, desired: THREE.Vector3): MoveResult {
    const collider = rigidBody.collider(0);
    controller.computeColliderMovement(collider, desired);
    const corrected = controller.computedMovement();
    const grounded = controller.computedGrounded();
    const pos = rigidBody.translation();
    const next = new THREE.Vector3(pos.x + corrected.x, pos.y + corrected.y, pos.z + corrected.z);
    rigidBody.setNextKinematicTranslation(next);
    return { position: next, grounded };
  }

  return move;
}
