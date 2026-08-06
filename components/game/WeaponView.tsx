"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WeaponId } from "@/game/config/weapons";

export function WeaponView({
  weapon,
  fireFlashRef,
  reloading,
  switchFlashUntilRef,
  accent,
}: {
  weapon: WeaponId;
  fireFlashRef: React.RefObject<number>; // timestamp of last shot, read per-frame
  reloading: boolean;
  switchFlashUntilRef: React.RefObject<number>; // timestamp until which the switch animation plays
  accent: string;
}) {
  const flashMesh = useRef<THREE.Mesh>(null);
  const flashLight = useRef<THREE.PointLight>(null);
  const group = useRef<THREE.Group>(null);
  const reloadTilt = useRef(0);
  const switchScale = useRef(1);

  useFrame((_, dt) => {
    const now = performance.now();
    const t = fireFlashRef.current ?? 0;
    const visible = t > 0 && now - t < 45;
    if (flashMesh.current) flashMesh.current.visible = visible;
    if (flashLight.current) flashLight.current.intensity = visible ? 6 : 0;

    const switching = now < (switchFlashUntilRef.current ?? 0);
    const targetTilt = reloading ? -0.55 : 0;
    reloadTilt.current += (targetTilt - reloadTilt.current) * Math.min(1, dt * 10);
    const targetScale = switching ? 0.7 : 1;
    switchScale.current += (targetScale - switchScale.current) * Math.min(1, dt * 12);
    if (group.current) {
      group.current.rotation.x = reloadTilt.current;
      group.current.scale.setScalar(switchScale.current);
    }
  });

  const isShotgun = weapon === "shotgun";

  return (
    <group ref={group} position={[0.32, 0.55, 0.28]}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={isShotgun ? [0.1, 0.12, 0.55] : [0.09, 0.1, 0.68]} />
        <meshStandardMaterial color="#1b1f27" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Barrel */}
      <mesh position={[0, 0.01, isShotgun ? 0.32 : 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={isShotgun ? [0.045, 0.045, 0.35, 8] : [0.025, 0.025, 0.42, 8]} />
        <meshStandardMaterial color="#0e1116" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Accent stripe */}
      <mesh position={[0, 0.065, 0.05]}>
        <boxGeometry args={[0.03, 0.02, 0.2]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} />
      </mesh>
      {/* Muzzle flash */}
      <mesh ref={flashMesh} position={[0, 0.01, isShotgun ? 0.52 : 0.62]} visible={false}>
        <coneGeometry args={[0.09, 0.22, 6]} />
        <meshBasicMaterial color="#ffe08a" />
      </mesh>
      <pointLight ref={flashLight} position={[0, 0.01, 0.5]} intensity={0} color="#ffcf7a" distance={3} />
    </group>
  );
}
