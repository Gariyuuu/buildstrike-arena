"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

import { MOVEMENT } from "@/game/config/movement";
import { WEAPONS, type WeaponId } from "@/game/config/weapons";
import { useCharacterMover } from "@/game/physics/useCharacterMover";
import { useDamageableRegistry, type DamageableEntry } from "@/game/physics/damageable";
import { fireWeapon, computeDamage } from "@/game/weapons/hitscan";
import { effectsBus } from "@/game/effects/effectsBus";
import { soundManager } from "@/game/audio/soundManager";
import { BRBotBrain } from "@/game/br/brBotBrain";
import { brPositions } from "@/game/br/positionRegistry";
import { lootRegistry } from "@/game/br/loot";
import { claimGroundLootEverywhere } from "@/game/br/applyLoot";
import { computeZoneState, damagePerSecondFor, isOutsideZone } from "@/game/br/zone";
import { useBRStore } from "@/stores/brStore";
import { CharacterModel } from "@/components/game/CharacterModel";
import { WeaponView } from "@/components/game/WeaponView";
import { weaponArmPose, type ArmPoseId } from "@/game/animation/pose";
import { SKINS } from "@/game/config/cosmetics";
import type { BRAgentSpawn } from "@/game/br/roster";
import { groundLootLookup } from "@/game/br/loot";

const BOT_SKIN_IDS = Object.keys(SKINS);
const CHASE_STOP_DISTANCE = 1.5;

