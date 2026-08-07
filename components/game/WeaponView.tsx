"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WEAPONS, type WeaponId, type WeaponVisual } from "@/game/config/weapons";

interface VisualPreset {
  body: [number, number, number];
  barrelLen: number;
  barrelRadius: number;
  barrelZ: number;
  muzzleZ: number;
  scope: boolean;
}

const VISUAL_PRESETS: Record<WeaponVisual, VisualPreset> = {
  rifle: { body: [0.09, 0.1, 0.68], barrelLen: 0.42, barrelRadius: 0.025, barrelZ: 0.4, muzzleZ: 0.62, scope: false },
  lmg: { body: [0.12, 0.14, 0.72], barrelLen: 0.46, barrelRadius: 0.032, barrelZ: 0.42, muzzleZ: 0.68, scope: false },
  shotgun: { body: [0.1, 0.12, 0.55], barrelLen: 0.35, barrelRadius: 0.045, barrelZ: 0.32, muzzleZ: 0.52, scope: false },
  pistol: { body: [0.07, 0.08, 0.32], barrelLen: 0.18, barrelRadius: 0.02, barrelZ: 0.2, muzzleZ: 0.32, scope: false },
  revolver: { body: [0.08, 0.09, 0.26], barrelLen: 0.14, barrelRadius: 0.028, barrelZ: 0.16, muzzleZ: 0.26, scope: false },
  marksman: { body: [0.08, 0.09, 0.85], barrelLen: 0.55, barrelRadius: 0.022, barrelZ: 0.5, muzzleZ: 0.8, scope: true },
  // Not actually rendered by WeaponView — melee has its own dedicated
  // PickaxeView (see components/game/PickaxeView.tsx) — this entry exists
  // only so WEAPONS' visual field stays exhaustively typed.
  melee: { body: [0.05, 0.05, 0.3], barrelLen: 0.1, barrelRadius: 0.01, barrelZ: 0.15, muzzleZ: 0.2, scope: false },
};

export function WeaponView({
  weapon,
  fireFlashRef,
  reloading,
  switchFlashUntilRef,
  accent,
  wrapColors,
}: {
  weapon: WeaponId;
  fireFlashRef: React.RefObject<number>; // timestamp of last shot, read per-frame
  reloading: boolean;
  switchFlashUntilRef: React.RefObject<number>; // timestamp until which the switch animation plays
  accent: string;
  /** Optional weapon-wrap cosmetic override — purely visual, never changes stats. */
  wrapColors?: { bodyColor: string; barrelColor: string };
}) {
  const flashMesh = useRef<THREE.Mesh>(null);
  const flashLight = useRef<THREE.PointLight>(null);
  const group = useRef<THREE.Group>(null);
  const reloadTilt = useRef(0);
  const switchScale = useRef(1);
  const shellMesh = useRef<THREE.Mesh>(null);
  const lastFireSeen = useRef(0);
  const shellAge = useRef(1); // 1 = fully faded/inactive

  useFrame((_, dt) => {
    const now = performance.now();
    const t = fireFlashRef.current ?? 0;
    const visible = t > 0 && now - t < 45;
    if (flashMesh.current) flashMesh.current.visible = visible;
    if (flashLight.current) flashLight.current.intensity = visible ? 6 : 0;

    // Shell ejection: a single reused casing that pops sideways and fades
    // out over ~0.3s, retriggered on every new shot.
    if (t !== lastFireSeen.current) {
      lastFireSeen.current = t;
      shellAge.current = 0;
    }
    if (shellAge.current < 1) {
      shellAge.current = Math.min(1, shellAge.current + dt / 0.3);
      if (shellMesh.current) {
        shellMesh.current.visible = true;
        shellMesh.current.position.set(0.08 + shellAge.current * 0.12, 0.03 - shellAge.current * shellAge.current * 0.1, 0.02 - shellAge.current * 0.05);
        shellMesh.current.rotation.set(shellAge.current * 6, shellAge.current * 3, 0);
        (shellMesh.current.material as THREE.MeshStandardMaterial).opacity = 1 - shellAge.current;
      }
    } else if (shellMesh.current) {
      shellMesh.current.visible = false;
    }

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

  const visual = WEAPONS[weapon].visual;
  const preset = VISUAL_PRESETS[visual];
  const bodyColor = wrapColors?.bodyColor ?? "#1b1f27";
  const barrelColor = wrapColors?.barrelColor ?? "#0e1116";

  return (
    <group ref={group} position={[0.32, 0.55, 0.28]}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={preset.body} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Barrel */}
      <mesh position={[0, 0.01, preset.barrelZ]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[preset.barrelRadius, preset.barrelRadius, preset.barrelLen, 8]} />
        <meshStandardMaterial color={barrelColor} roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Cylinder drum (revolver only) */}
      {visual === "revolver" && (
        <mesh position={[0, 0, preset.barrelZ - 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.06, 6]} />
          <meshStandardMaterial color={barrelColor} roughness={0.35} metalness={0.75} />
        </mesh>
      )}
      {/* Scope (marksman only) */}
      {preset.scope && (
        <mesh position={[0, 0.075, 0.15]}>
          <cylinderGeometry args={[0.022, 0.022, 0.22, 10]} />
          <meshStandardMaterial color="#05070a" roughness={0.2} metalness={0.9} />
        </mesh>
      )}
      {/* Accent stripe */}
      <mesh position={[0, 0.065, 0.05]}>
        <boxGeometry args={[0.03, 0.02, 0.2]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} />
      </mesh>
      {/* Muzzle flash */}
      <mesh ref={flashMesh} position={[0, 0.01, preset.muzzleZ]} visible={false}>
        <coneGeometry args={[0.09, 0.22, 6]} />
        <meshBasicMaterial color="#ffe08a" />
      </mesh>
      <pointLight ref={flashLight} position={[0, 0.01, preset.muzzleZ - 0.1]} intensity={0} color="#ffcf7a" distance={3} />
      {/* Ejected shell casing */}
      <mesh ref={shellMesh} visible={false}>
        <cylinderGeometry args={[0.012, 0.012, 0.045, 6]} />
        <meshStandardMaterial color="#c9a227" roughness={0.3} metalness={0.8} transparent />
      </mesh>
    </group>
  );
}
