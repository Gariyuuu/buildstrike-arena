export const CURRENT_VERSION = "v0.7.0";

export interface PatchNote {
  version: string;
  title: string;
  date: string;
  highlights: string[];
}

// Keep in sync with CHANGELOG.md — this is the player-facing summary,
// CHANGELOG.md is the full developer-facing record.
export const PATCH_NOTES: PatchNote[] = [
  {
    version: "v0.7.0",
    title: "Match Setup Update",
    date: "2026-08-06",
    highlights: [
      "Online 1v1 lobby now shows both players' name, level, skin, and loadout before ready-up",
      "Host-configurable match settings: rounds to win (3/5/10), headshots, healing, and infinite builds",
      "Bots now use the full 8-weapon arsenal instead of just rifle and shotgun",
      "New Expert bot difficulty — near-perfect aim and reliably smart weapon choices",
    ],
  },
  {
    version: "v0.6.0",
    title: "Daily Quests Update",
    date: "2026-08-06",
    highlights: [
      "3 rotating daily quests with XP and Coin rewards",
      "22 achievements tracked in your Profile",
    ],
  },
  {
    version: "v0.5.0",
    title: "Melee & Emotes Update",
    date: "2026-08-06",
    highlights: [
      "New melee tool: the Trench Pick — quick, low-damage, always available",
      "8 equippable emotes — open the wheel with B in the Lobby, Training Arena, or after a round",
    ],
  },
  {
    version: "v0.4.0",
    title: "Combat Feel Update",
    date: "2026-08-06",
    highlights: [
      "Camera shake, crosshair bloom, and directional damage indicators",
      "Shell ejection, muzzle flashes, and critical hit-marker feedback",
    ],
  },
  {
    version: "v0.3.0",
    title: "Arsenal & Shop Update",
    date: "2026-08-06",
    highlights: [
      "Arsenal expanded to 8 weapons — burst rifle, marksman rifle, tactical shotgun, SMG, and heavy pistol join the fight",
      "Pre-match loadout picker — equal stats for every player, no pay-to-win",
      "Rotating Item Shop with Featured and Daily sections",
      "Weapon wraps, back accessories, banners, and player icons added to the Locker",
    ],
  },
  {
    version: "v0.2.0",
    title: "Lobby Update",
    date: "2026-08-06",
    highlights: [
      "New character rig with real animations for movement, weapons, healing, building, and eliminations",
      "Brand new lobby hub: Play, Locker, Shop, Profile, and Quests tabs",
      "Player progression: 50 levels, XP, and Arena Coins",
      "Daily login rewards on a 7-day cycle",
      "8 starter character skins available in the Shop",
      "New Training Arena mode for free practice",
    ],
  },
  {
    version: "v0.1.0",
    title: "Launch",
    date: "2026-08-05",
    highlights: [
      "Bot Duel and Online 1v1 (private rooms by code)",
      "Rifle and shotgun combat with headshots and shields",
      "Wall, floor, and ramp building",
      "Shield potions and medkits",
    ],
  },
];
