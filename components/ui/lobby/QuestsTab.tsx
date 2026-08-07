"use client";

import { useEffect } from "react";
import { useQuestStore } from "@/stores/questStore";
import { questTemplateFor } from "@/stores/questStore";
import { soundManager } from "@/game/audio/soundManager";

export function QuestsTab() {
  const active = useQuestStore((s) => s.active);
  const ensureToday = useQuestStore((s) => s.ensureToday);
  const claim = useQuestStore((s) => s.claim);

  useEffect(() => {
    ensureToday();
  }, [ensureToday]);

  return (
    <div className="w-full max-w-xl">
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">Daily Quests</p>
      <div className="flex flex-col gap-3">
        {active.length === 0 && <p className="text-sm text-white/40">Loading today&apos;s quests…</p>}
        {active.map((q) => {
          const template = questTemplateFor(q.templateId);
          if (!template) return null;
          const done = q.progress >= template.target;
          const frac = Math.min(1, q.progress / template.target);
          return (
            <div key={q.templateId} className="glass-panel p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{template.description}</p>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-bs-cyan">+{template.xpReward} XP</span>
                  <span className="text-bs-orange">+{template.coinReward} Coins</span>
                </div>
              </div>
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-bs-cyan transition-[width]" style={{ width: `${frac * 100}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-white/50">
                  {Math.min(q.progress, template.target)} / {template.target}
                </span>
                <button
                  className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                    q.claimed
                      ? "cursor-default bg-white/5 text-white/30"
                      : done
                        ? "bg-bs-cyan text-[#04141a] hover:brightness-110"
                        : "cursor-not-allowed bg-white/5 text-white/30"
                  }`}
                  disabled={!done || q.claimed}
                  onClick={() => {
                    if (claim(q.templateId)) soundManager.play("coinGain");
                  }}
                >
                  {q.claimed ? "Claimed" : done ? "Claim" : "In Progress"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-[11px] text-white/30">Quests reset daily and refresh with the shop.</p>
    </div>
  );
}
