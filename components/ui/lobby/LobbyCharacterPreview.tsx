"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CharacterModel } from "@/components/game/CharacterModel";
import { useInventoryStore } from "@/stores/inventoryStore";
import { SKINS, DEFAULT_SKIN_ID } from "@/game/config/cosmetics";

function IdleCharacter() {
  const equippedSkinId = useInventoryStore((s) => s.equipped.skin);
  const skinDef = SKINS[equippedSkinId] ?? SKINS[DEFAULT_SKIN_ID];
  const movingRef = useRef(0);
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.35;
  });

  return (
    <group ref={group}>
      <CharacterModel color={skinDef.skin.jacketColor ?? "#3aa0c9"} accent={skinDef.skin.accentColor ?? "#33e6ff"} movingRef={movingRef} skin={skinDef.skin} shadows={false} />
    </group>
  );
}

function Platform() {
  return (
    <group position={[0, -0.35, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.08, 48]} />
        <meshStandardMaterial color="#111826" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
        <ringGeometry args={[0.85, 1.0, 48]} />
        <meshBasicMaterial color="#33e6ff" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

/** Small, self-contained R3F canvas used across the lobby for the equipped-character preview — no physics, no game state, just idle animation. */
export function LobbyCharacterPreview({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        camera={{ fov: 32, position: [0, 1.05, 3.4] }}
        onCreated={({ scene }) => {
          scene.background = null;
        }}
      >
        <ambientLight intensity={0.7} color="#8fb8ff" />
        <directionalLight position={[3, 4, 3]} intensity={1.3} color="#fff2e0" />
        <pointLight position={[-2, 1.5, -1]} intensity={0.6} color="#33e6ff" />
        <group position={[0, -0.5, 0]}>
          <IdleCharacter />
          <Platform />
        </group>
      </Canvas>
    </div>
  );
}
