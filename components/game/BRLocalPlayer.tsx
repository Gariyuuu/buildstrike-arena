"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

import { MOVEMENT } from "@/game/config/movement";
import { WEAPONS, type WeaponId } from "@/game/config/weapons";
import { HEALING, type HealingItemId } from "@/game/config/healing";
import { useCharacterMover } from "@/game/physics/useCharacterMover";
import { useDamageableRegistry, type DamageableEntry } from "@/game/physics/damageable";
import { fireWeapon, computeDamage } from "@/game/weapons/hitscan";
import { effectsBus } from "@/game/effects/effectsBus";
import { soundManager } from "@/game/audio/soundManager";
import { usePointerLock } from "@/hooks/usePointerLock";
import { useKeyboard, drainJustPressed } from "@/hooks/useKeyboard";
import { useMouseButtons } from "@/hooks/useMouseButtons";
import { useKeybindsStore } from "@/stores/keybindsStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { SKINS, DEFAULT_SKIN_ID } from "@/game/config/cosmetics";
import { useBRStore } from "@/stores/brStore";
import { brPositions } from "@/game/br/positionRegistry";
import { lootRegistry, groundLootLookup } from "@/game/br/loot";
import { claimGroundLootEverywhere, applyLootToLocal } from "@/game/br/applyLoot";
import { computeZoneState, damagePerSecondFor, isOutsideZone } from "@/game/br/zone";
import { LOCAL_AGENT_ID } from "@/game/br/roster";
import { CharacterModel } from "@/components/game/CharacterModel";
import { weaponArmPose, type ArmPoseId } from "@/game/animation/pose";
import { WeaponView } from "@/components/game/WeaponView";
import type { ChestSpawn } from "@/game/br/loot";

const LOCAL_ID = LOCAL_AGENT_ID;
const UP = new THREE.Vector3(0, 1, 0);
const CHEST_RANGE = 2.5;

