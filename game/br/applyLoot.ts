import type { LootDrop } from "@/game/config/loot";
import { WEAPONS } from "@/game/config/weapons";
import { useBRStore } from "@/stores/brStore";
import { lootRegistry } from "@/game/br/loot";

export function claimGroundLootEverywhere(id: string) {
  lootRegistry.remove(id);
  useBRStore.getState().claimLoot(id);
}

/** Applies a loot drop to the LOCAL player's brStore. Weapon drops fill the
 * first empty slot, or replace whichever slot is currently selected once
 * both are full — no drop-choice UI in v1, matching the walk-over/auto-loot
 * feel of the ground pickups. */
export function applyLootToLocal(drop: LootDrop) {
  const s = useBRStore.getState();
  if (drop.kind === "weapon" && drop.weaponId) {
    const emptyIndex = s.slots.findIndex((sl) => sl.weapon === null);
    const targetIndex = (emptyIndex !== -1 ? emptyIndex : s.selectedSlot) as 0 | 1;
    s.setSlot(targetIndex, { weapon: drop.weaponId, ammoInMag: WEAPONS[drop.weaponId].magazineSize });
    if (emptyIndex !== -1) s.setLocal({ selectedSlot: targetIndex });
  } else if (drop.kind === "heal" && drop.healItem) {
    s.addHealCharge(drop.healItem, 1);
  }
}
