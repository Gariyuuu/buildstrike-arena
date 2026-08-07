// Central weapon tuning. Edit values here to rebalance combat.
// 12 firearms + melee. Every player in competitive 1v1 has equal access to
// identical stats for a given weapon — rarity (see game/config/cosmetics-
// adjacent weaponWrap skins) is purely cosmetic and never touches these
// numbers. Names are deliberately plain/generic (Assault Rifle, SMG, ...)
// rather than stylized brand names — easier to tell apart at a glance.
export type WeaponId =
  | "rifle"
  | "burstRifle"
  | "battleRifle"
  | "lmg"
  | "marksmanRifle"
  | "shotgun"
  | "tacticalShotgun"
  | "smg"
  | "machinePistol"
  | "pistol"
  | "heavyPistol"
  | "revolver"
  | "melee";

export type WeaponClass = "primary" | "secondary" | "melee";
/** Which rendering silhouette WeaponView uses — several weapons share a look. */
export type WeaponVisual = "rifle" | "lmg" | "shotgun" | "pistol" | "revolver" | "marksman" | "melee";
/** Which synthesized sound archetype soundManager reuses for this weapon. */
export type WeaponSoundProfile = "rifle" | "shotgun" | "pistol" | "melee";

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  weaponClass: WeaponClass;
  visual: WeaponVisual;
  soundProfile: WeaponSoundProfile;
  fireRate: number; // shots per second
  automatic: boolean;
  /** 3-round burst weapons fire this many shots per trigger pull, at burstRate spacing. */
  burstCount?: number;
  burstRate?: number; // shots per second within a burst
  damage: number; // damage per hit (per pellet for shotguns)
  pellets: number; // hitscan rays per shot
  spread: number; // radians, half-angle cone
  magazineSize: number;
  reloadTime: number; // seconds
  range: number; // meters
  recoil: number; // camera kick per shot, radians
  headshotMultiplier: number;
}

