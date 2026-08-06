"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MOVEMENT } from "@/game/config/movement";

export interface CharacterModelHandle {
  leftLeg: THREE.Mesh | null;
  rightLeg: THREE.Mesh | null;
}

/** Original low-poly character built entirely from primitive geometry. */
export function CharacterModel({
  color,
  accent,
  movingRef,
  shadows = true,
}: {
  color: string;
  accent: string;
  movingRef: React.RefObject<number>; // 0..1 movement speed fraction, read per-frame
  shadows?: boolean;
}) {
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const phase = useRef(0);

  useFrame((_, dt) => {
    const speed = movingRef.current ?? 0;
    phase.current += dt * (6 + speed * 4);
    const swing = Math.sin(phase.current) * 0.5 * speed;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.6;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.6 * 0.3 - 0.2;
  });

  const bodyHeight = MOVEMENT.capsuleHalfHeight * 2 + MOVEMENT.capsuleRadius * 2;

  return (
    <group>
      {/* Torso */}
      <mesh position={[0, 0.55, 0]} castShadow={shadows}>
        <capsuleGeometry args={[MOVEMENT.capsuleRadius, MOVEMENT.capsuleHalfHeight * 1.3, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.2} />
      </mesh>
      {/* Chest accent stripe */}
      <mesh position={[0, 0.65, 0.32]}>
        <boxGeometry args={[0.32, 0.14, 0.04]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} />
      </mesh>
      {/* Head */}
      <mesh position={[0, bodyHeight - 0.28, 0]} castShadow={shadows}>
        <boxGeometry args={[0.36, 0.36, 0.38]} />
        <meshStandardMaterial color="#e7ddce" roughness={0.7} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, bodyHeight - 0.28, 0.2]}>
        <boxGeometry args={[0.3, 0.09, 0.04]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} />
      </mesh>
      {/* Arms */}
      <mesh ref={leftArm} position={[-0.42, 0.62, 0]} castShadow={shadows}>
        <capsuleGeometry args={[0.11, 0.5, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh ref={rightArm} position={[0.42, 0.62, 0]} castShadow={shadows}>
        <capsuleGeometry args={[0.11, 0.5, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Legs */}
      <mesh ref={leftLeg} position={[-0.18, 0.02, 0]} castShadow={shadows}>
        <capsuleGeometry args={[0.13, 0.55, 4, 6]} />
        <meshStandardMaterial color="#2a2f3a" roughness={0.7} />
      </mesh>
      <mesh ref={rightLeg} position={[0.18, 0.02, 0]} castShadow={shadows}>
        <capsuleGeometry args={[0.13, 0.55, 4, 6]} />
        <meshStandardMaterial color="#2a2f3a" roughness={0.7} />
      </mesh>
    </group>
  );
}
