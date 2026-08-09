"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CharacterModel } from "@/components/game/CharacterModel";
import { useInventoryStore } from "@/stores/inventoryStore";
import { usePlayerStore } from "@/stores/playerStore";
import { SKINS, BACK_ACCESSORIES, DEFAULT_SKIN_ID } from "@/game/config/cosmetics";

function IdleCharacter() {
  const equippedSkinId = useInventoryStore((s) => s.equipped.skin);
  const equippedBackId = useInventoryStore((s) => s.equipped.backAccessory);
  const skinDef = SKINS[equippedSkinId] ?? SKINS[DEFAULT_SKIN_ID];
  const backDef = equippedBackId ? BACK_ACCESSORIES[equippedBackId] : null;
  const movingRef = useRef(0);
  const emoteRef = useRef<string | null>(null);
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    emoteRef.current = usePlayerStore.getState().activeEmote;
    if (!group.current) return;
    if (emoteRef.current) {
      // Face the camera for the whole emote. Without this, the character
      // keeps whatever heading the idle sway last landed on — anywhere in a
      // +/-20 degree arc, including partly turned away from the camera —
      // which reads as the emote "facing backwards" instead of playing
      // toward the viewer like it does everywhere else in the game.
      group.current.rotation.y = 0;
    } else {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.35;
    }
  });

  return (
    <group ref={group}>
      <CharacterModel
        color={skinDef.skin.jacketColor ?? "#3aa0c9"}
        accent={skinDef.skin.accentColor ?? "#33e6ff"}
        movingRef={movingRef}
        emoteRef={emoteRef}
        skin={skinDef.skin}
        backAccessory={backDef}
        shadows={false}
      />
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
        </group>
      </Canvas>
    </div>
  );
}