export function BRAgent({ agent, spawn, shadows }: { agent: BRAgentSpawn; spawn: [number, number, number]; shadows: boolean }) {
  const registry = useDamageableRegistry();
  const move = useCharacterMover();
  const rigidBody = useRef<RapierRigidBody>(null);
  const group = useRef<THREE.Group>(null);
  const hitboxMesh = useRef<THREE.Mesh>(null);
  const movingRef = useRef(0);
  const fireFlashRef = useRef(0);
  const noSwitchFlash = useRef(0);
  const armPoseRef = useRef<ArmPoseId>("none");
  const hitReactRef = useRef(0);
  const facingYaw = useRef(0);
  const velocityY = useRef(0);
  const grounded = useRef(false);
  const nextFireTime = useRef(0);
  const weaponId = useRef<WeaponId | null>(null);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponId | null>(null);
  const [isDead, setIsDead] = useState(false);
  const brain = useMemo(() => new BRBotBrain(), []);
  const skin = useMemo(() => SKINS[BOT_SKIN_IDS[Math.floor(Math.random() * BOT_SKIN_IDS.length)]], []);

  useEffect(() => {
    if (rigidBody.current) rigidBody.current.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hitboxMesh.current) return;
    const entry: DamageableEntry = {
      id: agent.id,
      kind: "bot",
      side: "bot",
      object: hitboxMesh.current,
      headY: spawn[1] + MOVEMENT.capsuleHalfHeight * 2 + MOVEMENT.capsuleRadius - 0.35,
      isAlive: () => useBRStore.getState().agents.find((a) => a.id === agent.id)?.alive ?? false,
      takeDamage: (amount) => {
        useBRStore.getState().damageAgent(agent.id, amount);
        hitReactRef.current = performance.now();
      },
    };
    registry.register(entry);
    return () => registry.unregister(agent.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alive = useBRStore((s) => s.agents.find((a) => a.id === agent.id)?.alive ?? true);
  useEffect(() => {
    if (!alive && !isDead) {
      setIsDead(true);
      brPositions.setAlive(agent.id, false);
      soundManager.play("elimination", { volume: 0.35 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alive]);

  function fireAt(weapon: (typeof WEAPONS)[WeaponId], origin: THREE.Vector3, dir: THREE.Vector3) {
    fireFlashRef.current = performance.now();
    const fireSound = weapon.soundProfile === "shotgun" ? "shotgunFire" : weapon.soundProfile === "pistol" ? "pistolFire" : "rifleFire";
    soundManager.play(fireSound, { volume: 0.3 });
    const { hits, tracerEnd } = fireWeapon(weapon, origin, dir, registry.all(), agent.id);
    effectsBus.emit({ kind: "tracer", from: [origin.x, origin.y, origin.z], to: [tracerEnd.x, tracerEnd.y, tracerEnd.z], color: "#ffb27a" });
    for (const h of hits) {
      if (h.entry.id === agent.id) continue;
      h.entry.takeDamage(computeDamage(weapon, h.headshot), "bot");
      effectsBus.emit({ kind: "impact", point: [h.point.x, h.point.y, h.point.z], color: "#ff5555" });
    }
  }

  useFrame((_, rawDt) => {
    if (!rigidBody.current || isDead) return;
    const dt = Math.min(rawDt, 1 / 20);
    const s = useBRStore.getState();
    if (s.phase !== "combat") return;

    const pos = rigidBody.current.translation();
    const botVec = new THREE.Vector3(pos.x, pos.y, pos.z);

    // Zone damage tick for this bot (its health lives in brStore.agents).
    const elapsed = (performance.now() - s.matchStartedAt) / 1000;
    const zone = computeZoneState(elapsed);
    if (isOutsideZone(pos.x, pos.z, zone.radius)) {
      useBRStore.getState().damageAgent(agent.id, damagePerSecondFor(zone.phaseIndex) * dt);
    }

    const nearestEnemy = brPositions.nearestEnemy(agent.id, pos.x, pos.z, agent.squadId);
    const nearestLootRaw = lootRegistry.nearest(pos.x, pos.z, !weaponId.current);
    const nearestLoot = nearestLootRaw ? { id: nearestLootRaw.id, x: nearestLootRaw.x, z: nearestLootRaw.z, distance: nearestLootRaw.distance } : null;

    const intent = brain.update(
      {
        pos: botVec,
        hasWeapon: !!weaponId.current,
        nearestEnemy,
        nearestLoot,
        outsideZone: isOutsideZone(pos.x, pos.z, zone.radius),
      },
      performance.now() / 1000
    );

    // ---- Pickup ----
    if (intent.wantsPickup) {
      const drop = groundLootLookup.get(intent.wantsPickup);
      if (drop && drop.kind === "weapon" && drop.weaponId) {
        weaponId.current = drop.weaponId;
        setCurrentWeapon(drop.weaponId);
        claimGroundLootEverywhere(intent.wantsPickup);
      } else if (drop) {
        claimGroundLootEverywhere(intent.wantsPickup);
      }
    }

    // ---- Movement ----
    let speedFrac = 0;
    if (intent.moveTarget) {
      const toTarget = intent.moveTarget.clone().sub(botVec);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist > CHASE_STOP_DISTANCE) {
        toTarget.normalize();
        speedFrac = 1;
        const desired = new THREE.Vector3(toTarget.x * MOVEMENT.walkSpeed * dt, 0, toTarget.z * MOVEMENT.walkSpeed * dt);
        if (grounded.current) velocityY.current = -1;
        else velocityY.current = Math.max(MOVEMENT.maxFallSpeed, velocityY.current + MOVEMENT.gravity * dt);
        desired.y = velocityY.current * dt;
        const result = move(rigidBody.current, desired);
        grounded.current = result.grounded;
      }
    }
    if (speedFrac === 0) {
      if (grounded.current) velocityY.current = -1;
      else velocityY.current = Math.max(MOVEMENT.maxFallSpeed, velocityY.current + MOVEMENT.gravity * dt);
      const result = move(rigidBody.current, new THREE.Vector3(0, velocityY.current * dt, 0));
      grounded.current = result.grounded;
    }
    movingRef.current = speedFrac;

    const newPos = rigidBody.current.translation();
    brPositions.set(agent.id, newPos.x, newPos.y, newPos.z, agent.squadId, true);

    const faceTarget = intent.aimAt ?? intent.moveTarget;
    if (faceTarget) {
      const flat = new THREE.Vector3(faceTarget.x - newPos.x, 0, faceTarget.z - newPos.z);
      if (flat.lengthSq() > 0.0001) facingYaw.current = Math.atan2(flat.x, flat.z);
    }
    if (group.current) {
      group.current.position.set(newPos.x, newPos.y, newPos.z);
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, facingYaw.current, MOVEMENT.turnSmoothing, dt);
    }

    armPoseRef.current = weaponId.current ? weaponArmPose(weaponId.current) : "none";

    // ---- Shooting ----
    if (intent.wantsToShoot && intent.aimAt && weaponId.current && performance.now() >= nextFireTime.current) {
      const weapon = WEAPONS[weaponId.current];
      nextFireTime.current = performance.now() + 1000 / weapon.fireRate;
      const eye = new THREE.Vector3(newPos.x, newPos.y + MOVEMENT.eyeHeight, newPos.z);
      const dir = new THREE.Vector3(intent.aimAt.x - eye.x, 0, intent.aimAt.z - eye.z).normalize();
      const jitter = 0.06;
      dir.x += (Math.random() - 0.5) * jitter;
      dir.z += (Math.random() - 0.5) * jitter;
      dir.normalize();
      fireAt(weapon, eye, dir);
    }
  });

  return (
    <group>
      <RigidBody ref={rigidBody} type="kinematicPosition" colliders={false} position={spawn} enabledRotations={[false, false, false]}>
        <CapsuleCollider args={[MOVEMENT.capsuleHalfHeight, MOVEMENT.capsuleRadius]} />
      </RigidBody>
      <group ref={group} visible={!isDead}>
        <mesh ref={hitboxMesh} visible={false} position={[0, MOVEMENT.capsuleHalfHeight + MOVEMENT.capsuleRadius, 0]}>
          <capsuleGeometry args={[MOVEMENT.capsuleRadius + 0.03, MOVEMENT.capsuleHalfHeight * 2, 4, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>
        <CharacterModel color="#c96b3a" accent="#ff8a33" skin={skin?.skin} shadows={shadows} movingRef={movingRef} groundedRef={grounded} velocityYRef={velocityY} armPoseRef={armPoseRef} fireReactRef={fireFlashRef} hitReactRef={hitReactRef} eliminated={isDead} />
        {currentWeapon && <WeaponView weapon={currentWeapon} fireFlashRef={fireFlashRef} reloading={false} switchFlashUntilRef={noSwitchFlash} accent="#ff8a33" />}
      </group>
    </group>
  );
}
