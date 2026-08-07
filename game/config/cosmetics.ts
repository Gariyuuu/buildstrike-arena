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
  "skin-crimsonop": {
    id: "skin-crimsonop",
    name: "Crimson Op",
    rarity: "rare",
    description: "Blacked-out kit with a single bold red stripe.",
    unlock: "shop",
    skin: { jacketColor: "#1a1414", pantsColor: "#0f0c0c", shoeColor: "#080606", accentColor: "#ff2e2e", hasHair: true },
  },
  "skin-glacier": {
    id: "skin-glacier",
    name: "Glacier",
    rarity: "epic",
    description: "Crystalline ice-plate armor that catches every light.",
    unlock: "shop",
    skin: { jacketColor: "#bfe8f5", pantsColor: "#8fc9de", shoeColor: "#5c93a8", accentColor: "#e8fbff", hasHair: false },
  },
  "skin-voidwalker": {
    id: "skin-voidwalker",
    name: "Voidwalker",
    rarity: "legendary",
    description: "Absorbs the light around it. Trims glow a deep violet.",
    unlock: "shop",
    skin: { jacketColor: "#0d0a17", pantsColor: "#08060f", shoeColor: "#040309", accentColor: "#8a3aff", hasHair: false },
  },
  "skin-goldrush": {
    id: "skin-goldrush",
    name: "Gold Rush",
    rarity: "epic",
    description: "Prospector gear plated in real (arena) gold.",
    unlock: "shop",
    skin: { jacketColor: "#c9963a", pantsColor: "#8a6420", shoeColor: "#5c4315", accentColor: "#ffe27a", hasHair: true },
  },
  "skin-junglecamo": {
    id: "skin-junglecamo",
    name: "Jungle Camo",
    rarity: "uncommon",
    description: "Dense-canopy field fatigues.",
    unlock: "shop",
    skin: { jacketColor: "#3a5c2e", pantsColor: "#26401d", shoeColor: "#182b11", accentColor: "#7dffb0", hasHair: true },
  },
  "skin-emberknight": {
    id: "skin-emberknight",
    name: "Ember Knight",
    rarity: "rare",
    description: "Scorched plate armor, still glowing at the seams.",
    unlock: "shop",
    skin: { jacketColor: "#3a1f14", pantsColor: "#26140d", shoeColor: "#170c08", accentColor: "#ff8a33", hasHair: false },
  },
  "skin-frostbyte": {
    id: "skin-frostbyte",
    name: "Frostbyte",
    rarity: "rare",
    description: "A cryo-tech operative, chilled circuitry visible under the plating.",
    unlock: "shop",
    skin: { jacketColor: "#2a3a4a", pantsColor: "#1c2836", shoeColor: "#121b26", accentColor: "#7ae0ff", hasHair: true },
  },
  "skin-toxicwaste": {
    id: "skin-toxicwaste",
    name: "Toxic Waste",
    rarity: "epic",
    description: "Hazmat-inspired kit, glowing an unnatural green.",
    unlock: "shop",
    skin: { jacketColor: "#2c3a1a", pantsColor: "#1c2610", shoeColor: "#111708", accentColor: "#c6ff33", hasHair: false },
  },
  "skin-royaleguard": {
    id: "skin-royaleguard",
    name: "Royale Guard",
    rarity: "legendary",
    description: "Ceremonial purple-and-gold plate for the arena's champions.",
    unlock: "shop",
    skin: { jacketColor: "#3a1c5c", pantsColor: "#26123d", shoeColor: "#170b26", accentColor: "#ffd23f", hasHair: false },
  },
  "skin-shadowop": {
    id: "skin-shadowop",
    name: "Shadow Op",
    rarity: "common",
    description: "All black, no callsign, no questions.",
    unlock: "shop",
    skin: { jacketColor: "#121212", pantsColor: "#0a0a0a", shoeColor: "#050505", accentColor: "#9aa4b2", hasHair: true },
  },
  "skin-sunburst": {
    id: "skin-sunburst",
    name: "Sunburst",
    rarity: "uncommon",
    description: "Bright warm-weather gear, built to be seen.",
    unlock: "shop",
    skin: { jacketColor: "#ff9a33", pantsColor: "#c96b1a", shoeColor: "#8a4a12", accentColor: "#ffe27a", hasHair: true },
  },
  "skin-cobaltstrike": {
    id: "skin-cobaltstrike",
    name: "Cobalt Strike",
    rarity: "rare",
    description: "Deep-blue tactical plate with sharp geometric trim.",
    unlock: "shop",
    skin: { jacketColor: "#1a3a6b", pantsColor: "#122847", shoeColor: "#0b1a2e", accentColor: "#4d9fff", hasHair: true },
  },
  "skin-magmacore": {
    id: "skin-magmacore",
    name: "Magma Core",
    rarity: "epic",
    description: "Molten-rock plating, cracked seams glowing red-hot.",
    unlock: "shop",
    skin: { jacketColor: "#241414", pantsColor: "#160c0c", shoeColor: "#0d0707", accentColor: "#ff4d1a", hasHair: false },
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
  "wrap-toxicbloom": { id: "wrap-toxicbloom", name: "Toxic Bloom", rarity: "epic", description: "Acid-green hazard coating.", bodyColor: "#2c3a1a", barrelColor: "#1c2610" },
  "wrap-royalpurple": { id: "wrap-royalpurple", name: "Royal Purple", rarity: "epic", description: "Deep purple ceremonial finish.", bodyColor: "#3a1c5c", barrelColor: "#26123d" },
  "wrap-emberforge": { id: "wrap-emberforge", name: "Ember Forge", rarity: "rare", description: "Forged in the arena's hottest furnace.", bodyColor: "#3a1f14", barrelColor: "#26140d" },
  "wrap-frostbite": { id: "wrap-frostbite", name: "Frostbite", rarity: "rare", description: "Cold enough to sting bare hands.", bodyColor: "#2a3a4a", barrelColor: "#1c2836" },
  "wrap-tigerstripe": { id: "wrap-tigerstripe", name: "Tiger Stripe", rarity: "uncommon", description: "Classic jungle-warfare stripe pattern.", bodyColor: "#4a3a1a", barrelColor: "#2a2010" },
  "wrap-urbancamo": { id: "wrap-urbancamo", name: "Urban Camo", rarity: "common", description: "Grey-scale city camouflage.", bodyColor: "#3a3d42", barrelColor: "#24262a" },
  "wrap-chromeplate": { id: "wrap-chromeplate", name: "Chrome Plate", rarity: "legendary", description: "Mirror-polished, fully chromed.", bodyColor: "#c9d2d8", barrelColor: "#9aa8b0" },
  "wrap-blackout": { id: "wrap-blackout", name: "Blackout", rarity: "common", description: "Matte black, no reflections.", bodyColor: "#0c0d10", barrelColor: "#050608" },
  "wrap-hazardstripe": { id: "wrap-hazardstripe", name: "Hazard Stripe", rarity: "uncommon", description: "Caution-tape yellow and black.", bodyColor: "#3a3410", barrelColor: "#1a1808" },
  "wrap-galaxy": { id: "wrap-galaxy", name: "Galaxy", rarity: "legendary", description: "A deep-space finish flecked with starlight.", bodyColor: "#1a1a3a", barrelColor: "#0d0d1e" },
  "wrap-bloodmoon": { id: "wrap-bloodmoon", name: "Blood Moon", rarity: "epic", description: "A dark crimson eclipse finish.", bodyColor: "#4a0d0d", barrelColor: "#260606" },
  "wrap-mintfrost": { id: "wrap-mintfrost", name: "Mint Frost", rarity: "rare", description: "Cool mint with a frosted edge.", bodyColor: "#1a4a3a", barrelColor: "#0d2620" },
  "wrap-coppervein": { id: "wrap-coppervein", name: "Copper Vein", rarity: "rare", description: "Oxidized copper piping and plate.", bodyColor: "#7a4a2a", barrelColor: "#4a2c18" },
  "wrap-staticdischarge": { id: "wrap-staticdischarge", name: "Static Discharge", rarity: "epic", description: "Crackling with contained voltage.", bodyColor: "#1a1a2e", barrelColor: "#0f0f1e" },
  "wrap-desertstorm": { id: "wrap-desertstorm", name: "Desert Storm", rarity: "uncommon", description: "Sand-scoured tan and khaki.", bodyColor: "#8a7248", barrelColor: "#5c4a2e" },
  "wrap-abyssal": { id: "wrap-abyssal", name: "Abyssal", rarity: "legendary", description: "As dark and deep as the arena gets.", bodyColor: "#08080f", barrelColor: "#040408" },
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
  "back-goldcape": { id: "back-goldcape", name: "Golden Cape", rarity: "legendary", description: "For arena royalty only.", color: "#ffd23f", shape: "cape" },
  "back-voidwings": { id: "back-voidwings", name: "Void Wings", rarity: "legendary", description: "Folded wings that seem to drink the light.", color: "#3a1c5c", shape: "wings" },
  "back-toxictank": { id: "back-toxictank", name: "Toxic Tank", rarity: "epic", description: "Contents unknown. Handle carefully.", color: "#7dff33", shape: "tank" },
  "back-crimsonshield": { id: "back-crimsonshield", name: "Crimson Shield", rarity: "rare", description: "A blood-red defensive plate.", color: "#ff2e2e", shape: "shield" },
};

