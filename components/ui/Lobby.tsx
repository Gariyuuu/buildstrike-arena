"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useProfileStore } from "@/stores/profileStore";
import { NEWS_ITEMS } from "@/game/config/news";
import { CURRENT_VERSION, PATCH_NOTES } from "@/game/config/patchNotes";
import { soundManager } from "@/game/audio/soundManager";
import { LobbyCharacterPreview } from "@/components/ui/lobby/LobbyCharacterPreview";
import { PlayTab } from "@/components/ui/lobby/PlayTab";
import { LockerTab } from "@/components/ui/lobby/LockerTab";
import { ShopTab } from "@/components/ui/lobby/ShopTab";
import { QuestsTab } from "@/components/ui/lobby/QuestsTab";
import { ProfileTab } from "@/components/ui/lobby/ProfileTab";
import { DailyRewardModal } from "@/components/ui/lobby/DailyRewardModal";

type LobbyTab = "play" | "locker" | "shop" | "quests" | "profile";

const TABS: { id: LobbyTab; label: string }[] = [
  { id: "play", label: "Play" },
  { id: "locker", label: "Locker" },
  { id: "shop", label: "Shop" },
  { id: "quests", label: "Quests" },
  { id: "profile", label: "Profile" },
];

export function Lobby() {
  const setScreen = useGameStore((s) => s.setScreen);
  const level = useProfileStore((s) => s.level);
  const xpIntoLevel = useProfileStore((s) => s.xpIntoLevel);
  const xpForNextLevel = useProfileStore((s) => s.xpForNextLevel);
  const coins = useProfileStore((s) => s.coins);
  // Reactive — drives only the small badge dot on the "Daily" button, so it
  // stays correct across the persist middleware's async localStorage
  // rehydration. The modal's own open/closed state is intentionally NOT
  // tied to this: once open, claiming the reward makes canClaimDailyReward()
  // flip to false immediately, and a reactive open-condition would close the
  // modal out from under the player before they see what they got.
  const canClaimNow = useProfileStore((s) => s.canClaimDailyReward());
  const displayName = useProfileStore((s) => s.displayName);

  const [tab, setTab] = useState<LobbyTab>("play");
  // Lazy initializer (not an effect) — a plain first-render read, so this
  // doesn't trip the "no setState in effect" rule, and deliberately doesn't
  // re-evaluate after mount (see comment above).
  const [dailyModalOpen, setDailyModalOpen] = useState(() => useProfileStore.getState().canClaimDailyReward());
  const [showPatchNotes, setShowPatchNotes] = useState(false);

  const xpFrac = xpForNextLevel > 0 ? Math.min(1, xpIntoLevel / xpForNextLevel) : 1;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_10%,#132033,transparent_60%),linear-gradient(180deg,#05070d,#0a0e17)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="BuildStrike Arena logo" className="h-9 w-9 rounded-lg" />
          <h1 className="text-lg font-black tracking-tight text-white">
            BUILD<span className="text-bs-cyan">STRIKE</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-bs-cyan/15 px-2 py-1 font-mono text-xs font-bold text-bs-cyan">Lvl {level}</span>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-bs-cyan transition-[width]" style={{ width: `${xpFrac * 100}%` }} />
            </div>
          </div>
          <span className="font-mono text-sm font-bold text-bs-orange">{coins.toLocaleString()} coins</span>
          <button
            className="relative rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/70 hover:border-white/25"
            onClick={() => {
              soundManager.play("uiClick");
              setDailyModalOpen(true);
            }}
          >
            Daily
            {canClaimNow && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-bs-orange bs-pulse" />}
          </button>
          <button
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/70 hover:border-white/25"
            onClick={() => {
              soundManager.play("uiClick");
              setScreen("settings");
            }}
          >
            Settings
          </button>
          <button
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/70 hover:border-white/25"
            onClick={() => {
              soundManager.play("uiClick");
              setScreen("instructions");
            }}
          >
            Instructions
          </button>
        </div>
      </div>

      {/* Body: character preview + tab content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="relative hidden shrink-0 lg:block lg:w-80 xl:w-96">
          <LobbyCharacterPreview className="absolute inset-0" />
          <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center">
            <p className="text-sm font-bold text-white/80">{displayName}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-5">
          <div className="mb-5 flex gap-1.5 rounded-xl bg-black/30 p-1 text-sm font-semibold">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  soundManager.play("uiClick");
                  setTab(t.id);
                }}
                className={`flex-1 rounded-lg py-2 transition ${tab === t.id ? "bg-bs-cyan text-[#04141a]" : "text-white/70 hover:text-white"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 items-start justify-center">
            {tab === "play" && <PlayTab />}
            {tab === "locker" && <div className="w-full max-w-2xl"><LockerTab /></div>}
            {tab === "shop" && <div className="w-full max-w-3xl"><ShopTab /></div>}
            {tab === "quests" && <div className="w-full max-w-xl"><QuestsTab /></div>}
            {tab === "profile" && <div className="w-full max-w-xl"><ProfileTab /></div>}
          </div>

          {tab === "play" && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="glass-panel p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">News</p>
                <div className="flex flex-col gap-2">
                  {NEWS_ITEMS.slice(0, 2).map((n) => (
                    <div key={n.id}>
                      <p className="text-sm font-semibold text-white">{n.title}</p>
                      <p className="text-xs text-white/50">{n.body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-panel p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/40">Patch Notes</p>
                  <button className="text-xs font-semibold text-bs-cyan hover:underline" onClick={() => setShowPatchNotes(true)}>
                    View all
                  </button>
                </div>
                <p className="text-sm font-semibold text-white">{PATCH_NOTES[0].version} — {PATCH_NOTES[0].title}</p>
                <p className="text-xs text-white/50">{PATCH_NOTES[0].highlights[0]}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] text-white/25">{CURRENT_VERSION}</div>

      {dailyModalOpen && <DailyRewardModal onClose={() => setDailyModalOpen(false)} />}

      {showPatchNotes && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowPatchNotes(false)}>
          <div className="glass-panel bs-pop-in max-h-[80vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-xl font-black text-white">Patch Notes</h2>
            <div className="flex flex-col gap-5">
              {PATCH_NOTES.map((p) => (
                <div key={p.version}>
                  <p className="font-mono text-sm font-bold text-bs-cyan">{p.version} — {p.title}</p>
                  <p className="text-xs text-white/40">{p.date}</p>
                  <ul className="mt-2 list-inside list-disc text-sm text-white/70">
                    {p.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button className="btn-secondary mt-5 w-full" onClick={() => setShowPatchNotes(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
