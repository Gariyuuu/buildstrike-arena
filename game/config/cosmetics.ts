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
  "skin-ashfall": {
    id: "skin-ashfall",
    name: "Ashfall Ranger",
    rarity: "rare",
    description: "Salvaged post-collapse gear, scorched and battle-tested.",
    unlock: "shop",
    skin: { jacketColor: "#5a4638", pantsColor: "#3a2e24", shoeColor: "#1f1812", accentColor: "#ff5c33", hasHair: true },
  },
  "skin-solstice": {
    id: "skin-solstice",
    name: "Solstice Knight",
    rarity: "legendary",
    description: "Ceremonial champion's plate, gold-trimmed for the arena's best.",
    unlock: "shop",
    skin: { jacketColor: "#f2f0e6", pantsColor: "#cfc9a8", shoeColor: "#b8a856", accentColor: "#ffd23f", hasHair: false },
  },
  "skin-riptide": {
    id: "skin-riptide",
    name: "Riptide",
    rarity: "uncommon",
    description: "A wetsuit-sleek diver's kit built for cold, fast plays.",
    unlock: "shop",
    skin: { jacketColor: "#0e5c73", pantsColor: "#0a3d4d", shoeColor: "#062733", accentColor: "#33e6ff", hasHair: true },
  },
};

export interface WeaponWrapDefinition {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  bodyColor: string;
  barrelColor: string;
}

export const WEAPON_WRAPS: Record<string, WeaponWrapDefinition> = {
  "wrap-default": { id: "wrap-default", name: "Standard Issue", rarity: "common", description: "Factory finish.", bodyColor: "#1b1f27", barrelColor: "#0e1116" },
  "wrap-crimson": { id: "wrap-crimson", name: "Crimson Edge", rarity: "uncommon", description: "Deep red anodized finish.", bodyColor: "#5c1a1a", barrelColor: "#2b0d0d" },
  "wrap-arctic": { id: "wrap-arctic", name: "Arctic Camo", rarity: "uncommon", description: "Pale winter camouflage.", bodyColor: "#c7d2db", barrelColor: "#8fa2b0" },
  "wrap-goldplate": { id: "wrap-goldplate", name: "Gold Plate", rarity: "legendary", description: "Fully gold-plated, purely for show.", bodyColor: "#c9a227", barrelColor: "#8a6d1a" },
  "wrap-neonwire": { id: "wrap-neonwire", name: "Neon Wire", rarity: "epic", description: "Circuit-etched with glowing trim.", bodyColor: "#1a1a2e", barrelColor: "#0f0f1e" },
  "wrap-jungle": { id: "wrap-jungle", name: "Jungle Ops", rarity: "uncommon", description: "Dense green field camouflage.", bodyColor: "#2f4a2f", barrelColor: "#1c2e1c" },
  "wrap-carbon": { id: "wrap-carbon", name: "Carbon Fiber", rarity: "rare", description: "Woven carbon-fiber paneling.", bodyColor: "#232323", barrelColor: "#141414" },
  "wrap-sunset": { id: "wrap-sunset", name: "Sunset Fade", rarity: "rare", description: "A warm orange-to-purple gradient finish.", bodyColor: "#a8493f", barrelColor: "#5c3a6b" },
};
export const DEFAULT_WRAP_ID = "wrap-default";

export interface BackAccessoryDefinition {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  color: string;
  shape: "cape" | "pack" | "fin" | "wings" | "tank" | "shield";
}

