"use client";

import { useEffect, useMemo } from "react";
import { useBRStore } from "@/stores/brStore";
import { generateGroundLoot, generateChests, lootRegistry, groundLootLookup } from "@/game/br/loot";
import { BRMap1 } from "@/components/game/BRMap1";
import { BRMap2 } from "@/components/game/BRMap2";
import { BRMap3 } from "@/components/game/BRMap3";
import { BRZone } from "@/components/game/BRZone";
import { BRLoot } from "@/components/game/BRLoot";
import { BRLocalPlayer } from "@/components/game/BRLocalPlayer";
import { BRAgent } from "@/components/game/BRAgent";

function spawnFor(angle: number, radius: number): [number, number, number] {
  return [Math.cos(angle) * radius, 1.1, Math.sin(angle) * radius];
}

export function BattleRoyaleScene({ domElement }: { domElement: React.RefObject<HTMLDivElement | null> }) {
  // Shadows are hard-disabled for BR regardless of the Settings toggle — up
  // to 20 characters plus 30-50 map structures shadow-casting (the 1v1 arena
  // only ever has 2 characters and a handful of structures) was a major,
  // predictable frame-rate cost, and previously wasn't even controllable:
  // BRAgent/BRLocalPlayer never threaded the shadows prop into CharacterModel
  // at all, so characters cast shadows unconditionally even with the setting
  // off. Trading shadow fidelity for guaranteed smoother BR matches.
  const shadows = false;
  const phase = useBRStore((s) => s.phase);
  const agents = useBRStore((s) => s.agents);
  const resetSignal = useBRStore((s) => s.resetSignal);
  const mapId = useBRStore((s) => s.mapId);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- resetSignal deliberately forces regeneration on redeploy even though the generator functions take no args
  const groundLoot = useMemo(() => generateGroundLoot(), [resetSignal]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const chests = useMemo(() => generateChests(), [resetSignal]);

  useEffect(() => {
    lootRegistry.seed(groundLoot);
    groundLootLookup.clear();
    for (const item of groundLoot) groundLootLookup.set(item.id, item.drop);
  }, [groundLoot]);

  useEffect(() => {
    if (phase === "deploying" && agents.length > 0) {
      const t = setTimeout(() => useBRStore.getState().beginCombat(), 3000);
      return () => clearTimeout(t);
    }
  }, [phase, agents.length]);

  if (agents.length === 0) return null;

  const local = agents[0];
  const bots = agents.slice(1);

  return (
    <group>
      {mapId === "desert" ? <BRMap2 shadows={shadows} /> : mapId === "neonDistrict" ? <BRMap3 shadows={shadows} /> : <BRMap1 shadows={shadows} />}
      <BRZone />
      <BRLoot groundLoot={groundLoot} chests={chests} />
      <BRLocalPlayer domElement={domElement} spawn={spawnFor(local.spawnAngle, local.spawnRadius)} chests={chests} shadows={shadows} />
      {bots.map((b) => (
        <BRAgent key={b.id} agent={b} spawn={spawnFor(b.spawnAngle, b.spawnRadius)} shadows={shadows} />
      ))}
    </group>
  );
}