export const WEAPONS: Record<WeaponId, WeaponConfig> = {
  rifle: {
    id: "rifle",
    name: "Assault Rifle",
    weaponClass: "primary",
    visual: "rifle",
    soundProfile: "rifle",
    fireRate: 8,
    automatic: true,
    damage: 18,
    pellets: 1,
    spread: 0.012,
    magazineSize: 30,
    reloadTime: 1.7,
    range: 120,
    recoil: 0.012,
    headshotMultiplier: 1.5,
  },
  burstRifle: {
    id: "burstRifle",
    name: "Burst Rifle",
    weaponClass: "primary",
    visual: "rifle",
    soundProfile: "rifle",
    fireRate: 2.2, // trigger-pull rate; burstCount/burstRate govern the 3 shots within each pull
    automatic: false,
    burstCount: 3,
    burstRate: 16,
    damage: 16,
    pellets: 1,
    spread: 0.006,
    magazineSize: 24,
    reloadTime: 1.8,
    range: 130,
    recoil: 0.014,
    headshotMultiplier: 1.5,
  },
  battleRifle: {
    id: "battleRifle",
    name: "Battle Rifle",
    weaponClass: "primary",
    visual: "rifle",
    soundProfile: "rifle",
    fireRate: 4,
    automatic: false,
    damage: 26,
    pellets: 1,
    spread: 0.008,
    magazineSize: 20,
    reloadTime: 1.9,
    range: 140,
    recoil: 0.02,
    headshotMultiplier: 1.5,
  },
  lmg: {
    id: "lmg",
    name: "LMG",
    weaponClass: "primary",
    visual: "lmg",
    soundProfile: "rifle",
    fireRate: 11,
    automatic: true,
    damage: 14,
    pellets: 1,
    spread: 0.02,
    magazineSize: 75,
    reloadTime: 3.2,
    range: 90,
    recoil: 0.016,
    headshotMultiplier: 1.3,
  },
  marksmanRifle: {
    id: "marksmanRifle",
    name: "Sniper Rifle",
    weaponClass: "primary",
    visual: "marksman",
    soundProfile: "rifle",
    fireRate: 1.8,
    automatic: false,
    damage: 42,
    pellets: 1,
    spread: 0.003,
    magazineSize: 10,
    reloadTime: 2.1,
    range: 160,
    recoil: 0.03,
    headshotMultiplier: 1.6,
  },
  shotgun: {
    id: "shotgun",
    name: "Shotgun",
    weaponClass: "secondary",
    visual: "shotgun",
    soundProfile: "shotgun",
    fireRate: 1.1,
    automatic: false,
    damage: 11,
    pellets: 8,
    spread: 0.09,
    magazineSize: 6,
    reloadTime: 2.4,
    range: 22,
    recoil: 0.05,
    headshotMultiplier: 1.25,
  },
  tacticalShotgun: {
    id: "tacticalShotgun",
    name: "Tactical Shotgun",
    weaponClass: "secondary",
    visual: "shotgun",
    soundProfile: "shotgun",
    fireRate: 2.4,
    automatic: false,
    damage: 7,
    pellets: 7,
    spread: 0.08,
    magazineSize: 9,
    reloadTime: 2.1,
    range: 24,
    recoil: 0.035,
    headshotMultiplier: 1.25,
  },
  smg: {
    id: "smg",
    name: "SMG",
    weaponClass: "secondary",
    visual: "rifle",
    soundProfile: "rifle",
    fireRate: 13,
    automatic: true,
    damage: 12,
    pellets: 1,
    spread: 0.024,
    magazineSize: 35,
    reloadTime: 1.4,
    range: 45,
    recoil: 0.009,
    headshotMultiplier: 1.4,
  },
  machinePistol: {
    id: "machinePistol",
    name: "Machine Pistol",
    weaponClass: "secondary",
    visual: "pistol",
    soundProfile: "pistol",
    fireRate: 14,
    automatic: true,
    damage: 9,
    pellets: 1,
    spread: 0.03,
    magazineSize: 28,
    reloadTime: 1.3,
    range: 35,
    recoil: 0.008,
    headshotMultiplier: 1.3,
  },
  pistol: {
    id: "pistol",
    name: "Pistol",
    weaponClass: "secondary",
    visual: "pistol",
    soundProfile: "pistol",
    fireRate: 5,
    automatic: false,
    damage: 15,
    pellets: 1,
    spread: 0.014,
    magazineSize: 12,
    reloadTime: 1.2,
    range: 60,
    recoil: 0.014,
    headshotMultiplier: 1.5,
  },
  heavyPistol: {
    id: "heavyPistol",
    name: "Heavy Pistol",
    weaponClass: "secondary",
    visual: "pistol",
    soundProfile: "pistol",
    fireRate: 2.3,
    automatic: false,
    damage: 34,
    pellets: 1,
    spread: 0.018,
    magazineSize: 7,
    reloadTime: 1.6,
    range: 70,
    recoil: 0.045,
    headshotMultiplier: 1.5,
  },
  revolver: {
    id: "revolver",
    name: "Revolver",
    weaponClass: "secondary",
    visual: "revolver",
    soundProfile: "pistol",
    fireRate: 1.6,
    automatic: false,
    damage: 48,
    pellets: 1,
    spread: 0.01,
    magazineSize: 6,
    reloadTime: 2.0,
    range: 65,
    recoil: 0.05,
    headshotMultiplier: 1.5,
  },
  // Always available, not part of the primary/secondary loadout (see
  // MELEE_CONFIG / LocalPlayer's dedicated performMeleeAttack — it doesn't
  // go through the ammo/reload pipeline at all). Kept as a real WeaponId
  // purely so it can ride the existing FireMsg/reportFire wire protocol and
  // the server's already-generic WEAPONS[msg.weapon] damage lookup, exactly
  // like the 8 firearms above — zero server changes needed. Deliberately
  // much weaker than any firearm (spec: "Do not make melee stronger than
  // firearms").
  melee: {
    id: "melee",
    name: "Pickaxe",
    weaponClass: "melee",
    visual: "melee",
    soundProfile: "melee",
    fireRate: 1.3,
    automatic: false,
    damage: 25,
    pellets: 1,
    spread: 0,
    magazineSize: 1,
    reloadTime: 0,
    range: 2.4,
    recoil: 0.02,
    headshotMultiplier: 1,
  },
};

export const MELEE_ID: WeaponId = "melee";

/** All 12 firearm ids in a canonical display order — for loadout-selector/reference UI, NOT what's equipped in a match (see loadoutStore for that). */
export const WEAPON_ORDER: WeaponId[] = [
  "rifle",
  "burstRifle",
  "battleRifle",
  "lmg",
  "marksmanRifle",
  "shotgun",
  "tacticalShotgun",
  "smg",
  "machinePistol",
  "pistol",
  "heavyPistol",
  "revolver",
];

export const PRIMARY_WEAPONS: WeaponId[] = WEAPON_ORDER.filter((id) => WEAPONS[id].weaponClass === "primary");
export const SECONDARY_WEAPONS: WeaponId[] = WEAPON_ORDER.filter((id) => WEAPONS[id].weaponClass === "secondary");
