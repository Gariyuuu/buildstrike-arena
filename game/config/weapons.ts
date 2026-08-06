// Central weapon tuning. Edit values here to rebalance combat.
export type WeaponId = "rifle" | "shotgun";

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  fireRate: number; // shots per second
  automatic: boolean;
  damage: number; // damage per hit (per pellet for shotgun)
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
    name: "Volt Rifle",
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
  shotgun: {
    id: "shotgun",
    name: "Ridgeline Scattergun",
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
};

export const WEAPON_ORDER: WeaponId[] = ["rifle", "shotgun"];