export const BACK_ACCESSORIES: Record<string, BackAccessoryDefinition> = {
  "back-scoutpack": { id: "back-scoutpack", name: "Scout Pack", rarity: "common", description: "A lightweight field pack.", color: "#3a3f4a", shape: "pack" },
  "back-cape": { id: "back-cape", name: "Champion's Cape", rarity: "legendary", description: "Worn by the arena's finest.", color: "#c9a227", shape: "cape" },
  "back-finblade": { id: "back-finblade", name: "Fin Blade", rarity: "rare", description: "A stylized dorsal fin attachment.", color: "#33e6ff", shape: "fin" },
  "back-glidewings": { id: "back-glidewings", name: "Glide Wings", rarity: "epic", description: "Folded mechanical wings.", color: "#b56bff", shape: "wings" },
  "back-oxytank": { id: "back-oxytank", name: "Ox Tank", rarity: "uncommon", description: "A sealed pressure tank.", color: "#6b7280", shape: "tank" },
  "back-riotshield": { id: "back-riotshield", name: "Riot Plate", rarity: "rare", description: "A slung defensive plate.", color: "#ff8a33", shape: "shield" },
};

export interface EmoteDefinition {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
}

export const EMOTES: Record<string, EmoteDefinition> = {
  "emote-wave": { id: "emote-wave", name: "Wave", rarity: "common", description: "A friendly wave." },
  "emote-victory": { id: "emote-victory", name: "Victory Dance", rarity: "rare", description: "Celebrate the win." },
  "emote-sit": { id: "emote-sit", name: "Sit", rarity: "common", description: "Take a seat." },
  "emote-clap": { id: "emote-clap", name: "Clap", rarity: "uncommon", description: "Give it up." },
  "emote-point": { id: "emote-point", name: "Point", rarity: "common", description: "Call it out." },
  "emote-salute": { id: "emote-salute", name: "Salute", rarity: "uncommon", description: "Respect the opponent." },
  "emote-robot": { id: "emote-robot", name: "Robot Dance", rarity: "epic", description: "Original robot moves." },
  "emote-laugh": { id: "emote-laugh", name: "Laugh", rarity: "rare", description: "Can't help it." },
};

export interface BannerDefinition {
  id: string;
  name: string;
  rarity: Rarity;
  gradient: [string, string];
}

export const BANNERS: Record<string, BannerDefinition> = {
  "banner-default": { id: "banner-default", name: "Recruit Banner", rarity: "common", gradient: ["#1b2433", "#0a0e17"] },
  "banner-cyan": { id: "banner-cyan", name: "Cyan Surge", rarity: "uncommon", gradient: ["#33e6ff", "#0a4a5c"] },
  "banner-inferno": { id: "banner-inferno", name: "Inferno", rarity: "rare", gradient: ["#ff5c33", "#7a1a0d"] },
  "banner-violet": { id: "banner-violet", name: "Violet Pulse", rarity: "epic", gradient: ["#b56bff", "#3a1a5c"] },
  "banner-gold": { id: "banner-gold", name: "Champion Gold", rarity: "legendary", gradient: ["#ffd23f", "#7a5c0d"] },
  "banner-mint": { id: "banner-mint", name: "Mint Static", rarity: "uncommon", gradient: ["#7dffb0", "#0d5c3a"] },
};

export interface IconDefinition {
  id: string;
  name: string;
  rarity: Rarity;
  glyph: string;
}

export const ICONS: Record<string, IconDefinition> = {
  "icon-default": { id: "icon-default", name: "Recruit", rarity: "common", glyph: "◆" },
  "icon-target": { id: "icon-target", name: "Marksman", rarity: "uncommon", glyph: "◎" },
  "icon-bolt": { id: "icon-bolt", name: "Live Wire", rarity: "rare", glyph: "⚡" },
  "icon-skull": { id: "icon-skull", name: "No Mercy", rarity: "epic", glyph: "☠" },
  "icon-crown": { id: "icon-crown", name: "Champion", rarity: "legendary", glyph: "♛" },
  "icon-shield": { id: "icon-shield", name: "Fortified", rarity: "uncommon", glyph: "⛨" },
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#9aa4b2",
  uncommon: "#33d17a",
  rare: "#33aaff",
  epic: "#b56bff",
  legendary: "#ffb020",
};

export const DEFAULT_SKIN_ID = "skin-default";
