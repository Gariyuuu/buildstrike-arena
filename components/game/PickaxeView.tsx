"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PICKAXES, DEFAULT_PICKAXE_ID } from "@/game/config/cosmetics";

/** Renders the equipped pickaxe cosmetic, swinging forward briefly on melee attacks (fed by meleeSwingRef, same "timestamp of last action" convention as WeaponView's fireFlashRef). */
export function PickaxeView({ pickaxeId, meleeSwingRef }: { pickaxeId: string; meleeSwingRef: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const swingProgress = useRef(1); // 1 = idle/hidden, 0 = mid-swing
  const lastSwingSeen = useRef(0);

  useFrame((_, dt) => {
    const t = meleeSwingRef.current ?? 0;
    if (t !== lastSwingSeen.current) {
      lastSwingSeen.current = t;
      swingProgress.current = 0;
    }
    if (swingProgress.current < 1) {
      swingProgress.current = Math.min(1, swingProgress.current + dt / 0.35);
    }
    if (group.current) {
      const visible = swingProgress.current < 1;
      group.current.visible = visible;
      if (visible) {
        const swing = Math.sin(swingProgress.current * Math.PI);
        group.current.rotation.x = -0.6 - swing * 1.4;
        group.current.rotation.z = swing * 0.3;
      }
    }
  });

  const def = PICKAXES[pickaxeId] ?? PICKAXES[DEFAULT_PICKAXE_ID];

  return (
    <group ref={group} position={[0.32, 0.5, 0.2]} visible={false}>
      <mesh position={[0, -0.1, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.32, 6]} />
        <meshStandardMaterial color={def.handleColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <coneGeometry args={[0.035, 0.22, 4]} />
        <meshStandardMaterial color={def.headColor} roughness={0.35} metalness={0.6} />
      </mesh>
    </group>
  );
}
