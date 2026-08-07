"use client";

import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";
import { Arena } from "@/components/game/Arena";
import { EffectsLayer } from "@/components/game/EffectsLayer";
import { BuildInstance } from "@/components/game/BuildInstance";
import { BotDuelScene } from "@/components/game/BotDuelScene";
import { OnlineDuelScene } from "@/components/game/OnlineDuelScene";
import { TrainingArenaScene } from "@/components/game/TrainingArenaScene";
import { BattleRoyaleScene } from "@/components/game/BattleRoyaleScene";
import { DamageableProvider } from "@/game/physics/damageable";
import { useBuildsStore } from "@/stores/buildsStore";
import { useGameStore } from "@/stores/gameStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { HUD } from "@/components/ui/HUD";

const DPR_BY_QUALITY: Record<string, [number, number]> = {
  low: [0.75, 1],
  medium: [1, 1.5],
  high: [1, 2],
};

export function GameCanvas() {
  const mode = useGameStore((s) => s.mode);
  const shadowsEnabled = useSettingsStore((s) => s.shadowsEnabled);
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality);
  const fov = useSettingsStore((s) => s.fov);
  const domRef = useRef<HTMLDivElement>(null);
  const builds = useBuildsStore((s) => s.builds);

  return (
    <div ref={domRef} className="relative h-full w-full select-none">
      <Canvas
        shadows={shadowsEnabled}
        dpr={DPR_BY_QUALITY[graphicsQuality] ?? DPR_BY_QUALITY.medium}
        gl={{ antialias: graphicsQuality !== "low", powerPreference: "high-performance" }}
        camera={{ fov, near: 0.1, far: 500, position: [0, 2, 10] }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color("#0a0e17");
        }}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -18, 0]} timeStep="vary">
            <DamageableProvider>
              {mode === "battleRoyale" ? (
                <BattleRoyaleScene domElement={domRef} shadows={shadowsEnabled} />
              ) : (
                <>
                  <Arena shadows={shadowsEnabled} />
                  {builds.map((b) => (
                    <BuildInstance key={b.id} build={b} mode={mode === "online" ? "online" : "bot"} />
                  ))}
                  {mode === "bot" && <BotDuelScene domElement={domRef} />}
                  {mode === "online" && <OnlineDuelScene domElement={domRef} />}
                  {mode === "training" && <TrainingArenaScene domElement={domRef} />}
                </>
              )}
            </DamageableProvider>
          </Physics>
          <EffectsLayer quality={graphicsQuality as "low" | "medium" | "high"} />
        </Suspense>
      </Canvas>
      <HUD domElement={domRef} />
    </div>
  );
}