export function BRLocalPlayer({ domElement, spawn, chests }: { domElement: React.RefObject<HTMLElement | null>; spawn: [number, number, number]; chests: ChestSpawn[] }) {
  const { camera } = useThree();
  const move = useCharacterMover();
  const registry = useDamageableRegistry();

  const rigidBody = useRef<RapierRigidBody>(null);
  const group = useRef<THREE.Group>(null);
  const hitboxMesh = useRef<THREE.Mesh>(null);
  const movingRef = useRef(0);
  const fireFlashRef = useRef(0);
  const armPoseRef = useRef<ArmPoseId>("none");
  const hitReactRef = useRef(0);
  const noSwitchFlash = useRef(0);

  const yaw = useRef(0);
  const pitch = useRef(0);
  const smoothedLook = useRef({ x: 0, y: 0 });
  const velocityY = useRef(0);
  const grounded = useRef(false);
  const nextFireTime = useRef(0);
  const reloadEndTime = useRef(0);
  const healEndTime = useRef(0);
  const healStartedItem = useRef<HealingItemId | null>(null);
  const nextMeleeTime = useRef(0);

  const keyboard = useKeyboard(true);
  const mouse = useMouseButtons(domElement, true);
  const { locked, requestLock, consumeDelta } = usePointerLock(domElement);

  const skinId = useInventoryStore((s) => s.equipped.skin);
  const skin = SKINS[skinId] ?? SKINS[DEFAULT_SKIN_ID];

  useEffect(() => {
    if (rigidBody.current) rigidBody.current.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true);
    yaw.current = 0;
    pitch.current = 0;
    velocityY.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onClick = () => {
      if (locked) return;
      if (useBRStore.getState().phase !== "combat") return;
      soundManager.resume();
      requestLock();
    };
    const el = domElement.current;
    el?.addEventListener("click", onClick);
    return () => el?.removeEventListener("click", onClick);
  }, [domElement, locked, requestLock]);

  useEffect(() => {
    if (!hitboxMesh.current) return;
    const entry: DamageableEntry = {
      id: LOCAL_ID,
      kind: "player",
      side: "local",
      object: hitboxMesh.current,
      headY: spawn[1] + MOVEMENT.capsuleHalfHeight * 2 + MOVEMENT.capsuleRadius - 0.35,
      isAlive: () => !useBRStore.getState().isDead,
      takeDamage: (amount) => applyDamage(amount),
    };
    registry.register(entry);
    return () => registry.unregister(LOCAL_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyDamage(amount: number) {
    const s = useBRStore.getState();
    if (s.isDead) return;
    let remaining = amount;
    let shield = s.shield;
    if (shield > 0) {
      const absorbed = Math.min(shield, remaining);
      shield -= absorbed;
      remaining -= absorbed;
    }
    const health = Math.max(0, s.health - remaining);
    s.setLocal({ shield, health, isDead: health <= 0 });
    hitReactRef.current = performance.now();
    soundManager.play("takeDamage");
    if (health <= 0) {
      soundManager.play("elimination");
      useBRStore.getState().eliminateLocal();
    }
  }

  function tryReload() {
    const s = useBRStore.getState();
    const wId = s.slots[s.selectedSlot].weapon;
    if (!wId || s.isReloading) return;
    const weapon = WEAPONS[wId];
    if (s.slots[s.selectedSlot].ammoInMag >= weapon.magazineSize) return;
    s.setLocal({ isReloading: true });
    reloadEndTime.current = performance.now() + weapon.reloadTime * 1000;
    soundManager.play("reload");
  }

  function fireLocal(weapon: (typeof WEAPONS)[WeaponId], origin: THREE.Vector3, forward: THREE.Vector3) {
    nextFireTime.current = performance.now() + 1000 / weapon.fireRate;
    fireFlashRef.current = performance.now();
    const fireSound = weapon.soundProfile === "shotgun" ? "shotgunFire" : weapon.soundProfile === "pistol" ? "pistolFire" : "rifleFire";
    soundManager.play(fireSound, { volume: 0.6 });

    const { hits, tracerEnd } = fireWeapon(weapon, origin, forward, registry.all(), LOCAL_ID);
    effectsBus.emit({ kind: "tracer", from: [origin.x, origin.y, origin.z], to: [tracerEnd.x, tracerEnd.y, tracerEnd.z], color: "#ffb27a" });

    for (const h of hits) {
      if (h.entry.id === LOCAL_ID) continue;
      const dmg = computeDamage(weapon, h.headshot);
      h.entry.takeDamage(dmg, "local");
      effectsBus.emit({ kind: "impact", point: [h.point.x, h.point.y, h.point.z], color: "#ff5555" });
      effectsBus.emit({ kind: "damageNumber", point: [h.point.x, h.point.y + 0.3, h.point.z], amount: dmg, headshot: h.headshot });
    }
  }

  function performMelee(origin: THREE.Vector3, forward: THREE.Vector3) {
    const now = performance.now();
    if (now < nextMeleeTime.current) return;
    nextMeleeTime.current = now + 1000 / WEAPONS.melee.fireRate;
    soundManager.play("meleeSwing", { volume: 0.6 });
    const { hits } = fireWeapon(WEAPONS.melee, origin, forward, registry.all(), LOCAL_ID);
    for (const h of hits) {
      if (h.entry.id === LOCAL_ID) continue;
      h.entry.takeDamage(computeDamage(WEAPONS.melee, h.headshot), "local");
      soundManager.play("meleeHit", { volume: 0.5 });
    }
  }

  useFrame((_, rawDt) => {
    if (!rigidBody.current) return;
    const dt = Math.min(rawDt, 1 / 20);
    const s = useBRStore.getState();

    const bodyPos = rigidBody.current.translation();

    // ---- Zone damage tick (applies even if dead-locked out of combat phase, guarded below) ----
    if (s.phase === "combat" && s.matchStartedAt && !s.isDead) {
      const elapsed = (performance.now() - s.matchStartedAt) / 1000;
      const zone = computeZoneState(elapsed);
      if (isOutsideZone(bodyPos.x, bodyPos.z, zone.radius)) {
        applyDamage(damagePerSecondFor(zone.phaseIndex) * dt);
      }
    }

    brPositions.set(LOCAL_ID, bodyPos.x, bodyPos.y, bodyPos.z, 0, !s.isDead);

    if (s.phase !== "combat" || s.isDead) {
      move(rigidBody.current, new THREE.Vector3(0, MOVEMENT.gravity * dt * dt, 0));
      return;
    }

    // ---- Look ----
    if (locked) {
      const delta = consumeDelta();
      // Same frame-rate-independent smoothing as the 1v1 LocalPlayer (see
      // its comment) — raw per-frame pointer-lock deltas are jittery on
      // their own. Also fixed here: this previously subtracted delta.x from
      // yaw while the 1v1 controller adds it, with an identical forward-
      // vector formula below — same physical mouse movement turned the
      // camera in opposite directions between modes.
      const smoothing = 1 - Math.pow(2, -dt / 0.028);
      smoothedLook.current.x += (delta.x - smoothedLook.current.x) * smoothing;
      smoothedLook.current.y += (delta.y - smoothedLook.current.y) * smoothing;
      const sens = useSettingsStore.getState().mouseSensitivity * 0.0022;
      yaw.current += smoothedLook.current.x * sens;
      pitch.current = THREE.MathUtils.clamp(pitch.current - smoothedLook.current.y * sens, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
    }
    const euler = new THREE.Euler(pitch.current, yaw.current, 0, "YXZ");
    const quat = new THREE.Quaternion().setFromEuler(euler);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
    const forwardFlat = new THREE.Vector3(forward.x, 0, forward.z).normalize();
    const right = new THREE.Vector3().crossVectors(forward, UP).normalize();
    camera.position.set(bodyPos.x, bodyPos.y + MOVEMENT.eyeHeight, bodyPos.z);
    camera.quaternion.copy(quat);

    const justPressed = drainJustPressed(keyboard);
    const binds = useKeybindsStore.getState().binds;

    // ---- Slot / heal selection ----
    if (justPressed.includes("1")) s.setLocal({ selectedSlot: 0 });
    if (justPressed.includes("2")) s.setLocal({ selectedSlot: 1 });
    if (justPressed.includes("3")) s.setLocal({ selectedHeal: "shieldPotion" });
    if (justPressed.includes("4")) s.setLocal({ selectedHeal: "medkit" });

    // ---- Reload / melee / interact ----
    if (justPressed.includes(binds.reload)) tryReload();
    if (justPressed.includes(binds.melee)) performMelee(camera.position as THREE.Vector3, forward);
    if (justPressed.includes(binds.interact)) {
      const nearestChest = chests
        .filter((c) => !s.claimedLootIds.includes(c.id))
        .map((c) => ({ c, dist: Math.hypot(c.position[0] - bodyPos.x, c.position[2] - bodyPos.z) }))
        .sort((a, b) => a.dist - b.dist)[0];
      if (nearestChest && nearestChest.dist < CHEST_RANGE) {
        useBRStore.getState().claimLoot(nearestChest.c.id);
        for (const drop of nearestChest.c.drops) applyLootToLocal(drop);
        soundManager.play("purchase", { volume: 0.6 });
      }
    }

    // ---- Movement ----
    const inputZ = (keyboard.current.pressed.has("w") ? 1 : 0) - (keyboard.current.pressed.has("s") ? 1 : 0);
    const inputX = (keyboard.current.pressed.has("d") ? 1 : 0) - (keyboard.current.pressed.has("a") ? 1 : 0);
    const sprinting = keyboard.current.pressed.has(binds.sprint) && inputZ > 0;
    const moveDir = new THREE.Vector3().addScaledVector(right, inputX).addScaledVector(forwardFlat, inputZ);
    if (moveDir.lengthSq() > 0) moveDir.normalize();
    const speed = MOVEMENT.walkSpeed * (sprinting ? MOVEMENT.sprintMultiplier : 1);
    const control = grounded.current ? 1 : MOVEMENT.airControl;
    movingRef.current = moveDir.length() * (sprinting ? 1 : 0.72);

    if (grounded.current && justPressed.includes(binds.jump)) {
      velocityY.current = MOVEMENT.jumpVelocity;
      soundManager.play("jump");
    } else if (grounded.current) {
      velocityY.current = -1;
    } else {
      velocityY.current = Math.max(MOVEMENT.maxFallSpeed, velocityY.current + MOVEMENT.gravity * dt);
    }

    const desired = new THREE.Vector3(moveDir.x * speed * control * dt, velocityY.current * dt, moveDir.z * speed * control * dt);
    const result = move(rigidBody.current, desired);
    grounded.current = result.grounded;
    if (group.current) {
      group.current.position.copy(result.position);
      group.current.rotation.y = yaw.current;
    }

    // ---- Healing ----
    if (s.selectedHeal && mouse.current.left) {
      const item = s.selectedHeal;
      const cfg = HEALING[item];
      const atCap = item === "shieldPotion" ? s.shield >= 100 : s.health >= 100;
      const hasCharges = s.healingCounts[item] > 0;
      if (!s.isHealing && hasCharges && !atCap) {
        s.setLocal({ isHealing: true, healProgress: 0 });
        healStartedItem.current = item;
        healEndTime.current = performance.now() + cfg.duration * 1000;
        soundManager.play(item === "shieldPotion" ? "potionUse" : "medkitUse");
      }
    } else if (s.isHealing && (!mouse.current.left || healStartedItem.current !== s.selectedHeal)) {
      s.setLocal({ isHealing: false, healProgress: 0 });
      healStartedItem.current = null;
    }
    if (s.isHealing && healStartedItem.current) {
      const item = healStartedItem.current;
      const cfg = HEALING[item];
      const remaining = healEndTime.current - performance.now();
      s.setLocal({ healProgress: 1 - Math.max(0, remaining) / (cfg.duration * 1000) });
      if (remaining <= 0) {
        useBRStore.getState().consumeHealCharge(item);
        if (item === "shieldPotion") s.setLocal({ shield: Math.min(100, s.shield + cfg.restore) });
        else s.setLocal({ health: Math.min(100, s.health + cfg.restore) });
        s.setLocal({ isHealing: false, healProgress: 0 });
        healStartedItem.current = null;
      }
    }

    // ---- Auto pickup (ground loot only — walk over it) ----
    const nearestLoot = lootRegistry.nearest(bodyPos.x, bodyPos.z, false);
    if (nearestLoot && nearestLoot.distance < 1.4) {
      const drop = groundLootLookup.get(nearestLoot.id);
      if (drop) {
        claimGroundLootEverywhere(nearestLoot.id);
        applyLootToLocal(drop);
        soundManager.play("coinGain", { volume: 0.4 });
      }
    }

    // ---- Shooting ----
    const wId = s.slots[s.selectedSlot].weapon;
    armPoseRef.current = s.isHealing ? (s.selectedHeal === "shieldPotion" ? "shield" : "heal") : wId ? weaponArmPose(wId) : "none";
    if (wId && !s.isHealing && !s.isReloading) {
      const weapon = WEAPONS[wId];
      // v1 simplification: every weapon fires on hold at its own fireRate cap
      // (the 1v1 mode's stricter click-per-shot semi-auto gating isn't
      // replicated here) — harmless, just slightly more forgiving for
      // nominally semi-auto weapons.
      const firing = mouse.current.left;
      if (firing && performance.now() >= nextFireTime.current && s.slots[s.selectedSlot].ammoInMag > 0) {
        fireLocal(weapon, camera.position as THREE.Vector3, forward);
        const slots = [...s.slots] as [typeof s.slots[0], typeof s.slots[0]];
        slots[s.selectedSlot] = { ...slots[s.selectedSlot], ammoInMag: slots[s.selectedSlot].ammoInMag - 1 };
        useBRStore.setState({ slots });
      } else if (firing && s.slots[s.selectedSlot].ammoInMag <= 0 && performance.now() >= nextFireTime.current) {
        nextFireTime.current = performance.now() + 300;
        tryReload();
      }
    }
    if (s.isReloading && performance.now() >= reloadEndTime.current) {
      const slots = [...s.slots] as [typeof s.slots[0], typeof s.slots[0]];
      const wid = slots[s.selectedSlot].weapon;
      if (wid) slots[s.selectedSlot] = { weapon: wid, ammoInMag: WEAPONS[wid].magazineSize };
      useBRStore.setState({ slots });
      s.setLocal({ isReloading: false });
    }
  });

  const currentWeapon = useBRStore((st) => st.slots[st.selectedSlot].weapon);
  const isDead = useBRStore((st) => st.isDead);

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
        <CharacterModel color="#3aa0c9" accent="#33e6ff" skin={skin.skin} movingRef={movingRef} groundedRef={grounded} velocityYRef={velocityY} armPoseRef={armPoseRef} fireReactRef={fireFlashRef} hitReactRef={hitReactRef} eliminated={isDead} />
        {currentWeapon && <WeaponView weapon={currentWeapon} fireFlashRef={fireFlashRef} reloading={false} switchFlashUntilRef={noSwitchFlash} accent="#33e6ff" />}
      </group>
    </group>
  );
}
