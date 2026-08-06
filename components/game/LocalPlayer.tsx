"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

import { MOVEMENT } from "@/game/config/movement";
import { WEAPONS, type WeaponId } from "@/game/config/weapons";
import { HEALING, type HealingItemId } from "@/game/config/healing";
import { BUILD_CONFIG, type BuildKind } from "@/game/config/builds";
import { useCharacterMover } from "@/game/physics/useCharacterMover";
import { useDamageableRegistry, type DamageableEntry } from "@/game/physics/damageable";
import { castWorldRay } from "@/game/physics/raycast";
import { fireWeapon, computeDamage } from "@/game/weapons/hitscan";
import { validatePlacement } from "@/game/building/grid";
import { effectsBus } from "@/game/effects/effectsBus";
import { positionTracker } from "@/game/state/positionTracker";
import { soundManager } from "@/game/audio/soundManager";
import { usePointerLock } from "@/hooks/usePointerLock";
import { useKeyboard, drainJustPressed } from "@/hooks/useKeyboard";
import { useMouseButtons, drainMouseEdges } from "@/hooks/useMouseButtons";
import { usePlayerStore, type HudState } from "@/stores/playerStore";
import { useMatchStore } from "@/stores/matchStore";
import { useGameStore } from "@/stores/gameStore";
import { useNetworkStore } from "@/stores/networkStore";
import { useBuildsStore } from "@/stores/buildsStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { GameAdapter, Vec3 } from "@/game/networking/adapter";
import { CharacterModel } from "@/components/game/CharacterModel";
import { WeaponView } from "@/components/game/WeaponView";
import { BuildGhost, type BuildGhostState } from "@/components/game/BuildGhost";

const ITEM_ORDER: (WeaponId | HealingItemId)[] = ["rifle", "shotgun", "shieldPotion", "medkit"];
const BUILD_KEYS: Record<string, BuildKind> = { z: "wall", x: "floor", c: "ramp" };
const LOCAL_ID = "local-player";
const UP = new THREE.Vector3(0, 1, 0);

