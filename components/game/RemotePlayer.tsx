"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MOVEMENT } from "@/game/config/movement";
import { useDamageableRegistry, type DamageableEntry } from "@/game/physics/damageable";
import { positionTracker } from "@/game/state/positionTracker";
import { effectsBus } from "@/game/effects/effectsBus";
import { soundManager } from "@/game/audio/soundManager";
import { CharacterModel } from "@/components/game/CharacterModel";
import { WeaponView } from "@/components/game/WeaponView";
import type { OpponentStateMsg, OpponentFiredMsg } from "@/game/networking/types";
import type { WeaponId } from "@/game/config/weapons";
import type { ArmPoseId } from "@/game/animation/pose";
import { usePlayerStore } from "@/stores/playerStore";

const REMOTE_ID = "remote-player";

export function RemotePlayer({
  netStateRef,
  fireEventRef,
  connected,
  spawn,
}: {
  netStateRef: React.RefObject<OpponentStateMsg | null>;
  fireEventRef: React.RefObject<OpponentFiredMsg | null>;
  connected: boolean;
  spawn: [number, number, number];
}) {
  const group = useRef<THREE.Group>(null);
  const hitboxMesh = useRef<THREE.Mesh>(null);
  const movingRef = useRef(0);
  const fireFlashRef = useRef(0);
  const lastFireSeen = useRef<OpponentFiredMsg | null>(null);
  const lastPos = useRef(new THREE.Vector3(...spawn));
  const registry = useDamageableRegistry();
  const noSwitchFlash = useRef(0);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponId>("rifle");
  const armPoseRef = useRef<ArmPoseId>("rifle");
  const hitReactRef = useRef(0);
  const lastOpponentHealth = useRef(100);
  const opponentHealth = usePlayerStore((s) => s.opponent.health);
  const isDead = opponentHealth <= 0;

  useEffect(() => {
    if (!hitboxMesh.current) return;
    const entry: DamageableEntry = {
      id: REMOTE_ID,
      kind: "player",
      side: "opponent",
      object: hitboxMesh.current,
      headY: spawn[1] + MOVEMENT.capsuleHalfHeight * 2 + MOVEMENT.capsuleRadius - 0.35,
      isAlive: () => connected,
      takeDamage: () => {
        // Server is authoritative for opponent health in online mode; this
        // registration only exists so the local raycast can register a hit
        // for immediate tracer/hit-marker feedback.
      },
    };
    registry.register(entry);
    return () => registry.unregister(REMOTE_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  useFrame((_, dt) => {
    const net = netStateRef.current;
    if (net && group.current) {
      const target = new THREE.Vector3(...net.position);
      const dist = lastPos.current.distanceTo(target);
      movingRef.current = THREE.MathUtils.clamp(dist / (MOVEMENT.walkSpeed * dt * 1.6), 0, 1);
      lastPos.current.lerp(target, 1 - Math.exp(-dt * 14));
      group.current.position.copy(lastPos.current);
      const targetQuatY = net.rotationY;
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetQuatY, MOVEMENT.turnSmoothing, dt);
      if (net.weapon !== currentWeapon) setCurrentWeapon(net.weapon);
      armPoseRef.current = net.isBuildMode ? "build" : net.weapon;
      positionTracker.opponent.set(lastPos.current.x, lastPos.current.y, lastPos.current.z);
    }

    if (opponentHealth < lastOpponentHealth.current) hitReactRef.current = performance.now();
    lastOpponentHealth.current = opponentHealth;

    const fireEvent = fireEventRef.current;
    if (fireEvent && fireEvent !== lastFireSeen.current) {
      lastFireSeen.current = fireEvent;
      fireFlashRef.current = performance.now();
      soundManager.play(fireEvent.weapon === "rifle" ? "rifleFire" : "shotgunFire", { volume: 0.6 });
      const muzzle = new THREE.Vector3(...fireEvent.origin).addScaledVector(new THREE.Vector3(...fireEvent.direction), 0.6);
      const end = new THREE.Vector3(...fireEvent.origin).addScaledVector(new THREE.Vector3(...fireEvent.direction), 40);
      effectsBus.emit({ kind: "tracer", from: [muzzle.x, muzzle.y, muzzle.z], to: [end.x, end.y, end.z], color: "#ffb27a" });
    }
  });

  useEffect(() => {
    positionTracker.opponentAlive = connected;
  }, [connected]);

  return (
    <group visible={connected}>
      <group ref={group} position={spawn}>
        <mesh ref={hitboxMesh} visible={false} position={[0, MOVEMENT.capsuleHalfHeight + MOVEMENT.capsuleRadius, 0]}>
          <capsuleGeometry args={[MOVEMENT.capsuleRadius + 0.03, MOVEMENT.capsuleHalfHeight * 2, 4, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>
        <CharacterModel
          color="#c96b3a"
          accent="#ff8a33"
          movingRef={movingRef}
          armPoseRef={armPoseRef}
          fireReactRef={fireFlashRef}
          hitReactRef={hitReactRef}
          eliminated={isDead}
        />
        <WeaponView weapon={currentWeapon} fireFlashRef={fireFlashRef} reloading={false} switchFlashUntilRef={noSwitchFlash} accent="#ff8a33" />
      </group>
    </group>
  );
}
