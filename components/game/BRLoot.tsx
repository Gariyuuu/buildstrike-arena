"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useBRStore } from "@/stores/brStore";
import { RARITY_COLOR } from "@/game/config/cosmetics";
import type { GroundLootSpawn, ChestSpawn } from "@/game/br/loot";

function GroundLootItem({ spawn }: { spawn: GroundLootSpawn }) {
  const claimed = useBRStore((s) => s.claimedLootIds.includes(spawn.id));
  const mesh = useRef<THREE.Mesh>(null);
  const color = RARITY_COLOR[spawn.drop.rarity];

  useFrame((_, dt) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += dt * 1.4;
    mesh.current.position.y = spawn.position[1] + Math.sin(performance.now() / 500) * 0.12;
  });

  if (claimed) return null;
  return (
    <group position={spawn.position}>
      {/* No real-time point light here on purpose — up to ~55 of these can be
          on screen at once in a BR match, and that many dynamic lights was a
          serious frame-rate cost (every lit surface in the scene evaluates
          every light). The glow reads fine from the emissive material alone
          with toneMapped off. */}
      <mesh ref={mesh}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} roughness={0.35} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ChestItem({ spawn }: { spawn: ChestSpawn }) {
  const opened = useBRStore((s) => s.claimedLootIds.includes(spawn.id));
  return (
    <group position={spawn.position}>
      <mesh visible={!opened}>
        <boxGeometry args={[0.9, 0.7, 0.6]} />
        <meshStandardMaterial color="#8a6d1a" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Same reasoning as GroundLootItem — no per-chest point light (up to
          ~22 on screen), emissive-only glow instead. */}
      <mesh position={[0, 0.05, 0]} visible={!opened}>
        <boxGeometry args={[0.94, 0.1, 0.64]} />
        <meshStandardMaterial color="#ffd23f" emissive="#ffd23f" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function BRLoot({ groundLoot, chests }: { groundLoot: GroundLootSpawn[]; chests: ChestSpawn[] }) {
  return (
    <group>
      {groundLoot.map((s) => (
        <GroundLootItem key={s.id} spawn={s} />
      ))}
      {chests.map((c) => (
        <ChestItem key={c.id} spawn={c} />
      ))}
    </group>
  );
}
