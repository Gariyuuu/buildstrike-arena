"use client";

import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { ARENA, ARENA_DECOR } from "@/game/config/arena";
import { ARENA_BOUNDS } from "@/game/config/movement";
import { computeRamp } from "@/game/arena/ramp";
import { createFloorGridTexture } from "@/game/rendering/proceduralTextures";

const WALL_COLOR = "#0d3b45";
const ACCENT_CYAN = "#33e6ff";
const ACCENT_ORANGE = "#ff8a33";
const RAMP_COLOR = "#232c3d";

export function Arena({ shadows }: { shadows: boolean }) {
  const half = ARENA.floorSize / 2;
  const wallY = ARENA_BOUNDS.wallHeight / 2;

  const southRamp = useMemo(() => computeRamp([0, 0, -6.2], [0, 3.3, -2]), []);
  const northRamp = useMemo(() => computeRamp([0, 0, 6.2], [0, 3.3, 2]), []);
  // A stylized dark night-arena backdrop reads much better against the
  // cyan/orange neon HUD than drei's <Sky> (a bright, physically-based
  // daytime dome that clashed tonally with the rest of the game's look).
  const floorTexture = useMemo(() => {
    const tex = createFloorGridTexture();
    tex.repeat.set(ARENA.floorSize / 4, ARENA.floorSize / 4);
    return tex;
  }, []);

  return (
    <group>
      <color attach="background" args={["#060810"]} />
      <Stars radius={140} depth={60} count={2500} factor={3.5} saturation={0} fade speed={0.4} />
      <fog attach="fog" args={["#0a0e17", 24, 90]} />

      <ambientLight intensity={0.5} color="#8fb8ff" />
      <directionalLight
        position={[24, 30, 12]}
        intensity={1.15}
        color="#bcd4ff"
        castShadow={shadows}
        shadow-mapSize-width={shadows ? 2048 : 512}
        shadow-mapSize-height={shadows ? 2048 : 512}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-far={80}
      />
      <pointLight position={[0, 5, 0]} intensity={12} color={ACCENT_CYAN} distance={16} />
      <pointLight position={[0, 1.2, -16]} intensity={6} color={ACCENT_ORANGE} distance={10} />
      <pointLight position={[0, 1.2, 16]} intensity={6} color={ACCENT_CYAN} distance={10} />

      {/* Floor */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.25, 0]}>
        <mesh receiveShadow={shadows}>
          <boxGeometry args={[ARENA.floorSize, 0.5, ARENA.floorSize]} />
          <meshStandardMaterial map={floorTexture} color="#ffffff" roughness={0.8} metalness={0.2} />
        </mesh>
      </RigidBody>
      {/* Center floor accent cross */}
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, ARENA.floorSize - 4]} />
        <meshBasicMaterial color={ACCENT_CYAN} transparent opacity={0.06} />
      </mesh>

      {/* Boundary walls (visible, translucent energy barrier) — a glowing
          frame (floor-level + top edge trim strips) reads much more like a
          deliberate "energy barrier" than a flat translucent box on its
          own, which was the main thing making the arena look plain/"ugly". */}
      {[
        { pos: [0, wallY, -half] as [number, number, number], size: [ARENA.floorSize, ARENA_BOUNDS.wallHeight, ARENA.boundaryThickness] as [number, number, number], horizontal: true },
        { pos: [0, wallY, half] as [number, number, number], size: [ARENA.floorSize, ARENA_BOUNDS.wallHeight, ARENA.boundaryThickness] as [number, number, number], horizontal: true },
        { pos: [-half, wallY, 0] as [number, number, number], size: [ARENA.boundaryThickness, ARENA_BOUNDS.wallHeight, ARENA.floorSize] as [number, number, number], horizontal: false },
        { pos: [half, wallY, 0] as [number, number, number], size: [ARENA.boundaryThickness, ARENA_BOUNDS.wallHeight, ARENA.floorSize] as [number, number, number], horizontal: false },
      ].map((w, i) => (
        <group key={i}>
          <RigidBody type="fixed" colliders="cuboid" position={w.pos}>
            <mesh>
              <boxGeometry args={w.size} />
              <meshStandardMaterial
                color={WALL_COLOR}
                transparent
                opacity={0.24}
                emissive={ACCENT_CYAN}
                emissiveIntensity={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>
          </RigidBody>
          <mesh position={[w.pos[0], 0.06, w.pos[2]]}>
            <boxGeometry args={w.horizontal ? [w.size[0], 0.1, 0.08] : [0.08, 0.1, w.size[2]]} />
            <meshBasicMaterial color={i % 2 === 0 ? ACCENT_CYAN : ACCENT_ORANGE} />
          </mesh>
          <mesh position={[w.pos[0], ARENA_BOUNDS.wallHeight - 0.15, w.pos[2]]}>
            <boxGeometry args={w.horizontal ? [w.size[0], 0.08, 0.08] : [0.08, 0.08, w.size[2]]} />
            <meshBasicMaterial color={i % 2 === 0 ? ACCENT_CYAN : ACCENT_ORANGE} />
          </mesh>
        </group>
      ))}

      {/* Center double-ramp starting structure */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 3.3, 0]}>
        <mesh castShadow={shadows} receiveShadow={shadows}>
          <boxGeometry args={[6, 0.4, 4]} />
          <meshStandardMaterial color={RAMP_COLOR} roughness={0.6} metalness={0.3} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={southRamp.position} rotation={[southRamp.rotationX, 0, 0]}>
        <mesh castShadow={shadows} receiveShadow={shadows}>
          <boxGeometry args={[4, 0.4, southRamp.length]} />
          <meshStandardMaterial color={RAMP_COLOR} roughness={0.6} metalness={0.3} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={northRamp.position} rotation={[northRamp.rotationX, 0, 0]}>
        <mesh castShadow={shadows} receiveShadow={shadows}>
          <boxGeometry args={[4, 0.4, northRamp.length]} />
          <meshStandardMaterial color={RAMP_COLOR} roughness={0.6} metalness={0.3} />
        </mesh>
      </RigidBody>
      {/* Ramp edge accent strips — center platform plus both ramps, not just
          the platform alone, so the whole structure reads as one deliberate
          piece instead of a plain grey box with two stray trim lines. */}
      <mesh position={[-2.02, 3.52, 0]}>
        <boxGeometry args={[0.05, 0.05, 4]} />
        <meshBasicMaterial color={ACCENT_ORANGE} />
      </mesh>
      <mesh position={[2.02, 3.52, 0]}>
        <boxGeometry args={[0.05, 0.05, 4]} />
        <meshBasicMaterial color={ACCENT_ORANGE} />
      </mesh>
      <mesh position={[southRamp.position[0] - 2.02, southRamp.position[1] + 0.22, southRamp.position[2]]} rotation={[southRamp.rotationX, 0, 0]}>
        <boxGeometry args={[0.05, 0.05, southRamp.length]} />
        <meshBasicMaterial color={ACCENT_CYAN} />
      </mesh>
      <mesh position={[southRamp.position[0] + 2.02, southRamp.position[1] + 0.22, southRamp.position[2]]} rotation={[southRamp.rotationX, 0, 0]}>
        <boxGeometry args={[0.05, 0.05, southRamp.length]} />
        <meshBasicMaterial color={ACCENT_CYAN} />
      </mesh>
      <mesh position={[northRamp.position[0] - 2.02, northRamp.position[1] + 0.22, northRamp.position[2]]} rotation={[northRamp.rotationX, 0, 0]}>
        <boxGeometry args={[0.05, 0.05, northRamp.length]} />
        <meshBasicMaterial color={ACCENT_CYAN} />
      </mesh>
      <mesh position={[northRamp.position[0] + 2.02, northRamp.position[1] + 0.22, northRamp.position[2]]} rotation={[northRamp.rotationX, 0, 0]}>
        <boxGeometry args={[0.05, 0.05, northRamp.length]} />
        <meshBasicMaterial color={ACCENT_CYAN} />
      </mesh>

      {/* Decorative scenery outside the playable zone */}
      {ARENA_DECOR.map((prop, i) => (
        <DecorProp key={i} {...prop} shadows={shadows} />
      ))}
    </group>
  );
}

function DecorProp({
  position,
  scale,
  rotationY,
  kind,
  shadows,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  rotationY: number;
  kind: "pillar" | "crate" | "spire";
  shadows: boolean;
}) {
  const color = kind === "crate" ? "#3a2c1f" : kind === "spire" ? "#1c2536" : "#242f42";
  const accent = position[0] < 0 ? ACCENT_CYAN : ACCENT_ORANGE;
  return (
    <group>
      <mesh position={position} rotation={[0, rotationY, 0]} castShadow={shadows} receiveShadow={shadows}>
        {kind === "spire" ? <coneGeometry args={[scale[0] / 2, scale[1], 6]} /> : <boxGeometry args={scale} />}
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* A thin glowing band near the top — flat single-color props read as
          plain silhouettes against the night sky without any accent detail. */}
      {kind !== "spire" && (
        <mesh position={[position[0], position[1] + scale[1] / 2 - 0.15, position[2]]} rotation={[0, rotationY, 0]}>
          <boxGeometry args={[scale[0] + 0.03, 0.08, scale[2] + 0.03]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} />
        </mesh>
      )}
    </group>
  );
}
