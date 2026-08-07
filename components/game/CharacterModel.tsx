"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  ARM_POSES,
  LOCOMOTION_POSES,
  ANIM_DAMPING,
  ONE_SHOT_DURATIONS,
  type ArmPoseId,
  type LocomotionId,
} from "@/game/animation/pose";
import { EMOTE_POSES, type OscillationChannel } from "@/game/animation/emotes";
import type { BackAccessoryDefinition } from "@/game/config/cosmetics";

/** Full cosmetic material/color override — every field optional, falls back to the base color/accent. */
export interface CharacterSkin {
  jacketColor?: string;
  pantsColor?: string;
  shoeColor?: string;
  skinTone?: string;
  hairColor?: string;
  accentColor?: string;
  hasHair?: boolean;
}

const DEFAULT_SKIN_TONE = "#e7ddce";
const DEFAULT_HAIR = "#2a2118";

function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

/**
 * Original stylized low-poly character built entirely from primitive
 * geometry (no GLTF/skeletal assets, consistent with the rest of the
 * project). A small procedural "rig" of nested pivot groups stands in for
 * bones: each limb segment is parented to a pivot at its joint so rotating
 * the pivot bends the limb at the right place (shoulder/elbow, hip/knee).
 *
 * Animation is driven by damping current joint rotations toward per-state
 * pose targets (see game/animation/pose.ts) instead of snapping, so
 * transitions between e.g. idle <-> sprint <-> reload blend smoothly.
 */
