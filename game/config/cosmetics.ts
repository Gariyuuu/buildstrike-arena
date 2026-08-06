import type { CharacterSkin } from "@/components/game/CharacterModel";

export type CosmeticCategory = "skin" | "backAccessory" | "pickaxe" | "weaponWrap" | "emote" | "banner" | "icon";
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface SkinDefinition {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  unlock: "default" | "shop" | "levelReward" | "dailyReward" | "achievement";
  skin: CharacterSkin;
}

/**
 * Starter skin pool. Only the default is granted to every profile; the rest
 * are built out with real names/rarities/looks here so the Locker/Shop have
 * real content to reference, but ownership-granting (shop purchases, level
 * rewards) is wired up in later phases — see TASKS.md.
 */
export const SKINS: Record<string, SkinDefinition> = {
  "skin-default": {
    id: "skin-default",
    name: "Recruit",
    rarity: "common",
    description: "Standard-issue Arena fatigues. Everyone starts here.",
    unlock: "default",
    skin: { jacketColor: "#3aa0c9", pantsColor: "#2a2f3a", shoeColor: "#15181f", accentColor: "#33e6ff", hasHair: true },
  },
  "skin-streetwear": {
    id: "skin-streetwear",
    name: "Street Runner",
    rarity: "uncommon",
    description: "Off-arena streetwear fighter, built for close-quarters swagger.",
    unlock: "shop",
    skin: { jacketColor: "#d84b4b", pantsColor: "#1c1c1c", shoeColor: "#f2f2f2", accentColor: "#ffd23f", hasHair: true },
  },
  "skin-tactical": {
    id: "skin-tactical",
    name: "Vanguard-9",
    rarity: "rare",
    description: "Futuristic tactical operative plated in reactive composite armor.",
    unlock: "shop",
    skin: { jacketColor: "#4a5568", pantsColor: "#2d3748", shoeColor: "#1a202c", accentColor: "#63f5ef", hasHair: false },
  },
  "skin-neon": {
    id: "skin-neon",
    name: "Neon Circuit",
    rarity: "epic",
    description: "A cyber-arena regular, wired with pulsing neon trim.",
    unlock: "shop",
    skin: { jacketColor: "#1a1a2e", pantsColor: "#16162a", shoeColor: "#0f0f1e", accentColor: "#ff2ec4", hasHair: true },
  },
  "skin-desert": {
    id: "skin-desert",
    name: "Dune Wanderer",
    rarity: "uncommon",
    description: "Desert explorer gear, sand-worn and sun-bleached.",
    unlock: "shop",
    skin: { jacketColor: "#c9a066", pantsColor: "#8a6d42", shoeColor: "#5c4527", accentColor: "#f4d35e", hasHair: true },
  },
  "skin-arctic": {
    id: "skin-arctic",
    name: "Frostline",
    rarity: "rare",
    description: "Arctic combat gear rated for the coldest arenas.",
    unlock: "shop",
    skin: { jacketColor: "#e8eef2", pantsColor: "#a9b8c4", shoeColor: "#5c6b78", accentColor: "#33e6ff", hasHair: true },
  },
  "skin-hoodie": {
    id: "skin-hoodie",
    name: "Casual Comp",
    rarity: "common",
    description: "Just a hoodie and a competitive streak.",
    unlock: "shop",
    skin: { jacketColor: "#5b4b8a", pantsColor: "#332a4d", shoeColor: "#211a33", accentColor: "#ff8a33", hasHair: true },
  },
  "skin-stealth": {
    id: "skin-stealth",
    name: "Nightfall",
    rarity: "epic",
    description: "A stealth operative built for silent, decisive duels.",
    unlock: "shop",
    skin: { jacketColor: "#14161c", pantsColor: "#0c0e12", shoeColor: "#08090b", accentColor: "#7dffb0", hasHair: false },
  },
  "skin-retro": {
    id: "skin-retro",
    name: "8-Bit Brawler",
    rarity: "legendary",
    description: "A retro arcade fighter rendered in bold, blocky color.",
    unlock: "shop",
    skin: { jacketColor: "#ff5757", pantsColor: "#3d5cff", shoeColor: "#ffe74c", accentColor: "#ffe74c", hasHair: true },
  },
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#9aa4b2",
  uncommon: "#33d17a",
  rare: "#33aaff",
  epic: "#b56bff",
  legendary: "#ffb020",
};

export const DEFAULT_SKIN_ID = "skin-default";
