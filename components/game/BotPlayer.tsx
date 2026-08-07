"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { nanoid } from "nanoid";

import { MOVEMENT } from "@/game/config/movement";
import { WEAPONS, type WeaponId } from "@/game/config/weapons";
import { HEALING, type HealingItemId } from "@/game/config/healing";
import { BUILD_TYPES } from "@/game/config/builds";
import { BOT_DIFFICULTY, type BotDifficulty } from "@/game/config/bots";
import { useCharacterMover } from "@/game/physics/useCharacterMover";
import { useDamageableRegistry, type DamageableEntry } from "@/game/physics/damageable";
import { castWorldRay } from "@/game/physics/raycast";
import { fireWeapon, computeDamage } from "@/game/weapons/hitscan";
import { validatePlacement } from "@/game/building/grid";
import { effectsBus } from "@/game/effects/effectsBus";
import { soundManager } from "@/game/audio/soundManager";
import { BotBrain, type BotPerception } from "@/game/bots/fsm";
import { positionTracker } from "@/game/state/positionTracker";
import { usePlayerStore } from "@/stores/playerStore";
import { useMatchStore } from "@/stores/matchStore";
import { useBuildsStore } from "@/stores/buildsStore";
import { CharacterModel } from "@/components/game/CharacterModel";
import { weaponArmPose, type ArmPoseId } from "@/game/animation/pose";
import { WeaponView } from "@/components/game/WeaponView";
import type { Vec3 } from "@/game/networking/adapter";

const BOT_ID = "bot-player";

