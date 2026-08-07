"use client";

import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { Stars } from "@react-three/drei";
import { generateTiltedVibesLayout } from "@/game/config/brMap1";
import { BR_MAP_RADIUS } from "@/game/config/battleRoyale";
import { createFloorGridTexture } from "@/game/rendering/proceduralTextures";

/** "Tilted Vibes" — the flagship original BR map: a dense cluster of leaning
 * towers around the center, open ground further out. */
export function BRMap1({ shadows }: { shadows: boolean }) {
  const towers = useMemo(() => generateTiltedVibesLayout(), []);
  const floorTexture = useMemo(() => {
    const tex = createFloorGridTexture();
    tex.repeat.set((BR_MAP_RADIUS * 2) / 6, (BR_MAP_RADIUS * 2) / 6);
    return tex;
  }, []);

  return (
    <group>
      <color attach="background" args={["#050810"]} />
      <Stars radius={220} depth={80} count={3500} factor={4} saturation={0} fade speed={0.3} />
      <fog attach="fog" args={["#0a0e17", 60, 260]} />

      <ambientLight intensity={0.5} color="#8fb8ff" />
      <directionalLight position={[80, 90, 40]} intensity={1.1} color="#bcd4ff" castShadow={shadows} shadow-mapSize-width={shadows ? 2048 : 512} shadow-mapSize-height={shadows ? 2048 : 512} shadow-camera-left={-100} shadow-camera-right={100} shadow-camera-top={100} shadow-camera-bottom={-100} shadow-camera-far={300} />

      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.25, 0]}>
        <mesh receiveShadow={shadows}>
          <boxGeometry args={[BR_MAP_RADIUS * 2.2, 0.5, BR_MAP_RADIUS * 2.2]} />
          <meshStandardMaterial map={floorTexture} color="#9aa8c0" roughness={0.85} />
        </mesh>
      </RigidBody>

      {towers.map((t, i) => (
        <group key={i}>
          <RigidBody type="fixed" colliders="cuboid" position={t.position}>
            <mesh castShadow={shadows} receiveShadow={shadows} rotation={[t.tiltX, 0, t.tiltZ]}>
              <boxGeometry args={[t.footprint[0], t.height, t.footprint[1]]} />
              <meshStandardMaterial color={t.color} roughness={0.75} metalness={0.15} />
            </mesh>
          </RigidBody>
          {/* Accent trim stripe near the top — no collider, purely decorative */}
          <mesh position={[t.position[0], t.position[1] + t.height / 2 - 0.6, t.position[2]]} rotation={[t.tiltX, 0, t.tiltZ]}>
            <boxGeometry args={[t.footprint[0] + 0.05, 0.3, t.footprint[1] + 0.05]} />
            <meshStandardMaterial color={t.accent} emissive={t.accent} emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
