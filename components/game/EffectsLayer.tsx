"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text, Billboard } from "@react-three/drei";
import { effectsBus, type EffectEvent } from "@/game/effects/effectsBus";
import { BUILD_CONFIG } from "@/game/config/builds";

const MAX_TRACERS = 10;
const MAX_IMPACTS = 16;
const MAX_DESTRUCTIONS = 6;
const MAX_DAMAGE_NUMBERS = 10;
const TRACER_LIFE = 0.09;
const IMPACT_LIFE = 0.35;

interface Slot {
  active: boolean;
  life: number;
  maxLife: number;
}

export function EffectsLayer({ quality }: { quality: "low" | "medium" | "high" }) {
  const tracerRefs = useRef<(THREE.Mesh | null)[]>([]);
  const tracerSlots = useRef<Slot[]>(Array.from({ length: MAX_TRACERS }, () => ({ active: false, life: 0, maxLife: TRACER_LIFE })));
  const impactRefs = useRef<(THREE.Mesh | null)[]>([]);
  const impactSlots = useRef<Slot[]>(Array.from({ length: MAX_IMPACTS }, () => ({ active: false, life: 0, maxLife: IMPACT_LIFE })));
  const destructionRefs = useRef<(THREE.Mesh | null)[]>([]);
  const destructionSlots = useRef<Slot[]>(Array.from({ length: MAX_DESTRUCTIONS }, () => ({ active: false, life: 0, maxLife: BUILD_CONFIG.destructionEffectDuration })));

  const [damageNumbers, setDamageNumbers] = useState<{ id: number; point: [number, number, number]; amount: number; headshot: boolean; born: number }[]>([]);
  const dmgIdRef = useRef(0);

  const maxDamageNumbers = quality === "low" ? 4 : MAX_DAMAGE_NUMBERS;
  const maxImpacts = quality === "low" ? 6 : quality === "medium" ? 10 : MAX_IMPACTS;

  useEffect(() => {
    const unsub = effectsBus.subscribe((e: EffectEvent) => {
      if (e.kind === "tracer") spawnTracer(e);
      else if (e.kind === "impact") spawnImpact(e);
      else if (e.kind === "destruction") spawnDestruction(e);
      else if (e.kind === "damageNumber") spawnDamageNumber(e);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function spawnTracer(e: Extract<EffectEvent, { kind: "tracer" }>) {
    const idx = tracerSlots.current.findIndex((s) => !s.active);
    if (idx === -1) return;
    const mesh = tracerRefs.current[idx];
    if (!mesh) return;
    const from = new THREE.Vector3(...e.from);
    const to = new THREE.Vector3(...e.to);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const dist = from.distanceTo(to);
    mesh.position.copy(mid);
    mesh.lookAt(to);
    mesh.rotateX(Math.PI / 2);
    mesh.scale.set(1, dist, 1);
    (mesh.material as THREE.MeshBasicMaterial).color.set(e.color);
    (mesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
    tracerSlots.current[idx] = { active: true, life: TRACER_LIFE, maxLife: TRACER_LIFE };
  }

  function spawnImpact(e: Extract<EffectEvent, { kind: "impact" }>) {
    if (impactRefs.current.length === 0) return;
    const idx = impactSlots.current.findIndex((s) => !s.active);
    if (idx === -1 || idx >= maxImpacts) return;
    const mesh = impactRefs.current[idx];
    if (!mesh) return;
    mesh.position.set(...e.point);
    mesh.scale.setScalar(0.05);
    (mesh.material as THREE.MeshBasicMaterial).color.set(e.color);
    (mesh.material as THREE.MeshBasicMaterial).opacity = 1;
    impactSlots.current[idx] = { active: true, life: IMPACT_LIFE, maxLife: IMPACT_LIFE };
  }

  function spawnDestruction(e: Extract<EffectEvent, { kind: "destruction" }>) {
    const idx = destructionSlots.current.findIndex((s) => !s.active);
    if (idx === -1) return;
    const mesh = destructionRefs.current[idx];
    if (!mesh) return;
    mesh.position.set(...e.point);
    mesh.scale.setScalar(0.15);
    (mesh.material as THREE.MeshBasicMaterial).opacity = 1;
    destructionSlots.current[idx] = { active: true, life: BUILD_CONFIG.destructionEffectDuration, maxLife: BUILD_CONFIG.destructionEffectDuration };
  }

  function spawnDamageNumber(e: Extract<EffectEvent, { kind: "damageNumber" }>) {
    dmgIdRef.current += 1;
    const id = dmgIdRef.current;
    setDamageNumbers((prev) => {
      const next = [...prev, { id, point: e.point, amount: e.amount, headshot: e.headshot, born: performance.now() }];
      return next.length > maxDamageNumbers ? next.slice(next.length - maxDamageNumbers) : next;
    });
    setTimeout(() => {
      setDamageNumbers((prev) => prev.filter((d) => d.id !== id));
    }, 900);
  }

  useFrame((_, dt) => {
    tracerSlots.current.forEach((s, i) => {
      if (!s.active) return;
      s.life -= dt;
      const mesh = tracerRefs.current[i];
      if (mesh) (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (s.life / s.maxLife) * 0.85);
      if (s.life <= 0) s.active = false;
    });
    impactSlots.current.forEach((s, i) => {
      if (!s.active) return;
      s.life -= dt;
      const mesh = impactRefs.current[i];
      if (mesh) {
        const t = 1 - s.life / s.maxLife;
        mesh.scale.setScalar(0.05 + t * 0.35);
        (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t);
      }
      if (s.life <= 0) s.active = false;
    });
    destructionSlots.current.forEach((s, i) => {
      if (!s.active) return;
      s.life -= dt;
      const mesh = destructionRefs.current[i];
      if (mesh) {
        const t = 1 - s.life / s.maxLife;
        mesh.scale.setScalar(0.15 + t * 1.2);
        mesh.rotation.x += dt * 4;
        mesh.rotation.y += dt * 3;
        (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t);
      }
      if (s.life <= 0) s.active = false;
    });
  });

  const tracerGeo = useMemo(() => new THREE.CylinderGeometry(0.015, 0.015, 1, 5), []);
  const impactGeo = useMemo(() => new THREE.SphereGeometry(1, 6, 6), []);
  const destructionGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  return (
    <group>
      {Array.from({ length: MAX_TRACERS }).map((_, i) => (
        <mesh key={`t${i}`} ref={(r) => { tracerRefs.current[i] = r; }} geometry={tracerGeo} visible>
          <meshBasicMaterial color="#ffe08a" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
      {Array.from({ length: MAX_IMPACTS }).map((_, i) => (
        <mesh key={`i${i}`} ref={(r) => { impactRefs.current[i] = r; }} geometry={impactGeo}>
          <meshBasicMaterial color="#ffcf7a" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
      {Array.from({ length: MAX_DESTRUCTIONS }).map((_, i) => (
        <mesh key={`d${i}`} ref={(r) => { destructionRefs.current[i] = r; }} geometry={destructionGeo}>
          <meshBasicMaterial color="#8a94a8" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
      {damageNumbers.map((d) => (
        <Billboard key={d.id} position={d.point}>
          <Text
            fontSize={d.headshot ? 0.42 : 0.3}
            color={d.headshot ? "#ff8a33" : "#ffffff"}
            outlineWidth={0.02}
            outlineColor="#000000"
            anchorX="center"
            anchorY="middle"
          >
            {d.amount}
          </Text>
        </Billboard>
      ))}
    </group>
  );
}
