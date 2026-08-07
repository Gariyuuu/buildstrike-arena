"use client";

import { useState } from "react";
import { useProfileStore } from "@/stores/profileStore";
import { DAILY_REWARD_CYCLE } from "@/game/config/dailyRewards";
import { soundManager } from "@/game/audio/soundManager";

export function DailyRewardModal({ onClose }: { onClose: () => void }) {
  const cycleDay = useProfileStore((s) => s.dailyRewardCycleDay);
  const claimDailyReward = useProfileStore((s) => s.claimDailyReward);
  const [claimed, setClaimed] = useState<{ label: string } | null>(null);
  // If the header's "Daily" button is clicked after today's reward was
  // already claimed, canClaimDailyReward() is false and claimDailyReward()
  // is a no-op — without this check the modal showed "Claim Reward" forever
  // with no way to close it, since the only close path was the "Continue"
  // button that appears after a *successful* claim.
  const alreadyClaimedToday = useProfileStore((s) => !s.canClaimDailyReward()) && !claimed;

  function claim() {
    const reward = claimDailyReward();
    if (!reward) return;
    soundManager.play("coinGain");
    setClaimed({ label: reward.label });
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel bs-pop-in relative w-full max-w-lg p-6">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
        <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-white/40">Daily Reward</p>
        <h2 className="mt-1 text-center text-2xl font-black text-white">
          {claimed ? "Reward Claimed!" : alreadyClaimedToday ? "Already Claimed Today" : `Day ${cycleDay} of 7`}
        </h2>

        <div className="mt-5 grid grid-cols-7 gap-1.5">
          {DAILY_REWARD_CYCLE.map((r) => {
            const isToday = r.day === cycleDay && !claimed;
            const isPast = r.day < cycleDay || (claimed && r.day <= cycleDay);
            return (
              <div
                key={r.day}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center ${
                  isToday
                    ? "border-bs-cyan bg-bs-cyan/15"
                    : isPast
                      ? "border-white/5 bg-white/5 opacity-50"
                      : "border-white/10 bg-black/25"
                }`}
              >
                <p className="text-[9px] font-bold uppercase text-white/40">Day {r.day}</p>
                <p className="text-[10px] font-semibold text-white/80">{r.kind === "coins" ? `${r.coins}` : "🎁"}</p>
              </div>
            );
          })}
        </div>

        {claimed && <p className="mt-4 text-center font-mono text-lg text-bs-cyan">{claimed.label}</p>}

        <div className="mt-6 flex justify-center">
          {claimed ? (
            <button className="btn-primary w-full max-w-xs" onClick={onClose}>
              Continue
            </button>
          ) : alreadyClaimedToday ? (
            <button className="btn-secondary w-full max-w-xs cursor-default opacity-70" onClick={onClose}>
              Already Claimed
            </button>
          ) : (
            <button className="btn-primary w-full max-w-xs" onClick={claim}>
              Claim Reward
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
