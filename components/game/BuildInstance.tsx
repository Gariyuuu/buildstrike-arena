"use client";

import { useEffect, useRef } from "react";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { Billboard } from "@react-three/drei";
import { BUILD_TYPES } from "@/game/config/builds";
import { useDamageableRegistry, type DamageableEntry } from "@/game/physics/damageable";
import { useBuildsStore } from "@/stores/buildsStore";
import { effectsBus } from "@/game/effects/effectsBus";
import { soundManager } from "@/game/audio/soundManager";
import type { BuildInstance as BuildInstanceType } from "@/game/building/types";

const OWNER_COLOR: Record<string, string> = {
  local: "#3aa0c9",
  opponent: "#c96b3a",
  bot: "#c96b3a",
  neutral: "#666",
};

export function BuildInstance({ build, mode }: { build: BuildInstanceType; mode: "bot" | "online" }) {
  const registry = useDamageableRegistry();
  const mesh = useRef<THREE.Mesh>(null);
  const cfg = BUILD_TYPES[build.kind];
  const healthRef = useRef(build.health);
  healthRef.current = build.health;

  useEffect(() => {
    if (!mesh.current) return;
    const entry: DamageableEntry = {
      id: build.id,
      kind: "build",
      side: build.owner,
      object: mesh.current,
      isAlive: () => healthRef.current > 0,
      takeDamage: (amount) => {
        if (mode === "online") return; // server is authoritative; wait for buildDamaged/buildDestroyed
        const newHealth = Math.max(0, healthRef.current - amount);
        if (newHealth <= 0) {
          useBuildsStore.getState().remove(build.id);
          effectsBus.emit({ kind: "destruction", point: build.position });
          soundManager.play("buildDestroy");
        } else {
          useBuildsStore.getState().damage(build.id, newHealth);
        }
      },
    };
    registry.register(entry);
    return () => registry.unregister(build.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id]);

  const color = OWNER_COLOR[build.owner] ?? OWNER_COLOR.neutral;
  const damagedFraction = build.health / build.maxHealth;

  return (
    <group position={build.position} rotation={[0, build.rotationY, 0]}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh ref={mesh} castShadow receiveShadow>
          <boxGeometry args={[cfg.width, cfg.height, cfg.depth]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.9}
            roughness={0.5}
            metalness={0.25}
            emissive={color}
            emissiveIntensity={damagedFraction < 0.5 ? 0.35 : 0.08}
          />
        </mesh>
      </RigidBody>
      {damagedFraction < 1 && (
        <Billboard position={[0, cfg.height / 2 + 0.35, 0]}>
          <mesh>
            <planeGeometry args={[1, 0.1]} />
            <meshBasicMaterial color="#111820" />
          </mesh>
          <mesh position={[-(1 - damagedFraction) / 2, 0, 0.001]} scale={[damagedFraction, 1, 1]}>
            <planeGeometry args={[1, 0.08]} />
            <meshBasicMaterial color={damagedFraction > 0.4 ? "#33e6ff" : "#ff4d4d"} />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}
