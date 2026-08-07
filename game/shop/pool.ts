import { SKINS, WEAPON_WRAPS, BACK_ACCESSORIES, EMOTES, PICKAXES, DEFAULT_WRAP_ID, DEFAULT_PICKAXE_ID, type Rarity, type CosmeticCategory } from "@/game/config/cosmetics";

export interface ShopItem {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  category: Extract<CosmeticCategory, "skin" | "weaponWrap" | "backAccessory" | "emote" | "pickaxe">;
  previewColor: string;
}

const RARITY_PRICE: Record<Rarity, number> = {
  common: 300,
  uncommon: 500,
  rare: 800,
  epic: 1200,
  legendary: 2000,
};

export function priceFor(item: ShopItem): number {
  return RARITY_PRICE[item.rarity];
}

/** Every purchasable cosmetic across all shop-eligible categories, normalized to one shape for the Shop UI. */
export function fullShopPool(): ShopItem[] {
  const items: ShopItem[] = [];
  for (const s of Object.values(SKINS)) {
    if (s.unlock !== "shop") continue;
    items.push({ id: s.id, name: s.name, rarity: s.rarity, description: s.description, category: "skin", previewColor: s.skin.jacketColor ?? "#3aa0c9" });
  }
  for (const w of Object.values(WEAPON_WRAPS)) {
    if (w.id === DEFAULT_WRAP_ID) continue;
    items.push({ id: w.id, name: w.name, rarity: w.rarity, description: w.description, category: "weaponWrap", previewColor: w.bodyColor });
  }
  for (const b of Object.values(BACK_ACCESSORIES)) {
    items.push({ id: b.id, name: b.name, rarity: b.rarity, description: b.description, category: "backAccessory", previewColor: b.color });
  }
  for (const e of Object.values(EMOTES)) {
    items.push({ id: e.id, name: e.name, rarity: e.rarity, description: e.description, category: "emote", previewColor: "#33e6ff" });
  }
  for (const p of Object.values(PICKAXES)) {
    if (p.id === DEFAULT_PICKAXE_ID) continue;
    items.push({ id: p.id, name: p.name, rarity: p.rarity, description: p.description, category: "pickaxe", previewColor: p.headColor });
  }
  return items;
}
