export const CURRENT_VERSION = "v0.2.0";

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
