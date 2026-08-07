import { WEAPONS, WEAPON_ORDER, type WeaponId, type WeaponConfig } from "@/game/config/weapons";
import type { BotDifficulty } from "@/game/config/bots";

// Range bands a bot considers tactically ideal for its distance to the
// target — melee is deliberately excluded (bots have no swing-animation/
// PickaxeView pathway, only WeaponView, so an equipped "melee" would render
// with no visible weapon model; see the VISUAL_PRESETS placeholder note in
// WeaponView.tsx). Every other firearm from WEAPON_ORDER is in play.
function idealWeaponsForDistance(distance: number): WeaponId[] {
  if (distance < 9) return ["shotgun", "tacticalShotgun", "smg"];
  if (distance < 16) return ["smg", "rifle", "pistol"];
  if (distance < 24) return ["rifle", "burstRifle", "heavyPistol"];
  return ["marksmanRifle", "burstRifle", "rifle"];
}

// Chance a bot picks from the ideal band for its range vs. a random weapon
// from its whole kit — higher difficulties make sharper tactical choices
// without this touching aim accuracy or damage (those are tuned separately
// via BOT_DIFFICULTY.aimAccuracy).
const OPTIMAL_PICK_CHANCE: Record<BotDifficulty, number> = {
  easy: 0.35,
  normal: 0.65,
  hard: 0.9,
  expert: 1,
};

export function pickBotWeapon(distance: number, difficulty: BotDifficulty): WeaponConfig {
  const pool = Math.random() < OPTIMAL_PICK_CHANCE[difficulty] ? idealWeaponsForDistance(distance) : WEAPON_ORDER;
  const id = pool[Math.floor(Math.random() * pool.length)];
  return WEAPONS[id];
}