export function BotPlayer({ difficulty, spawn }: { difficulty: BotDifficulty; spawn: { position: Vec3; yaw: number } }) {
  const { world, rapier } = useRapier();
  const move = useCharacterMover();
  const registry = useDamageableRegistry();

  const rigidBody = useRef<RapierRigidBody>(null);
  const group = useRef<THREE.Group>(null);
  const hitboxMesh = useRef<THREE.Mesh>(null);
  const movingRef = useRef(0);
  const fireFlashRef = useRef(0);
  const noSwitchFlash = useRef(0);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponId>("rifle");

  const velocityY = useRef(0);
  const grounded = useRef(false);
  const facingYaw = useRef(spawn.yaw);
  const brain = useMemo(() => new BotBrain(difficulty), []); // eslint-disable-line react-hooks/exhaustive-deps
  const nextFireTime = useRef(0);
  const damagedUntil = useRef(0);
  const healUntil = useRef(0);
  const healItem = useRef<HealingItemId | null>(null);
  const healingCounts = useRef({ shieldPotion: HEALING.shieldPotion.startingCount, medkit: HEALING.medkit.startingCount });
  const health = useRef(100);
  const shield = useRef(0);
  const buildCooldown = useRef(0);
  const armPoseRef = useRef<ArmPoseId>("rifle");
  const hitReactRef = useRef(0);
  const [isDead, setIsDead] = useState(false);

  const resetSignal = useMatchStore((s) => s.resetSignal);

  useEffect(() => brain.setDifficulty(difficulty), [difficulty, brain]);

  useEffect(() => {
    health.current = 100;
    shield.current = 0;
    healingCounts.current = { shieldPotion: HEALING.shieldPotion.startingCount, medkit: HEALING.medkit.startingCount };
    velocityY.current = 0;
    facingYaw.current = spawn.yaw;
    if (rigidBody.current) rigidBody.current.setTranslation({ x: spawn.position[0], y: spawn.position[1], z: spawn.position[2] }, true);
    usePlayerStore.getState().setOpponent({ health: 100, shield: 0, connected: true });
    setIsDead(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  useEffect(() => {
    if (!hitboxMesh.current) return;
    const entry: DamageableEntry = {
      id: BOT_ID,
      kind: "bot",
      side: "bot",
      object: hitboxMesh.current,
      headY: spawn.position[1] + MOVEMENT.capsuleHalfHeight * 2 + MOVEMENT.capsuleRadius - 0.35,
      isAlive: () => health.current > 0,
      takeDamage: (amount) => {
        if (health.current <= 0) return;
        let remaining = amount;
        if (shield.current > 0) {
          const absorbed = Math.min(shield.current, remaining);
          shield.current -= absorbed;
          remaining -= absorbed;
        }
        health.current = Math.max(0, health.current - remaining);
        damagedUntil.current = performance.now() + 1500;
        hitReactRef.current = performance.now();
        usePlayerStore.getState().setOpponent({ health: health.current, shield: shield.current });
        if (health.current <= 0) {
          soundManager.play("elimination");
          usePlayerStore.getState().setEliminationMessage("Opponent eliminated");
          useMatchStore.getState().endRound("local");
          setIsDead(true);
        }
      },
    };
    registry.register(entry);
    return () => registry.unregister(BOT_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, rawDt) => {
    if (!rigidBody.current) return;
    const dt = Math.min(rawDt, 1 / 20);
    const phase = useMatchStore.getState().phase;
    if (phase !== "combat" || health.current <= 0) {
      move(rigidBody.current, new THREE.Vector3(0, MOVEMENT.gravity * dt * dt, 0));
      return;
    }

    const now = performance.now();
    const botPos = rigidBody.current.translation();
    const botVec = new THREE.Vector3(botPos.x, botPos.y, botPos.z);
    const playerVec = positionTracker.local;

    const distance = botVec.distanceTo(playerVec);
    const eye = botVec.clone().add(new THREE.Vector3(0, MOVEMENT.eyeHeight, 0));
    const playerEye = playerVec.clone().add(new THREE.Vector3(0, MOVEMENT.eyeHeight * 0.8, 0));
    const dirToPlayer = playerEye.clone().sub(eye);
    const dist = dirToPlayer.length();
    dirToPlayer.normalize();
    const worldHit = dist > 0.01 ? castWorldRay(rapier, world, eye, dirToPlayer, dist - 0.3) : null;
    const canSee =
      !usePlayerStore.getState().local.isDead &&
      worldHit === null &&
      distance <= BOT_DIFFICULTY[difficulty].viewDistance;

    const perception: BotPerception = {
      botPos: botVec,
      playerPos: playerVec.clone(),
      distance,
      canSee,
      botHealth: health.current,
      botShield: shield.current,
      recentlyDamaged: now < damagedUntil.current,
      healCharges: healingCounts.current,
    };

    const intent = brain.update(dt, perception, now / 1000);
    armPoseRef.current = healItem.current ? (healItem.current === "shieldPotion" ? "shield" : "heal") : weaponArmPose(currentWeapon);

    // ---- Healing ----
    if (intent.wantsToHeal) {
      if (healItem.current !== intent.wantsToHeal) {
        healItem.current = intent.wantsToHeal;
        healUntil.current = now + HEALING[intent.wantsToHeal].duration * 1000;
        soundManager.play(intent.wantsToHeal === "shieldPotion" ? "potionUse" : "medkitUse", { volume: 0.6 });
      } else if (now >= healUntil.current) {
        const cfg = HEALING[intent.wantsToHeal];
        if (intent.wantsToHeal === "shieldPotion") {
          healingCounts.current.shieldPotion -= 1;
          shield.current = Math.min(100, shield.current + cfg.restore);
        } else {
          healingCounts.current.medkit -= 1;
          health.current = Math.min(100, health.current + cfg.restore);
        }
        usePlayerStore.getState().setOpponent({ health: health.current, shield: shield.current });
        healItem.current = null;
      }
    } else {
      healItem.current = null;
    }
    const isHealingNow = healItem.current !== null;

    // ---- Movement ----
    let speedFrac = 0;
    if (!isHealingNow && intent.moveTarget) {
      const toTarget = intent.moveTarget.clone().sub(botVec);
      toTarget.y = 0;
      const dirLen = toTarget.length();
      if (dirLen > 0.4) {
        toTarget.normalize();
        const cfgSpeed = MOVEMENT.walkSpeed * BOT_DIFFICULTY[difficulty].moveSpeedMultiplier;
        const control = grounded.current ? 1 : MOVEMENT.airControl;
        speedFrac = 1;
        const desired = new THREE.Vector3(toTarget.x * cfgSpeed * control * dt, 0, toTarget.z * cfgSpeed * control * dt);
        if (grounded.current) velocityY.current = intent.wantsToJump ? MOVEMENT.jumpVelocity : -1;
        else velocityY.current = Math.max(MOVEMENT.maxFallSpeed, velocityY.current + MOVEMENT.gravity * dt);
        desired.y = velocityY.current * dt;
        const result = move(rigidBody.current, desired);
        grounded.current = result.grounded;
      } else if (grounded.current) {
        velocityY.current = -1;
        move(rigidBody.current, new THREE.Vector3(0, velocityY.current * dt, 0));
      }
    } else {
      if (grounded.current) velocityY.current = -1;
      else velocityY.current = Math.max(MOVEMENT.maxFallSpeed, velocityY.current + MOVEMENT.gravity * dt);
      const result = move(rigidBody.current, new THREE.Vector3(0, velocityY.current * dt, 0));
      grounded.current = result.grounded;
    }
    movingRef.current = speedFrac;

    const newPos = rigidBody.current.translation();
    positionTracker.opponent.set(newPos.x, newPos.y, newPos.z);

    const faceTarget = intent.aimAt ?? (intent.moveTarget ?? undefined);
    if (faceTarget) {
      const flat = new THREE.Vector3(faceTarget.x - newPos.x, 0, faceTarget.z - newPos.z);
      if (flat.lengthSq() > 0.0001) facingYaw.current = Math.atan2(flat.x, flat.z);
    }
    if (group.current) {
      group.current.position.set(newPos.x, newPos.y, newPos.z);
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, facingYaw.current, MOVEMENT.turnSmoothing, dt);
    }

    // ---- Building ----
    if (intent.wantsToBuild && now >= buildCooldown.current) {
      buildCooldown.current = now + 900;
      tryBotBuild(intent.wantsToBuild, newPos, playerVec);
    }

    // ---- Shooting ----
    if (intent.wantsToShoot && intent.aimAt && now >= nextFireTime.current) {
      const weapon = distance < 9 && Math.random() < 0.5 ? WEAPONS.shotgun : WEAPONS.rifle;
      nextFireTime.current = now + 1000 / weapon.fireRate;
      fireBotWeapon(weapon, eye, intent.aimAt, difficulty);
    }
  });

  function tryBotBuild(kind: "wall" | "floor" | "ramp", botTranslation: { x: number; y: number; z: number }, playerVec: THREE.Vector3) {
    const botVec = new THREE.Vector3(botTranslation.x, botTranslation.y, botTranslation.z);
    const towardPlayer = playerVec.clone().sub(botVec).setY(0).normalize();
    const placePos = botVec.clone().addScaledVector(towardPlayer, 2.2);
    const state = useBuildsStore.getState();
    const activeCount = state.builds.filter((b) => b.owner === "bot").length;
    const rotationY = Math.atan2(towardPlayer.x, towardPlayer.z) + Math.PI / 2;
    const result = validatePlacement(
      kind,
      [placePos.x, placePos.y, placePos.z],
      rotationY,
      state.builds,
      [[botVec.x, botVec.y, botVec.z], [playerVec.x, playerVec.y, playerVec.z]],
      activeCount
    );
    if (!result.valid) return;
    const cfg = BUILD_TYPES[kind];
    state.add({ id: nanoid(8), kind, owner: "bot", position: result.position, rotationY: result.rotationY, health: cfg.health, maxHealth: cfg.health });
    soundManager.play("buildPlace", { volume: 0.5 });
  }

  function fireBotWeapon(weapon: (typeof WEAPONS)["rifle"], origin: THREE.Vector3, aimAt: THREE.Vector3, diff: BotDifficulty) {
    const inaccuracy = 1 - BOT_DIFFICULTY[diff].aimAccuracy;
    const dir = aimAt.clone().sub(origin).normalize();
    const jitter = new THREE.Vector3((Math.random() - 0.5) * inaccuracy * 0.3, (Math.random() - 0.5) * inaccuracy * 0.3, (Math.random() - 0.5) * inaccuracy * 0.3);
    dir.add(jitter).normalize();

    fireFlashRef.current = performance.now();
    if (weapon.id !== currentWeapon) setCurrentWeapon(weapon.id);
    soundManager.play(weapon.id === "rifle" ? "rifleFire" : "shotgunFire", { volume: 0.55 });

    const { hits, tracerEnd } = fireWeapon(weapon, origin, dir, registry.all(), BOT_ID);
    effectsBus.emit({ kind: "tracer", from: [origin.x, origin.y, origin.z], to: [tracerEnd.x, tracerEnd.y, tracerEnd.z], color: "#ffb27a" });

    for (const h of hits) {
      if (h.entry.kind === "build") {
        h.entry.takeDamage(weapon.damage, "bot");
        effectsBus.emit({ kind: "impact", point: [h.point.x, h.point.y, h.point.z], color: "#8a94a8" });
      } else if (h.entry.side === "local") {
        h.entry.takeDamage(computeDamage(weapon, h.headshot), "bot");
        effectsBus.emit({ kind: "impact", point: [h.point.x, h.point.y, h.point.z], color: "#ff5555" });
      }
    }
  }

  const spawnPos = spawn.position;

  return (
    <group>
      <RigidBody ref={rigidBody} type="kinematicPosition" colliders={false} position={spawnPos} enabledRotations={[false, false, false]}>
        <CapsuleCollider args={[MOVEMENT.capsuleHalfHeight, MOVEMENT.capsuleRadius]} />
      </RigidBody>
      <group ref={group}>
        <mesh ref={hitboxMesh} visible={false} position={[0, MOVEMENT.capsuleHalfHeight + MOVEMENT.capsuleRadius, 0]}>
          <capsuleGeometry args={[MOVEMENT.capsuleRadius + 0.03, MOVEMENT.capsuleHalfHeight * 2, 4, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>
        <CharacterModel
          color="#c96b3a"
          accent="#ff8a33"
          movingRef={movingRef}
          groundedRef={grounded}
          velocityYRef={velocityY}
          armPoseRef={armPoseRef}
          fireReactRef={fireFlashRef}
          hitReactRef={hitReactRef}
          eliminated={isDead}
        />
        <WeaponView weapon={currentWeapon} fireFlashRef={fireFlashRef} reloading={false} switchFlashUntilRef={noSwitchFlash} accent="#ff8a33" />
      </group>
    </group>
  );
}
