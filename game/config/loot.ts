import { WEAPON_ORDER, type WeaponId } from "@/game/config/weapons";
import type { HealingItemId } from "@/game/config/healing";

export type LootKind = "weapon" | "heal";

export interface LootDrop {
  kind: LootKind;
  weaponId?: WeaponId;
  healItem?: HealingItemId;
  label: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

// Loosely tiers the 12 firearms by power for loot-table weighting — purely a
// drop-rate concern, never touches the actual WEAPONS stats (equal-access
// principle still holds once you're holding it).
const WEAPON_RARITY: Record<WeaponId, LootDrop["rarity"]> = {
  pistol: "common",
  machinePistol: "common",
  smg: "uncommon",
  shotgun: "uncommon",
  rifle: "uncommon",
  tacticalShotgun: "rare",
  burstRifle: "rare",
  battleRifle: "rare",
  heavyPistol: "rare",
  lmg: "epic",
  revolver: "epic",
  marksmanRifle: "legendary",
  melee: "common", // never actually rolled — everyone always has the pickaxe
};

const RARITY_WEIGHT: Record<LootDrop["rarity"], number> = {
  common: 40,
  uncommon: 28,
  rare: 18,
  epic: 10,
  legendary: 4,
};

function weightedPick<T>(items: { item: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll = Math.random() * total;
  for (const { item, weight } of items) {
    roll -= weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1].item;
}

const LOOT_WEAPONS = WEAPON_ORDER.filter((id) => id !== "melee");

export function rollGroundLoot(): LootDrop {
  // 70% weapon, 30% heal item on the open ground.
  if (Math.random() < 0.3) {
    const healItem: HealingItemId = Math.random() < 0.6 ? "shieldPotion" : "medkit";
    return { kind: "heal", healItem, label: healItem === "shieldPotion" ? "Shield Potion" : "Medkit", rarity: "common" };
  }
  const weaponId = weightedPick(LOOT_WEAPONS.map((id) => ({ item: id, weight: RARITY_WEIGHT[WEAPON_RARITY[id]] })));
  return { kind: "weapon", weaponId, label: weaponId, rarity: WEAPON_RARITY[weaponId] };
}

/** Chests always give better odds than open ground and never whiff on a heal-only roll pair. */
export function rollChestLoot(): LootDrop[] {
  const drops: LootDrop[] = [];
  for (let i = 0; i < 2; i++) {
    const weaponId = weightedPick(
      LOOT_WEAPONS.map((id) => ({ item: id, weight: RARITY_WEIGHT[WEAPON_RARITY[id]] ** 1.4 }))
    );
    drops.push({ kind: "weapon", weaponId, label: weaponId, rarity: WEAPON_RARITY[weaponId] });
  }
  const healItem: HealingItemId = Math.random() < 0.5 ? "shieldPotion" : "medkit";
  drops.push({ kind: "heal", healItem, label: healItem === "shieldPotion" ? "Shield Potion" : "Medkit", rarity: "common" });
  return drops;
}
