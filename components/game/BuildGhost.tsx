"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BUILD_TYPES, type BuildKind } from "@/game/config/builds";

export interface BuildGhostState {
  visible: boolean;
  position: [number, number, number];
  rotationY: number;
  kind: BuildKind;
  valid: boolean;
}

const VALID_COLOR = new THREE.Color("#33e6ff");
const INVALID_COLOR = new THREE.Color("#ff4d4d");

export function BuildGhost({ stateRef }: { stateRef: React.RefObject<BuildGhostState> }) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const lastKind = useRef<BuildKind>("wall");

  useFrame(() => {
    const s = stateRef.current;
    if (!group.current || !mesh.current) return;
    group.current.visible = s.visible;
    if (!s.visible) return;

    group.current.position.set(...s.position);
    group.current.rotation.set(0, s.rotationY, 0);

    if (s.kind !== lastKind.current) {
      lastKind.current = s.kind;
      const cfg = BUILD_TYPES[s.kind];
      mesh.current.geometry.dispose();
      mesh.current.geometry = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
    }

    const mat = mesh.current.material as THREE.MeshBasicMaterial;
    mat.color.copy(s.valid ? VALID_COLOR : INVALID_COLOR);
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={mesh}>
        <boxGeometry args={[BUILD_TYPES.wall.width, BUILD_TYPES.wall.height, BUILD_TYPES.wall.depth]} />
        <meshBasicMaterial color={VALID_COLOR} transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}
