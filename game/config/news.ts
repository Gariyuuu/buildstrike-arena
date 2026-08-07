export interface NewsItem {
  id: string;
  title: string;
  body: string;
  tag: "update" | "cosmetic" | "weapon" | "coming-soon";
}

// Stored locally for now — see TASKS.md if this ever needs to move to a CMS.
export const NEWS_ITEMS: NewsItem[] = [
  {
    id: "match-setup-update",
    title: "Match Setup Update Is Here",
    body: "See your opponent's loadout before you ready up, and hosts can now set rounds-to-win plus toggle headshots, healing, and infinite builds.",
    tag: "update",
  },
  {
    id: "expert-bots",
    title: "Expert Bot Difficulty Added",
    body: "Bots now draw from the full 8-weapon arsenal and pick the right tool for the range. Expert difficulty barely misses.",
    tag: "update",
  },
  {
    id: "quests-live",
    title: "Daily Quests & Achievements Are Live",
    body: "3 rotating daily objectives and 22 achievements to track in your Profile — earn XP and Coins as you play.",
    tag: "update",
  },
  {
    id: "full-arsenal",
    title: "Full Arsenal Shipped",
    body: "Burst rifle, marksman rifle, tactical shotgun, SMG, and heavy pistol are all live. Every player always has equal access in competitive 1v1.",
    tag: "weapon",
  },
  {
    id: "more-to-come",
    title: "More In Development",
    body: "New arenas and modes are in the works.",
    tag: "coming-soon",
  },
];