export function LocalPlayer({
  mode,
  adapter,
  spawn,
  domElement,
}: {
  mode: "bot" | "online";
  adapter: GameAdapter;
  spawn: { position: Vec3; yaw: number };
  domElement: React.RefObject<HTMLElement | null>;
}) {
  const { camera } = useThree();
  const { world, rapier } = useRapier();
  const move = useCharacterMover();
  const registry = useDamageableRegistry();

  const rigidBody = useRef<RapierRigidBody>(null);
  const group = useRef<THREE.Group>(null);
  const hitboxMesh = useRef<THREE.Mesh>(null);
  const movingRef = useRef(0);
  const fireFlashRef = useRef(0);

  const yaw = useRef(spawn.yaw);
  const pitch = useRef(0);
  const recoilOffset = useRef(0);
  const velocityY = useRef(0);
  const grounded = useRef(false);
  const isAiming = useRef(false);

  const nextFireTime = useRef(0);
  const reloadEndTime = useRef(0);
  const placementCooldownEnd = useRef(0);
  const healEndTime = useRef(0);
  const healStartedItem = useRef<HealingItemId | null>(null);
  const lastStateSent = useRef(0);
  const switchFlashUntil = useRef(0);

  const ghost = useRef<BuildGhostState>({ visible: false, position: [0, 0, 0], rotationY: 0, kind: "wall", valid: false });

  const keyboard = useKeyboard(true);
  const mouse = useMouseButtons(domElement, true);
  const { locked, requestLock, consumeDelta } = usePointerLock(domElement);

  const weaponForView = usePlayerStore((s) => s.local.weapon);
  const isReloading = usePlayerStore((s) => s.local.isReloading);
  const resetSignal = useMatchStore((s) => s.resetSignal);

  useEffect(() => {
    yaw.current = spawn.yaw;
    pitch.current = 0;
    if (rigidBody.current) {
      rigidBody.current.setTranslation({ x: spawn.position[0], y: spawn.position[1], z: spawn.position[2] }, true);
    }
    velocityY.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  useEffect(() => {
    const onClickToLock = () => {
      if (locked) return;
      if (useGameStore.getState().paused) return;
      if (useMatchStore.getState().phase === "match-end") return;
      if (mode === "online" && !useNetworkStore.getState().matchStarted) return;
      soundManager.resume();
      requestLock();
    };
    const el = domElement.current;
    el?.addEventListener("click", onClickToLock);
    return () => el?.removeEventListener("click", onClickToLock);
  }, [domElement, locked, requestLock, mode]);

  // Register the local player as a damageable target — only meaningful in bot
  // mode, where the bot raycasts against this hitbox to land shots. In online
  // mode incoming damage arrives via authoritative server messages instead.
  useEffect(() => {
    if (!hitboxMesh.current) return;
    const entry: DamageableEntry = {
      id: LOCAL_ID,
      kind: "player",
      side: "local",
      object: hitboxMesh.current,
      headY: spawn.position[1] + MOVEMENT.capsuleHalfHeight * 2 + MOVEMENT.capsuleRadius - 0.35,
      isAlive: () => !usePlayerStore.getState().local.isDead,
      takeDamage: (amount) => {
        if (mode !== "bot") return;
        applyLocalDamage(amount);
      },
    };
    registry.register(entry);
    return () => registry.unregister(LOCAL_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function applyLocalDamage(amount: number) {
    const store = usePlayerStore.getState();
    if (store.local.isDead) return;
    let remaining = amount;
    let shield = store.local.shield;
    if (shield > 0) {
      const absorbed = Math.min(shield, remaining);
      shield -= absorbed;
      remaining -= absorbed;
    }
    const health = Math.max(0, store.local.health - remaining);
    usePlayerStore.getState().setLocal({ shield, health, isDead: health <= 0 });
    usePlayerStore.getState().triggerDamageFlash();
    soundManager.play("takeDamage");
    if (health <= 0) {
      soundManager.play("elimination");
      usePlayerStore.getState().setEliminationMessage("You were eliminated");
      useMatchStore.getState().endRound("opponent");
    }
  }

  useFrame((_, rawDt) => {
    if (!rigidBody.current) return;
    const dt = Math.min(rawDt, 1 / 20);
    const paused = useGameStore.getState().paused;
    const phase = useMatchStore.getState().phase;
    const combatActive = phase === "combat" && !paused;

    // ---- Look ----
    if (locked && !paused) {
      const d = consumeDelta();
      const sens = useSettingsStore.getState().mouseSensitivity * 0.0022;
      yaw.current += d.x * sens;
      pitch.current -= d.y * sens;
      pitch.current = THREE.MathUtils.clamp(pitch.current, -1.25, 1.25);
    }
    recoilOffset.current = THREE.MathUtils.damp(recoilOffset.current, 0, 8, dt);

    const euler = new THREE.Euler(pitch.current + recoilOffset.current, yaw.current, 0, "YXZ");
    const quat = new THREE.Quaternion().setFromEuler(euler);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
    const forwardFlat = new THREE.Vector3(forward.x, 0, forward.z).normalize();
    const right = new THREE.Vector3().crossVectors(forward, UP).normalize();

    const justPressed = drainJustPressed(keyboard);
    const mouseEdges = drainMouseEdges(mouse);
    isAiming.current = mouse.current.right;

    const local = usePlayerStore.getState().local;

    if (!paused && !local.isDead) {
      if (combatActive) {
        if (justPressed.includes("1")) selectItem("rifle");
        if (justPressed.includes("2")) selectItem("shotgun");
        if (justPressed.includes("3")) selectItem("shieldPotion");
        if (mouseEdges.wheelDelta !== 0) {
          const curIdx = ITEM_ORDER.indexOf(local.selected);
          const nextIdx = (curIdx + (mouseEdges.wheelDelta > 0 ? 1 : -1) + ITEM_ORDER.length) % ITEM_ORDER.length;
          selectItem(ITEM_ORDER[nextIdx]);
        }
        if (justPressed.includes("q")) {
          usePlayerStore.getState().setLocal({ isBuildMode: !local.isBuildMode });
        }
        for (const key of justPressed) {
          if (BUILD_KEYS[key]) {
            usePlayerStore.getState().setLocal({ isBuildMode: true, buildKind: BUILD_KEYS[key] });
          }
        }
        if (justPressed.includes("f") && local.isBuildMode) {
          ghost.current.rotationY = (ghost.current.rotationY + Math.PI / 2) % (Math.PI * 2);
        }
        if (justPressed.includes("r") && !local.isBuildMode) {
          tryReload();
        }
      }

      // ---- Movement ----
      let speedFrac = 0;
      if (combatActive) {
        const inputZ = (keyboard.current.pressed.has("w") ? 1 : 0) - (keyboard.current.pressed.has("s") ? 1 : 0);
        const inputX = (keyboard.current.pressed.has("d") ? 1 : 0) - (keyboard.current.pressed.has("a") ? 1 : 0);
        const sprinting = keyboard.current.pressed.has("shift") && inputZ > 0;
        const moveDir = new THREE.Vector3().addScaledVector(right, inputX).addScaledVector(forwardFlat, inputZ);
        if (moveDir.lengthSq() > 0) moveDir.normalize();

        const speed = MOVEMENT.walkSpeed * (sprinting ? MOVEMENT.sprintMultiplier : 1);
        const control = grounded.current ? 1 : MOVEMENT.airControl;
        speedFrac = moveDir.length() * (sprinting ? 1 : 0.72);

        if (grounded.current && justPressed.includes(" ")) {
          velocityY.current = MOVEMENT.jumpVelocity;
          soundManager.play("jump");
        } else if (grounded.current) {
          velocityY.current = -1;
        } else {
          velocityY.current = Math.max(MOVEMENT.maxFallSpeed, velocityY.current + MOVEMENT.gravity * dt);
        }

        const desired = new THREE.Vector3(
          moveDir.x * speed * control * dt,
          velocityY.current * dt,
          moveDir.z * speed * control * dt
        );
        const result = move(rigidBody.current, desired);
        grounded.current = result.grounded;
      } else {
        move(rigidBody.current, new THREE.Vector3(0, MOVEMENT.gravity * dt * dt, 0));
      }
      movingRef.current = speedFrac;

      const pos = rigidBody.current.translation();
      const bodyPos: Vec3 = [pos.x, pos.y, pos.z];
      positionTracker.local.set(pos.x, pos.y, pos.z);
      const facingYaw = Math.atan2(forward.x, forward.z);
      if (group.current) {
        group.current.position.set(pos.x, pos.y, pos.z);
        group.current.rotation.y = facingYaw;
      }

      // ---- Build mode ----
      if (combatActive && local.isBuildMode) {
        updateBuildGhost(bodyPos, camera.position as THREE.Vector3, forward, local.buildKind);
        if (mouseEdges.leftJustPressed) tryPlaceBuild(local.buildKind);
      } else {
        ghost.current.visible = false;
      }

      // ---- Healing ----
      if (combatActive && !local.isBuildMode && (local.selected === "shieldPotion" || local.selected === "medkit")) {
        handleHealing(local, mouse.current.left);
      } else if (local.isHealing) {
        cancelHeal();
      }

      // ---- Shooting ----
      if (combatActive && !local.isBuildMode && (local.selected === "rifle" || local.selected === "shotgun")) {
        const weapon = WEAPONS[local.selected];
        const wantsFire = weapon.automatic ? mouse.current.left : mouseEdges.leftJustPressed;
        if (
          wantsFire &&
          performance.now() >= nextFireTime.current &&
          !local.isReloading &&
          local.ammoInMag > 0
        ) {
          fireLocalWeapon(weapon, camera.position as THREE.Vector3, forward);
        }
      }

      if (local.isReloading && performance.now() >= reloadEndTime.current) {
        const w = WEAPONS[local.weapon];
        usePlayerStore.getState().setLocal({ isReloading: false, ammoInMag: w.magazineSize });
      }

      if (mode === "online" && performance.now() - lastStateSent.current > 55) {
        lastStateSent.current = performance.now();
        adapter.sendState({
          position: bodyPos,
          rotationY: facingYaw,
          isBuildMode: local.isBuildMode,
          buildKind: local.buildKind,
          weapon: local.weapon,
        });
      }
    }

    // ---- Camera (always updates, even paused/dead, so menus have a live backdrop) ----
    const bp = rigidBody.current.translation();
    const eyePos = new THREE.Vector3(bp.x, bp.y + MOVEMENT.eyeHeight, bp.z);
    const camDistance = isAiming.current ? 2.6 : 4.4;
    const desiredCamPos = eyePos.clone().addScaledVector(forward, -camDistance).addScaledVector(UP, 1.05);

    const rayDir = desiredCamPos.clone().sub(eyePos);
    const maxLen = rayDir.length();
    let finalCamPos = desiredCamPos;
    if (maxLen > 0.05) {
      rayDir.normalize();
      const hit = castWorldRay(rapier, world, eyePos, rayDir, maxLen);
      if (hit) finalCamPos = eyePos.clone().addScaledVector(rayDir, Math.max(0.6, hit.toi - 0.3));
    }

    camera.position.lerp(finalCamPos, 1 - Math.exp(-dt * 12));
    camera.quaternion.copy(quat);
    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = useSettingsStore.getState().fov * (isAiming.current ? 0.72 : 1);
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 10, dt);
      camera.updateProjectionMatrix();
    }
  });

  function selectItem(id: WeaponId | HealingItemId) {
    const isWeapon = id === "rifle" || id === "shotgun";
    if (isWeapon) switchFlashUntil.current = performance.now() + 160;
    usePlayerStore.getState().setLocal({ selected: id, ...(isWeapon ? { weapon: id as WeaponId } : {}) });
    if (usePlayerStore.getState().local.isHealing) cancelHeal();
  }

  function tryReload() {
    const local = usePlayerStore.getState().local;
    const weapon = WEAPONS[local.weapon];
    if (local.isReloading || local.ammoInMag >= weapon.magazineSize) return;
    usePlayerStore.getState().setLocal({ isReloading: true });
    reloadEndTime.current = performance.now() + weapon.reloadTime * 1000;
    soundManager.play("reload");
  }

  function fireLocalWeapon(weapon: (typeof WEAPONS)[WeaponId], origin: THREE.Vector3, forward: THREE.Vector3) {
    nextFireTime.current = performance.now() + 1000 / weapon.fireRate;
    fireFlashRef.current = performance.now();
    usePlayerStore.getState().setLocal({ ammoInMag: usePlayerStore.getState().local.ammoInMag - 1 });
    soundManager.play(weapon.id === "rifle" ? "rifleFire" : "shotgunFire", { volume: 1 });

    const { hits, tracerEnd } = fireWeapon(weapon, origin, forward, registry.all(), LOCAL_ID);
    const muzzle = origin.clone().addScaledVector(forward, 0.6);
    effectsBus.emit({
      kind: "tracer",
      from: [muzzle.x, muzzle.y, muzzle.z],
      to: [tracerEnd.x, tracerEnd.y, tracerEnd.z],
      color: "#ffe08a",
    });

    const groups = new Map<string, { entry: DamageableEntry; count: number; headshot: boolean; point: THREE.Vector3 }>();
    for (const h of hits) {
      const g = groups.get(h.entry.id);
      if (g) {
        g.count += 1;
        g.headshot = g.headshot || h.headshot;
      } else {
        groups.set(h.entry.id, { entry: h.entry, count: 1, headshot: h.headshot, point: h.point });
      }
    }

    let reportedHit: Parameters<GameAdapter["reportFire"]>[3] | undefined;
    for (const g of groups.values()) {
      if (g.entry.kind === "build") {
        const dmg = weapon.damage * g.count;
        g.entry.takeDamage(dmg, "local");
        effectsBus.emit({ kind: "impact", point: [g.point.x, g.point.y, g.point.z], color: "#8a94a8" });
        if (!reportedHit) reportedHit = { kind: "build", buildId: g.entry.id, pellets: g.count };
      } else {
        const dmg = computeDamage(weapon, g.headshot) * g.count;
        g.entry.takeDamage(dmg, "local");
        soundManager.play("hitConfirm");
        usePlayerStore.getState().triggerHitMarker();
        effectsBus.emit({ kind: "impact", point: [g.point.x, g.point.y, g.point.z], color: "#ff5555" });
        effectsBus.emit({ kind: "damageNumber", point: [g.point.x, g.point.y + 0.3, g.point.z], amount: dmg, headshot: g.headshot });
        reportedHit = { kind: "player", headshot: g.headshot, pellets: g.count };
      }
    }

    adapter.reportFire(weapon.id, [origin.x, origin.y, origin.z], [forward.x, forward.y, forward.z], reportedHit);
    recoilOffset.current += weapon.recoil;
  }

  function updateBuildGhost(bodyPos: Vec3, camPos: THREE.Vector3, forward: THREE.Vector3, kind: BuildKind) {
    const hit = castWorldRay(rapier, world, camPos, forward, BUILD_CONFIG.placeRange);
    if (!hit) {
      ghost.current.visible = false;
      return;
    }
    const opponentPos = adapter.getOpponentPosition();
    const playerPositions: Vec3[] = [bodyPos, ...(opponentPos ? [opponentPos] : [])];
    const activeCount = useBuildsStore.getState().builds.filter((b) => b.owner === "local").length;
    const result = validatePlacement(
      kind,
      [hit.point.x, hit.point.y, hit.point.z],
      ghost.current.rotationY,
      useBuildsStore.getState().builds,
      playerPositions,
      activeCount
    );
    ghost.current.visible = true;
    ghost.current.position = result.position;
    ghost.current.kind = kind;
    ghost.current.valid = result.valid;
  }

  function tryPlaceBuild(kind: BuildKind) {
    if (performance.now() < placementCooldownEnd.current) return;
    if (!ghost.current.visible || !ghost.current.valid) return;
    placementCooldownEnd.current = performance.now() + BUILD_CONFIG.placementCooldown * 1000;
    soundManager.play("buildPlace");
    adapter.requestBuildPlacement(kind, ghost.current.position, ghost.current.rotationY);
  }

  function handleHealing(local: HudState, holding: boolean) {
    const item = local.selected as HealingItemId;
    const cfg = HEALING[item];
    const atCap = item === "shieldPotion" ? local.shield >= 100 : local.health >= 100;
    const hasCharges = local.healingCounts[item] > 0;

    if (!local.isHealing) {
      if (holding && hasCharges && !atCap) {
        usePlayerStore.getState().setLocal({ isHealing: true, healProgress: 0 });
        healStartedItem.current = item;
        healEndTime.current = performance.now() + cfg.duration * 1000;
        soundManager.play(item === "shieldPotion" ? "potionUse" : "medkitUse");
        adapter.reportHeal(item, "start");
      }
      return;
    }

    if (!holding || healStartedItem.current !== item) {
      cancelHeal();
      return;
    }

    const remaining = healEndTime.current - performance.now();
    const progress = 1 - Math.max(0, remaining) / (cfg.duration * 1000);
    usePlayerStore.getState().setLocal({ healProgress: progress });

    if (remaining <= 0) completeHeal(item, cfg.restore);
  }

  function completeHeal(item: HealingItemId, restore: number) {
    const local = usePlayerStore.getState().local;
    const counts = { ...local.healingCounts, [item]: Math.max(0, local.healingCounts[item] - 1) };
    if (mode === "bot") {
      if (item === "shieldPotion") {
        usePlayerStore.getState().setLocal({ shield: Math.min(100, local.shield + restore), isHealing: false, healProgress: 0, healingCounts: counts });
      } else {
        usePlayerStore.getState().setLocal({ health: Math.min(100, local.health + restore), isHealing: false, healProgress: 0, healingCounts: counts });
      }
    } else {
      usePlayerStore.getState().setLocal({ isHealing: false, healProgress: 0, healingCounts: counts });
    }
    healStartedItem.current = null;
    adapter.reportHeal(item, "complete");
  }

  function cancelHeal() {
    if (!usePlayerStore.getState().local.isHealing) return;
    usePlayerStore.getState().setLocal({ isHealing: false, healProgress: 0 });
    if (healStartedItem.current) adapter.reportHeal(healStartedItem.current, "cancel");
    healStartedItem.current = null;
  }

  const bodyColor = "#3aa0c9";
  const accent = "#33e6ff";

  return (
    <group>
      <RigidBody ref={rigidBody} type="kinematicPosition" colliders={false} position={spawn.position} enabledRotations={[false, false, false]}>
        <CapsuleCollider args={[MOVEMENT.capsuleHalfHeight, MOVEMENT.capsuleRadius]} />
      </RigidBody>
      <group ref={group}>
        <mesh ref={hitboxMesh} visible={false} position={[0, MOVEMENT.capsuleHalfHeight + MOVEMENT.capsuleRadius, 0]}>
          <capsuleGeometry args={[MOVEMENT.capsuleRadius + 0.03, MOVEMENT.capsuleHalfHeight * 2, 4, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>
        <CharacterModel color={bodyColor} accent={accent} movingRef={movingRef} />
        <WeaponView
          weapon={weaponForView}
          fireFlashRef={fireFlashRef}
          reloading={isReloading}
          switchFlashUntilRef={switchFlashUntil}
          accent={accent}
        />
      </group>
      <BuildGhost stateRef={ghost} />
    </group>
  );
}