export interface PickaxeDefinition {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  headColor: string;
  handleColor: string;
}

/** Cosmetic skins for the melee tool (see game/config/weapons.ts MELEE_ID) — appearance only, never changes its damage/range/cooldown. */
export const PICKAXES: Record<string, PickaxeDefinition> = {
  "pick-default": { id: "pick-default", name: "Trench Pick", rarity: "common", description: "Standard-issue melee tool.", headColor: "#6b7280", handleColor: "#3a2e24" },
  "pick-crimson": { id: "pick-crimson", name: "Blood Iron", rarity: "rare", description: "A rust-red forged head.", headColor: "#7a1a0d", handleColor: "#1c1c1c" },
  "pick-gold": { id: "pick-gold", name: "Golden Pick", rarity: "legendary", description: "Purely ceremonial. Still swings just as hard.", headColor: "#c9a227", handleColor: "#5c4527" },
  "pick-neon": { id: "pick-neon", name: "Volt Edge", rarity: "epic", description: "Etched with a glowing edge.", headColor: "#33e6ff", handleColor: "#1a1a2e" },
  "pick-toxic": { id: "pick-toxic", name: "Venom Spike", rarity: "epic", description: "Coated in something you don't want to touch.", headColor: "#c6ff33", handleColor: "#1c2610" },
  "pick-frost": { id: "pick-frost", name: "Ice Breaker", rarity: "rare", description: "Never quite thaws.", headColor: "#7ae0ff", handleColor: "#1c2836" },
  "pick-royale": { id: "pick-royale", name: "Royal Edge", rarity: "legendary", description: "Purple-and-gold, fit for a champion.", headColor: "#ffd23f", handleColor: "#3a1c5c" },
  "pick-copper": { id: "pick-copper", name: "Rustbound", rarity: "uncommon", description: "Salvaged, oxidized, still swings true.", headColor: "#a86a3a", handleColor: "#4a2c18" },
};
export const DEFAULT_PICKAXE_ID = "pick-default";

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
  "emote-shuffle": { id: "emote-shuffle", name: "Shuffle", rarity: "epic", description: "A smooth side-to-side shuffle step." },
  "emote-fistpump": { id: "emote-fistpump", name: "Fist Pump", rarity: "common", description: "Simple. Effective. Hype." },
  "emote-spinflex": { id: "emote-spinflex", name: "Spin Flex", rarity: "rare", description: "Spin around, then flex." },
  "emote-airguitar": { id: "emote-airguitar", name: "Air Guitar", rarity: "uncommon", description: "A killer solo, no guitar required." },
  "emote-moonwalk": { id: "emote-moonwalk", name: "Moonwalk", rarity: "legendary", description: "The classic backward glide." },
  "emote-breakdance": { id: "emote-breakdance", name: "Breakdance", rarity: "epic", description: "A spinning floor routine." },
  "emote-powerstance": { id: "emote-powerstance", name: "Power Stance", rarity: "rare", description: "A hero's landing pose." },
  "emote-freezeframe": { id: "emote-freezeframe", name: "Freeze Frame", rarity: "uncommon", description: "Strike a pose and hold it." },
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
  "banner-crimsonwave": { id: "banner-crimsonwave", name: "Crimson Wave", rarity: "rare", gradient: ["#ff2e2e", "#4a0d0d"] },
  "banner-toxicfield": { id: "banner-toxicfield", name: "Toxic Field", rarity: "epic", gradient: ["#c6ff33", "#1c2610"] },
  "banner-frostbound": { id: "banner-frostbound", name: "Frostbound", rarity: "rare", gradient: ["#7ae0ff", "#1c2836"] },
  "banner-sovereign": { id: "banner-sovereign", name: "Sovereign", rarity: "legendary", gradient: ["#b56bff", "#ffd23f"] },
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
  "icon-allstar": { id: "icon-allstar", name: "All-Star", rarity: "epic", glyph: "✦" },
  "icon-diamond": { id: "icon-diamond", name: "Diamond Hands", rarity: "legendary", glyph: "◈" },
  "icon-duelist": { id: "icon-duelist", name: "Duelist", rarity: "rare", glyph: "⚔" },
  "icon-nightowl": { id: "icon-nightowl", name: "Night Owl", rarity: "uncommon", glyph: "☾" },
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#9aa4b2",
  uncommon: "#33d17a",
  rare: "#33aaff",
  epic: "#b56bff",
  legendary: "#ffb020",
};

export const DEFAULT_SKIN_ID = "skin-default";
