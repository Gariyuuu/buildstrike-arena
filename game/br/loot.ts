import { nanoid } from "nanoid";
import { BR_CONFIG, BR_MAP_RADIUS } from "@/game/config/battleRoyale";
import { rollGroundLoot, rollChestLoot, type LootDrop } from "@/game/config/loot";

export interface GroundLootSpawn {
  id: string;
  position: [number, number, number];
  drop: LootDrop;
}

export interface ChestSpawn {
  id: string;
  position: [number, number, number];
  drops: LootDrop[];
}

function randomPointInPlayArea(): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random()) * BR_MAP_RADIUS * 0.85;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

export function generateGroundLoot(): GroundLootSpawn[] {
  const spawns: GroundLootSpawn[] = [];
  for (let i = 0; i < BR_CONFIG.groundLootCount; i++) {
    const [x, z] = randomPointInPlayArea();
    spawns.push({ id: nanoid(8), position: [x, 0.5, z], drop: rollGroundLoot() });
  }
  return spawns;
}

export function generateChests(): ChestSpawn[] {
  const spawns: ChestSpawn[] = [];
  for (let i = 0; i < BR_CONFIG.chestCount; i++) {
    const [x, z] = randomPointInPlayArea();
    spawns.push({ id: nanoid(8), position: [x, 0.6, z], drops: rollChestLoot() });
  }
  return spawns;
}

/** Plain mutable registry (not a Zustand store) of unclaimed ground-loot
 * positions — read every frame by bot brains to find the nearest pickup
 * without subscribing to reactive state. Populated once per match by
 * BattleRoyaleScene, mutated as items get claimed. */
class LootPositionRegistry {
  private items = new Map<string, { x: number; z: number; weaponOnly: boolean }>();

  seed(spawns: GroundLootSpawn[]) {
    this.items.clear();
    for (const s of spawns) {
      this.items.set(s.id, { x: s.position[0], z: s.position[2], weaponOnly: s.drop.kind === "weapon" });
    }
  }

  remove(id: string) {
    this.items.delete(id);
  }

  nearest(x: number, z: number, weaponOnly: boolean): { id: string; x: number; z: number; distance: number } | null {
    let best: { id: string; x: number; z: number; distance: number } | null = null;
    for (const [id, p] of this.items) {
      if (weaponOnly && !p.weaponOnly) continue;
      const dx = p.x - x;
      const dz = p.z - z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (!best || distance < best.distance) best = { id, x: p.x, z: p.z, distance };
    }
    return best;
  }
}

export const lootRegistry = new LootPositionRegistry();

/** id -> drop lookup for ground loot, seeded once per match by
 * BattleRoyaleScene — read by both BRLocalPlayer and BRAgent when a pickup
 * fires so they know what they actually picked up. */
export const groundLootLookup = new Map<string, LootDrop>();
