"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useBRStore } from "@/stores/brStore";
import { computeZoneState } from "@/game/br/zone";

const WALL_HEIGHT = 60;

/** Visual-only shrinking storm wall — a translucent glowing cylinder sized
 * to the current zone radius each frame, plus a ground ring outline. Damage
 * application lives in BRLocalPlayer/BRAgent (each reads computeZoneState()
 * itself), not here — this component only renders. */
export function BRZone() {
  const wall = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const { matchStartedAt, phase } = useBRStore.getState();
    if (phase !== "combat" || !matchStartedAt) return;
    const elapsed = (performance.now() - matchStartedAt) / 1000;
    const zone = computeZoneState(elapsed);
    if (wall.current) wall.current.scale.set(zone.radius, 1, zone.radius);
    if (ring.current) ring.current.scale.set(zone.radius, zone.radius, 1);
  });

  return (
    <group>
      <mesh ref={wall} position={[0, WALL_HEIGHT / 2 - 2, 0]}>
        <cylinderGeometry args={[1, 1, WALL_HEIGHT, 48, 1, true]} />
        <meshBasicMaterial color="#ff8a33" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={ring} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.985, 1, 64]} />
        <meshBasicMaterial color="#ff8a33" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}
