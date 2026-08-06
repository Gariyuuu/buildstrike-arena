"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDamageableRegistry, type DamageableEntry } from "@/game/physics/damageable";
import { effectsBus } from "@/game/effects/effectsBus";
import { soundManager } from "@/game/audio/soundManager";

const TARGET_POSITIONS: [number, number, number][] = [
  [-6, 1.4, 4],
  [6, 1.4, 4],
  [0, 1.9, -10],
  [-9, 1.4, -6],
];
const RESPAWN_MS = 900;

function Target({ id, position }: { id: string; position: [number, number, number] }) {
  const registry = useDamageableRegistry();
  const mesh = useRef<THREE.Mesh>(null);
  const [health, setHealth] = useState(100);
  const [downUntil, setDownUntil] = useState(0);

  useEffect(() => {
    if (!mesh.current) return;
    const entry: DamageableEntry = {
      id,
      kind: "build", // reuses the existing player-fire "build" hit branch (impact sparks, no headshot math) — a stand-in until a dedicated target-hit path exists
      side: "neutral",
      object: mesh.current,
      isAlive: () => health > 0,
      takeDamage: (amount) => {
        setHealth((h) => {
          const next = Math.max(0, h - amount);
          if (next <= 0) {
            soundManager.play("buildDestroy", { volume: 0.4 });
            effectsBus.emit({ kind: "destruction", point: position });
            setDownUntil(performance.now() + RESPAWN_MS);
          }
          return next;
        });
      },
    };
    registry.register(entry);
    return () => registry.unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [health]);

  useFrame(() => {
    if (health <= 0 && downUntil > 0 && performance.now() >= downUntil) {
      setHealth(100);
      setDownUntil(0);
    }
  });

  const visible = health > 0;
  const color = health > 66 ? "#ff5c5c" : health > 33 ? "#ff8a33" : "#ffd23f";

  return (
    <group position={position} visible={visible}>
      <mesh ref={mesh} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 1.5, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.28]}>
        <ringGeometry args={[0.18, 0.3, 24]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} />
        <meshStandardMaterial color="#3a3f4a" />
      </mesh>
    </group>
  );
}

/** Static, infinitely-respawning shootable dummies for Training Arena — no scoring, just feedback. */
export function TrainingTargets() {
  return (
    <>
      {TARGET_POSITIONS.map((pos, i) => (
        <Target key={i} id={`training-target-${i}`} position={pos} />
      ))}
    </>
  );
}
