"use client";

import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { Stars } from "@react-three/drei";
import { generateNeonCityLayout } from "@/game/config/brMap3";
import { BR_MAP_RADIUS } from "@/game/config/battleRoyale";
import { createNeonAsphaltTexture } from "@/game/rendering/proceduralTextures";

/** "Neon District" — the Tokyo-mega-city BR map: a dense grid of neon-
 * trimmed towers split by two wide central avenues, tallest near the
 * downtown core. */
export function BRMap3({ shadows }: { shadows: boolean }) {
  const towers = useMemo(() => generateNeonCityLayout(), []);
  const streetTexture = useMemo(() => {
    const tex = createNeonAsphaltTexture();
    tex.repeat.set((BR_MAP_RADIUS * 2) / 5, (BR_MAP_RADIUS * 2) / 5);
    return tex;
  }, []);

  return (
    <group>
      <color attach="background" args={["#0a0512"]} />
      <Stars radius={220} depth={80} count={2000} factor={3} saturation={0} fade speed={0.2} />
      <fog attach="fog" args={["#1a0a20", 45, 220]} />

      <ambientLight intensity={0.4} color="#c98cff" />
      <directionalLight position={[50, 80, -40]} intensity={0.8} color="#8fd0ff" castShadow={shadows} shadow-mapSize-width={shadows ? 2048 : 512} shadow-mapSize-height={shadows ? 2048 : 512} shadow-camera-left={-100} shadow-camera-right={100} shadow-camera-top={100} shadow-camera-bottom={-100} shadow-camera-far={300} />
      <pointLight position={[0, 20, 0]} intensity={20} color="#ff2ec4" distance={60} />

      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.25, 0]}>
        <mesh receiveShadow={shadows}>
          <boxGeometry args={[BR_MAP_RADIUS * 2.2, 0.5, BR_MAP_RADIUS * 2.2]} />
          <meshStandardMaterial map={streetTexture} color="#ffffff" roughness={0.35} metalness={0.3} />
        </mesh>
      </RigidBody>

      {towers.map((t, i) => (
        <group key={i}>
          <RigidBody type="fixed" colliders="cuboid" position={t.position}>
            <mesh castShadow={shadows} receiveShadow={shadows}>
              <boxGeometry args={[t.footprint[0], t.height, t.footprint[1]]} />
              <meshStandardMaterial color={t.baseColor} roughness={0.5} metalness={0.4} />
            </mesh>
          </RigidBody>
          {/* Vertical corner neon strips */}
          <mesh position={[t.position[0] - t.footprint[0] / 2, t.position[1], t.position[2] - t.footprint[1] / 2]}>
            <boxGeometry args={[0.12, t.height * 0.94, 0.12]} />
            <meshStandardMaterial color={t.neonColor} emissive={t.neonColor} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
          <mesh position={[t.position[0] + t.footprint[0] / 2, t.position[1], t.position[2] + t.footprint[1] / 2]}>
            <boxGeometry args={[0.12, t.height * 0.94, 0.12]} />
            <meshStandardMaterial color={t.neonColor2} emissive={t.neonColor2} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
          {/* Mid-height neon band */}
          <mesh position={[t.position[0], t.position[1] + t.height * 0.15, t.position[2]]}>
            <boxGeometry args={[t.footprint[0] + 0.05, 0.25, t.footprint[1] + 0.05]} />
            <meshStandardMaterial color={t.neonColor} emissive={t.neonColor} emissiveIntensity={1.1} toneMapped={false} />
          </mesh>
          {t.hasSpire && (
            <mesh position={[t.position[0], t.position[1] + t.height / 2 + 3, t.position[2]]}>
              <cylinderGeometry args={[0.15, 0.3, 6, 6]} />
              <meshStandardMaterial color={t.neonColor2} emissive={t.neonColor2} emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
