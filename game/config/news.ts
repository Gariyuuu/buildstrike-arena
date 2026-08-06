export interface NewsItem {
  id: string;
  title: string;
  body: string;
  tag: "update" | "cosmetic" | "weapon" | "coming-soon";
}

// Stored locally for now — see TASKS.md if this ever needs to move to a CMS.
export const NEWS_ITEMS: NewsItem[] = [
  {
    id: "lobby-update",
    title: "The Lobby Update Is Here",
    body: "A brand new hub, character progression, Arena Coins, and 8 starter skins in the Shop.",
    tag: "update",
  },
  {
    id: "more-weapons-soon",
    title: "Full Arsenal Incoming",
    body: "Burst rifle, SMG, pistols, and marksman rifle are on the way — every player will always have equal access in competitive 1v1.",
    tag: "coming-soon",
  },
  {
    id: "quests-soon",
    title: "Daily Quests — Coming Soon",
    body: "Rotating daily objectives with XP and coin rewards are in development.",
    tag: "coming-soon",
  },
];
