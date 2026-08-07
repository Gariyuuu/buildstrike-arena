"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { QUEST_TEMPLATES, DAILY_QUEST_COUNT, type QuestMetric, type QuestTemplate } from "@/game/config/quests";
import { pickForDate } from "@/game/shop/rotation";
import { useProfileStore } from "@/stores/profileStore";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface ActiveQuest {
  templateId: string;
  progress: number;
  claimed: boolean;
}

interface QuestState {
  date: string;
  active: ActiveQuest[];
  ensureToday: () => void;
  addProgress: (metric: QuestMetric, amount: number) => void;
  claim: (templateId: string) => { xpGained: number; coinsGained: number } | null;
}

function generateForToday(): ActiveQuest[] {
  const picked = pickForDate(QUEST_TEMPLATES, DAILY_QUEST_COUNT, new Date(), "daily-quests");
  return picked.map((t) => ({ templateId: t.id, progress: 0, claimed: false }));
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      date: "",
      active: [],

      ensureToday: () => {
        const today = todayKey();
        if (get().date !== today) set({ date: today, active: generateForToday() });
      },

      addProgress: (metric, amount) => {
        get().ensureToday();
        set((s) => ({
          active: s.active.map((q) => {
            if (q.claimed) return q;
            const template = QUEST_TEMPLATES.find((t) => t.id === q.templateId);
            if (!template || template.metric !== metric) return q;
            return { ...q, progress: Math.min(template.target, q.progress + amount) };
          }),
        }));
      },

      claim: (templateId) => {
        const quest = get().active.find((q) => q.templateId === templateId);
        const template = QUEST_TEMPLATES.find((t) => t.id === templateId);
        if (!quest || !template || quest.claimed || quest.progress < template.target) return null;
        set((s) => ({ active: s.active.map((q) => (q.templateId === templateId ? { ...q, claimed: true } : q)) }));
        useProfileStore.getState().addXp(template.xpReward);
        useProfileStore.getState().addCoins(template.coinReward);
        return { xpGained: template.xpReward, coinsGained: template.coinReward };
      },
    }),
    { name: "buildstrike-quests" }
  )
);

export function questTemplateFor(id: string): QuestTemplate | undefined {
  return QUEST_TEMPLATES.find((t) => t.id === id);
}
