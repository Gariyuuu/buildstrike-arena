"use client";

import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { generateDesertLayout } from "@/game/config/brMap2";
import { BR_MAP_RADIUS } from "@/game/config/battleRoyale";
import { createSandTexture } from "@/game/rendering/proceduralTextures";

/** "Sand Wastes" — the desert BR map: a sunken canyon arena at the center,
 * rock-formation cover scattered across open dunes, and a small oasis pond. */
export function BRMap2({ shadows }: { shadows: boolean }) {
  const layout = useMemo(() => generateDesertLayout(), []);
  const sandTexture = useMemo(() => {
    const tex = createSandTexture();
    tex.repeat.set((BR_MAP_RADIUS * 2) / 5, (BR_MAP_RADIUS * 2) / 5);
    return tex;
  }, []);

  return (
    <group>
      <color attach="background" args={["#3a2410"]} />
      <fog attach="fog" args={["#4a2f14", 50, 240]} />

      <ambientLight intensity={0.65} color="#ffd9a0" />
      <directionalLight position={[-60, 50, 30]} intensity={1.5} color="#ffb870" castShadow={shadows} shadow-mapSize-width={shadows ? 2048 : 512} shadow-mapSize-height={shadows ? 2048 : 512} shadow-camera-left={-100} shadow-camera-right={100} shadow-camera-top={100} shadow-camera-bottom={-100} shadow-camera-far={300} />
      {/* Low warm "sun" disc for a desert-dusk centerpiece */}
      <mesh position={[-140, 70, 60]}>
        <circleGeometry args={[14, 32]} />
        <meshBasicMaterial color="#ffb870" />
      </mesh>

      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.25, 0]}>
        <mesh receiveShadow={shadows}>
          <boxGeometry args={[BR_MAP_RADIUS * 2.2, 0.5, BR_MAP_RADIUS * 2.2]} />
          <meshStandardMaterial map={sandTexture} color="#ffffff" roughness={0.95} />
        </mesh>
      </RigidBody>

      {/* Oasis pond at the very center */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[layout.oasisRadius, 32]} />
        <meshStandardMaterial color="#1c6b7a" roughness={0.15} metalness={0.4} transparent opacity={0.85} />
      </mesh>

      {/* Canyon ring — a broken circle of rock walls forming a natural arena
          around the oasis. A warm glowing seam near the base gives the ring
          a deliberate, lit-landmark look instead of a plain brown wall. */}
      {layout.canyonWalls.map((w, i) => (
        <group key={`wall-${i}`}>
          <RigidBody type="fixed" colliders="cuboid" position={w.position} rotation={[0, w.rotationY, 0]}>
            <mesh castShadow={shadows} receiveShadow={shadows}>
              <boxGeometry args={[w.length, w.height, 2.5]} />
              <meshStandardMaterial color="#8a6238" roughness={0.9} />
            </mesh>
          </RigidBody>
          <mesh position={[w.position[0], 1.2, w.position[2]]} rotation={[0, w.rotationY, 0]}>
            <boxGeometry args={[w.length * 0.92, 0.12, 2.6]} />
            <meshStandardMaterial color="#ffb870" emissive="#ffb870" emissiveIntensity={0.7} />
          </mesh>
        </group>
      ))}

      {layout.rocks.map((r, i) => (
        <RigidBody key={`rock-${i}`} type="fixed" colliders="cuboid" position={r.position} rotation={[0, r.rotationY, 0]}>
          <mesh castShadow={shadows} receiveShadow={shadows}>
            <coneGeometry args={[Math.max(r.footprint[0], r.footprint[1]) / 2, r.height, 5]} />
            <meshStandardMaterial color={r.color} roughness={0.95} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
}