export function CharacterModel({
  color,
  accent,
  movingRef,
  shadows = true,
  skin,
  backAccessory,
  groundedRef,
  velocityYRef,
  armPoseRef,
  fireReactRef,
  hitReactRef,
  emoteRef,
  eliminated = false,
  victory = false,
}: {
  color: string;
  accent: string;
  movingRef: React.RefObject<number>; // 0..1 movement speed fraction, read per-frame
  shadows?: boolean;
  skin?: CharacterSkin;
  backAccessory?: BackAccessoryDefinition | null;
  /** Per-frame refs driving the animation state machine — all optional, default to idle/grounded/no-weapon. */
  groundedRef?: React.RefObject<boolean>;
  velocityYRef?: React.RefObject<number>;
  armPoseRef?: React.RefObject<ArmPoseId>;
  fireReactRef?: React.RefObject<number>; // timestamp of last shot fired
  hitReactRef?: React.RefObject<number>; // timestamp of last damage taken
  /** Emote cosmetic id (see game/config/cosmetics.ts EMOTES) or null — while set, overrides the normal arm/locomotion blend with game/animation/emotes.ts's pose data. */
  emoteRef?: React.RefObject<string | null>;
  eliminated?: boolean;
  victory?: boolean;
}) {
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);

  // Joint pivot groups.
  const hips = useRef<THREE.Group>(null);
  const spine = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const leftHip = useRef<THREE.Group>(null);
  const rightHip = useRef<THREE.Group>(null);
  const leftKnee = useRef<THREE.Group>(null);
  const rightKnee = useRef<THREE.Group>(null);
  const leftShoulder = useRef<THREE.Group>(null);
  const rightShoulder = useRef<THREE.Group>(null);
  const leftElbow = useRef<THREE.Group>(null);
  const rightElbow = useRef<THREE.Group>(null);

  const phase = useRef(0);
  const cur = useRef({
    legAmp: 0,
    hipDrop: 0,
    spineLean: 0,
    kneeL: 0,
    kneeR: 0,
    shoulderXL: 0,
    shoulderXR: 0,
    shoulderZL: 0,
    shoulderZR: 0,
    elbowXL: 0,
    elbowXR: 0,
    headPitch: 0,
    collapse: 0,
  });

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const speed = movingRef.current ?? 0;
    const grounded = groundedRef?.current ?? true;
    const velY = velocityYRef?.current ?? 0;
    const armPoseId: ArmPoseId = armPoseRef?.current ?? "none";
    const now = performance.now();
    const c = cur.current;

    // ---- Determine locomotion state ----
    let locomotion: LocomotionId;
    if (!grounded) {
      locomotion = velY > 0.5 ? "jump" : "fall";
    } else if (speed > 0.7) {
      locomotion = "sprint";
    } else if (speed > 0.05) {
      locomotion = "walk";
    } else {
      locomotion = "idle";
    }
    const loco = LOCOMOTION_POSES[locomotion];
    const arm = ARM_POSES[armPoseId];

    // ---- One-shot reactive kicks (fire recoil / hit flinch), additive ----
    const firedAgo = fireReactRef ? now - (fireReactRef.current ?? -Infinity) : Infinity;
    const fireKick = firedAgo < ONE_SHOT_DURATIONS.fire ? 1 - firedAgo / ONE_SHOT_DURATIONS.fire : 0;
    const hitAgo = hitReactRef ? now - (hitReactRef.current ?? -Infinity) : Infinity;
    const hitKick = hitAgo < ONE_SHOT_DURATIONS.hit ? 1 - hitAgo / ONE_SHOT_DURATIONS.hit : 0;

    // ---- Blend toward targets ----
    const targetCollapse = eliminated ? 1 : 0;
    c.collapse = damp(c.collapse, targetCollapse, 6, dt);

    const emoteId = emoteRef?.current ?? null;
    const emotePose = emoteId ? EMOTE_POSES[emoteId] : null;

    if (emotePose) {
      const t = now / 1000;
      const osc = (channel: OscillationChannel) => {
        const o = emotePose.oscillations?.find((o) => o.channel === channel);
        if (!o) return 0;
        const raw = o.wave === "square" ? Math.sign(Math.sin(t * o.frequency * Math.PI * 2)) : Math.sin(t * o.frequency * Math.PI * 2);
        return raw * o.amplitude;
      };
      c.shoulderXL = damp(c.shoulderXL, emotePose.shoulderXL + osc("shoulderXL"), ANIM_DAMPING.arms, dt);
      c.shoulderXR = damp(c.shoulderXR, emotePose.shoulderXR + osc("shoulderXR"), ANIM_DAMPING.arms, dt);
      c.shoulderZL = damp(c.shoulderZL, emotePose.shoulderZL + osc("shoulderZL"), ANIM_DAMPING.arms, dt);
      c.shoulderZR = damp(c.shoulderZR, emotePose.shoulderZR + osc("shoulderZR"), ANIM_DAMPING.arms, dt);
      c.elbowXL = damp(c.elbowXL, emotePose.elbowXL + osc("elbowXL"), ANIM_DAMPING.arms, dt);
      c.elbowXR = damp(c.elbowXR, emotePose.elbowXR + osc("elbowXR"), ANIM_DAMPING.arms, dt);
      c.spineLean = damp(c.spineLean, emotePose.spineLean + osc("spineLean"), ANIM_DAMPING.spine, dt);
      c.hipDrop = damp(c.hipDrop, emotePose.hipDrop + osc("hipDrop"), ANIM_DAMPING.locomotion, dt);
      c.headPitch = damp(c.headPitch, emotePose.headPitch + osc("headPitch"), ANIM_DAMPING.headLook, dt);
      c.legAmp = damp(c.legAmp, 0, ANIM_DAMPING.locomotion, dt);
      c.kneeL = damp(c.kneeL, 0, ANIM_DAMPING.locomotion, dt);
      c.kneeR = damp(c.kneeR, 0, ANIM_DAMPING.locomotion, dt);
    } else if (victory) {
      c.shoulderXL = damp(c.shoulderXL, -2.6, ANIM_DAMPING.arms, dt);
      c.shoulderXR = damp(c.shoulderXR, -2.6, ANIM_DAMPING.arms, dt);
      c.shoulderZL = damp(c.shoulderZL, 0.3, ANIM_DAMPING.arms, dt);
      c.shoulderZR = damp(c.shoulderZR, 0.3, ANIM_DAMPING.arms, dt);
      c.elbowXL = damp(c.elbowXL, 0.2, ANIM_DAMPING.arms, dt);
      c.elbowXR = damp(c.elbowXR, 0.2, ANIM_DAMPING.arms, dt);
      c.spineLean = damp(c.spineLean, -0.08, ANIM_DAMPING.spine, dt);
    } else {
      // Subtle idle "breathing" sway — a perfectly frozen idle pose was part
      // of what read as stiff/robotic ("arm physics is off"). Only applied
      // at rest (no weapon actively raised, not moving) so it never
      // interferes with aim during combat.
      const breathe = armPoseId === "none" && speed < 0.05 && grounded ? Math.sin(now / 900) * 0.03 : 0;
      c.shoulderXL = damp(c.shoulderXL, arm.shoulderX[0] - hitKick * 0.3 + breathe, ANIM_DAMPING.arms, dt);
      c.shoulderXR = damp(c.shoulderXR, arm.shoulderX[1] - fireKick * 0.12 - hitKick * 0.3 + breathe, ANIM_DAMPING.arms, dt);
      c.shoulderZL = damp(c.shoulderZL, arm.shoulderZ[0], ANIM_DAMPING.arms, dt);
      c.shoulderZR = damp(c.shoulderZR, arm.shoulderZ[1], ANIM_DAMPING.arms, dt);
      c.elbowXL = damp(c.elbowXL, arm.elbowX[0], ANIM_DAMPING.arms, dt);
      c.elbowXR = damp(c.elbowXR, arm.elbowX[1] + fireKick * 0.2, ANIM_DAMPING.arms, dt);
      c.spineLean = damp(c.spineLean, loco.spineLean + arm.spineLean + hitKick * 0.35 + breathe * 0.5, ANIM_DAMPING.spine, dt);
    }

    if (!emotePose) {
      c.legAmp = damp(c.legAmp, loco.legAmplitude, ANIM_DAMPING.locomotion, dt);
      c.hipDrop = damp(c.hipDrop, loco.hipDrop, ANIM_DAMPING.locomotion, dt);
      c.kneeL = damp(c.kneeL, loco.kneeBend[0], ANIM_DAMPING.locomotion, dt);
      c.kneeR = damp(c.kneeR, loco.kneeBend[1], ANIM_DAMPING.locomotion, dt);
      c.headPitch = damp(c.headPitch, armPoseId === "build" || armPoseId === "reload" ? 0.18 : 0, ANIM_DAMPING.headLook, dt);
    }

    // ---- Leg walk cycle (procedural swing on top of the blended amplitude) ----
    phase.current += dt * (5 + speed * 5);
    const swing = Math.sin(phase.current) * 0.55 * c.legAmp;
    const kneeCycle = Math.max(0, Math.sin(phase.current + Math.PI / 2)) * 0.5 * c.legAmp;

    if (leftHip.current) leftHip.current.rotation.x = swing;
    if (rightHip.current) rightHip.current.rotation.x = -swing;
    if (leftKnee.current) leftKnee.current.rotation.x = c.kneeL + kneeCycle;
    if (rightKnee.current) rightKnee.current.rotation.x = c.kneeR + Math.max(0, -Math.sin(phase.current + Math.PI / 2)) * 0.5 * c.legAmp;

    if (leftShoulder.current) {
      leftShoulder.current.rotation.x = c.shoulderXL;
      leftShoulder.current.rotation.z = c.shoulderZL;
    }
    if (rightShoulder.current) {
      rightShoulder.current.rotation.x = c.shoulderXR;
      rightShoulder.current.rotation.z = -c.shoulderZR;
    }
    if (leftElbow.current) leftElbow.current.rotation.x = c.elbowXL;
    if (rightElbow.current) rightElbow.current.rotation.x = c.elbowXR;
    if (spine.current) spine.current.rotation.x = c.spineLean;
    if (head.current) head.current.rotation.x = c.headPitch;
    if (hips.current) {
      hips.current.position.y = 0.5 - c.hipDrop - c.collapse * 0.42;
      hips.current.rotation.x = c.collapse * -1.35;
      hips.current.rotation.z = c.collapse * 0.25;
    }
  });

  const jacketColor = skin?.jacketColor ?? color;
  const pantsColor = skin?.pantsColor ?? "#2a2f3a";
  const shoeColor = skin?.shoeColor ?? "#15181f";
  const skinTone = skin?.skinTone ?? DEFAULT_SKIN_TONE;
  const hairColor = skin?.hairColor ?? DEFAULT_HAIR;
  const accentColor = skin?.accentColor ?? accent;
  const hasHair = skin?.hasHair ?? true;

  const materials = useMemo(
    () => ({
      jacket: <meshStandardMaterial color={jacketColor} roughness={0.55} metalness={0.2} />,
      pants: <meshStandardMaterial color={pantsColor} roughness={0.7} />,
      shoe: <meshStandardMaterial color={shoeColor} roughness={0.5} metalness={0.15} />,
      skinMat: <meshStandardMaterial color={skinTone} roughness={0.75} />,
      hair: <meshStandardMaterial color={hairColor} roughness={0.6} />,
      accentMat: <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={1.1} />,
      visorFrame: <meshStandardMaterial color="#0a0c11" roughness={0.35} metalness={0.6} />,
      eyeGlow: <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={2.2} toneMapped={false} />,
    }),
    [jacketColor, pantsColor, shoeColor, skinTone, hairColor, accentColor]
  );

  return (
    <group ref={hips} position={[0, 0.5, 0]}>
      {/* Pelvis — slimmer than the original near-cube proportions (this
          whole rig read as too blocky/"Minecraft," not the leaner stylized
          look this game is going for). */}
      <mesh castShadow={shadows}>
        <boxGeometry args={[0.25, 0.16, 0.19]} />
        {materials.pants}
      </mesh>

      {/* Left leg: hip -> knee -> shoe */}
      <group ref={leftHip} position={[-0.1, -0.02, 0]}>
        <mesh ref={leftLeg} position={[0, -0.19, 0]} castShadow={shadows}>
          <capsuleGeometry args={[0.078, 0.3, 4, 6]} />
          {materials.pants}
        </mesh>
        <group ref={leftKnee} position={[0, -0.38, 0]}>
          <mesh position={[0, -0.16, 0.01]} castShadow={shadows}>
            <capsuleGeometry args={[0.066, 0.26, 4, 6]} />
            {materials.pants}
          </mesh>
          <mesh position={[0, -0.32, 0.05]} castShadow={shadows}>
            <boxGeometry args={[0.1, 0.08, 0.2]} />
            {materials.shoe}
          </mesh>
        </group>
      </group>

      {/* Right leg */}
      <group ref={rightHip} position={[0.1, -0.02, 0]}>
        <mesh ref={rightLeg} position={[0, -0.19, 0]} castShadow={shadows}>
          <capsuleGeometry args={[0.078, 0.3, 4, 6]} />
          {materials.pants}
        </mesh>
        <group ref={rightKnee} position={[0, -0.38, 0]}>
          <mesh position={[0, -0.16, 0.01]} castShadow={shadows}>
            <capsuleGeometry args={[0.066, 0.26, 4, 6]} />
            {materials.pants}
          </mesh>
          <mesh position={[0, -0.32, 0.05]} castShadow={shadows}>
            <boxGeometry args={[0.1, 0.08, 0.2]} />
            {materials.shoe}
          </mesh>
        </group>
      </group>

      {/* Spine -> chest, head, arms */}
      <group ref={spine} position={[0, 0.08, 0]}>
        <mesh position={[0, 0.26, 0]} castShadow={shadows}>
          <capsuleGeometry args={[0.148, 0.34, 4, 8]} />
          {materials.jacket}
        </mesh>
        {/* Chest accent stripe */}
        <mesh position={[0, 0.3, 0.17]}>
          <boxGeometry args={[0.21, 0.11, 0.03]} />
          {materials.accentMat}
        </mesh>

        {backAccessory && <BackAccessoryMesh def={backAccessory} shadows={shadows} />}

        {/* Neck — a short visible gap between torso and head instead of the
            head sitting directly on the shoulders, which was the single
            biggest thing making the silhouette read as blocky/voxel-ish. */}
        <mesh position={[0, 0.46, 0]} castShadow={shadows}>
          <cylinderGeometry args={[0.05, 0.06, 0.08, 8]} />
          {materials.skinMat}
        </mesh>

        {/* Head — a scaled sphere instead of a box. A cube head is exactly
            the "Steve"/Minecraft silhouette no amount of resizing fixes;
            swapping the base shape for a rounded one reads as an actual
            head instead of a block with a face painted on it. */}
        <group ref={head} position={[0, 0.55, 0]}>
          <mesh castShadow={shadows} scale={[0.95, 1.05, 0.92]}>
            <sphereGeometry args={[0.145, 16, 14]} />
            {materials.skinMat}
          </mesh>
          {/* Face: a dark tactical visor frame with two glowing eye slits
              (accent-colored, so every skin's face reads differently) instead
              of the old single flat accent bar, which looked like a blank
              plate rather than a face. Sits just proud of the head sphere's
              front curve, like a helmet visor. */}
          <mesh position={[0, 0.01, 0.135]}>
            <boxGeometry args={[0.19, 0.08, 0.02]} />
            {materials.visorFrame}
          </mesh>
          <mesh position={[-0.055, 0.012, 0.148]}>
            <boxGeometry args={[0.055, 0.032, 0.012]} />
            {materials.eyeGlow}
          </mesh>
          <mesh position={[0.055, 0.012, 0.148]}>
            <boxGeometry args={[0.055, 0.032, 0.012]} />
            {materials.eyeGlow}
          </mesh>
          {/* Jaw/chin shadow line for a touch more facial structure below the visor. */}
          <mesh position={[0, -0.075, 0.125]}>
            <boxGeometry args={[0.12, 0.016, 0.018]} />
            {materials.visorFrame}
          </mesh>
          {hasHair && (
            <mesh position={[0, 0.06, -0.01]} rotation={[0.1, 0, 0]} castShadow={shadows} scale={[1.02, 1, 1]}>
              <sphereGeometry args={[0.155, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
              {materials.hair}
            </mesh>
          )}
        </group>

        {/* Left arm: shoulder -> elbow -> hand */}
        <group ref={leftShoulder} position={[-0.185, 0.4, 0]}>
          <mesh position={[0, -0.14, 0]} castShadow={shadows}>
            <capsuleGeometry args={[0.058, 0.22, 4, 6]} />
            {materials.jacket}
          </mesh>
          <group ref={leftElbow} position={[0, -0.29, 0]}>
            <mesh position={[0, -0.12, 0]} castShadow={shadows}>
              <capsuleGeometry args={[0.05, 0.2, 4, 6]} />
              {materials.jacket}
            </mesh>
            <mesh position={[0, -0.24, 0]} castShadow={shadows}>
              <sphereGeometry args={[0.055, 8, 8]} />
              {materials.skinMat}
            </mesh>
          </group>
        </group>

        {/* Right arm (weapon-holding side) */}
        <group ref={rightShoulder} position={[0.185, 0.4, 0]}>
          <mesh position={[0, -0.14, 0]} castShadow={shadows}>
            <capsuleGeometry args={[0.058, 0.22, 4, 6]} />
            {materials.jacket}
          </mesh>
          <group ref={rightElbow} position={[0, -0.29, 0]}>
            <mesh position={[0, -0.12, 0]} castShadow={shadows}>
              <capsuleGeometry args={[0.05, 0.2, 4, 6]} />
              {materials.jacket}
            </mesh>
            <mesh position={[0, -0.24, 0]} castShadow={shadows}>
              <sphereGeometry args={[0.055, 8, 8]} />
              {materials.skinMat}
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

/** Renders one of the back-accessory cosmetic shapes, positioned on the character's back (negative Z, opposite the chest stripe). */
function BackAccessoryMesh({ def, shadows }: { def: BackAccessoryDefinition; shadows: boolean }) {
  const mat = <meshStandardMaterial color={def.color} roughness={0.5} metalness={0.3} />;
  switch (def.shape) {
    case "cape":
      return (
        <mesh position={[0, 0.1, -0.16]} rotation={[0.15, 0, 0]} castShadow={shadows}>
          <boxGeometry args={[0.32, 0.55, 0.02]} />
          {mat}
        </mesh>
      );
    case "pack":
      return (
        <mesh position={[0, 0.28, -0.18]} castShadow={shadows}>
          <boxGeometry args={[0.24, 0.28, 0.14]} />
          {mat}
        </mesh>
      );
    case "fin":
      return (
        <mesh position={[0, 0.4, -0.14]} rotation={[0, 0, 0]} castShadow={shadows}>
          <coneGeometry args={[0.1, 0.3, 4]} />
          {mat}
        </mesh>
      );
    case "wings":
      return (
        <group position={[0, 0.32, -0.16]}>
          <mesh position={[-0.2, 0, 0]} rotation={[0, 0, 0.3]} castShadow={shadows}>
            <boxGeometry args={[0.3, 0.06, 0.18]} />
            {mat}
          </mesh>
          <mesh position={[0.2, 0, 0]} rotation={[0, 0, -0.3]} castShadow={shadows}>
            <boxGeometry args={[0.3, 0.06, 0.18]} />
            {mat}
          </mesh>
        </group>
      );
    case "tank":
      return (
        <mesh position={[0, 0.3, -0.18]} castShadow={shadows}>
          <cylinderGeometry args={[0.09, 0.09, 0.4, 10]} />
          {mat}
        </mesh>
      );
    case "shield":
      return (
        <mesh position={[0, 0.24, -0.17]} castShadow={shadows}>
          <boxGeometry args={[0.26, 0.34, 0.05]} />
          {mat}
        </mesh>
      );
    default:
      return null;
  }
}
