"use client";

import { useEffect, useState } from "react";
import { useBRStore } from "@/stores/brStore";
import { useGameStore } from "@/stores/gameStore";
import { computeZoneState } from "@/game/br/zone";
import { squadCountAlive, playersAlive } from "@/game/br/roster";
import { WEAPONS } from "@/game/config/weapons";
import { formatKeyLabel, useKeybindsStore } from "@/stores/keybindsStore";
import { soundManager } from "@/game/audio/soundManager";

export function BRHud() {
  const phase = useBRStore((s) => s.phase);
  const agents = useBRStore((s) => s.agents);
  const health = useBRStore((s) => s.health);
  const shield = useBRStore((s) => s.shield);
  const slots = useBRStore((s) => s.slots);
  const selectedSlot = useBRStore((s) => s.selectedSlot);
  const isReloading = useBRStore((s) => s.isReloading);
  const healingCounts = useBRStore((s) => s.healingCounts);
  const selectedHeal = useBRStore((s) => s.selectedHeal);
  const isHealing = useBRStore((s) => s.isHealing);
  const healProgress = useBRStore((s) => s.healProgress);
  const matchStartedAt = useBRStore((s) => s.matchStartedAt);
  const interactKey = useKeybindsStore((s) => s.binds.interact);

  const [now, setNow] = useState(0);
  useEffect(() => {
    let raf: number;
    const tick = () => {
      setNow(performance.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const [leaveConfirm, setLeaveConfirm] = useState(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Escape") return;
      if (useBRStore.getState().phase !== "combat") return;
      setLeaveConfirm((v) => !v);
      if (document.pointerLockElement) document.exitPointerLock();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function leaveMatch() {
    soundManager.play("uiClick");
    useBRStore.getState().reset();
    useGameStore.getState().setMode(null);
    useGameStore.getState().setScreen("menu");
  }

  if (leaveConfirm && phase === "combat") {
    return (
      <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/60">
        <div className="glass-panel bs-pop-in w-full max-w-xs p-6 text-center">
          <h3 className="text-lg font-bold text-white">Leave Match?</h3>
          <p className="mt-1 text-xs text-white/50">You&apos;ll forfeit this run.</p>
          <div className="mt-4 flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setLeaveConfirm(false)}>
              Resume
            </button>
            <button className="btn-orange flex-1" onClick={leaveMatch}>
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "deploying") {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <p className="bs-pop-in text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(51,230,255,0.6)]">Deploying…</p>
      </div>
    );
  }
  if (phase !== "combat") return null;

  const squadsLeft = squadCountAlive(agents);
  const playersLeft = playersAlive(agents);
  const elapsed = matchStartedAt ? (now - matchStartedAt) / 1000 : 0;
  const zone = computeZoneState(elapsed);
  const selected = slots[selectedSlot];
  const weaponCfg = selected.weapon ? WEAPONS[selected.weapon] : null;

  return (
    <>
      <div className="pointer-events-none absolute left-1/2 top-5 flex -translate-x-1/2 items-center gap-4 glass-panel px-5 py-2">
        <div className="text-center">
          <p className="font-mono text-2xl font-black text-bs-cyan">{squadsLeft}</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Squads Left</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-white/70">{playersLeft}</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Players</p>
        </div>
        <div className="text-center">
          <p className={`font-mono text-lg font-bold ${zone.shrinking ? "text-bs-orange" : "text-white/70"}`}>{Math.ceil(zone.phaseTimeRemaining)}s</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{zone.shrinking ? "Zone Closing" : "Next Zone"}</p>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-5 w-56">
        <div className="mb-1.5 h-3 overflow-hidden rounded-full bg-black/40">
          <div className="h-full rounded-full bg-red-500 transition-[width]" style={{ width: `${health}%` }} />
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/40">
          <div className="h-full rounded-full bg-bs-cyan transition-[width]" style={{ width: `${shield}%` }} />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-5 right-5 glass-panel px-4 py-2 text-right">
        {weaponCfg ? (
          <>
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">{weaponCfg.name}</p>
            <p className="font-mono text-xl font-black text-white">
              {isReloading ? "…" : selected.ammoInMag} / {weaponCfg.magazineSize}
            </p>
          </>
        ) : (
          <p className="text-xs font-bold uppercase tracking-wider text-white/30">No Weapon — [1]/[2] to select loot</p>
        )}
        <div className="mt-1 flex justify-end gap-2 font-mono text-[11px] text-white/50">
          <span className={selectedHeal === "shieldPotion" ? "text-bs-cyan" : ""}>[3] Shield {healingCounts.shieldPotion}</span>
          <span className={selectedHeal === "medkit" ? "text-bs-orange" : ""}>[4] Medkit {healingCounts.medkit}</span>
        </div>
        {isHealing && (
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
            <div className="h-full rounded-full bg-bs-cyan" style={{ width: `${healProgress * 100}%` }} />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 text-center text-[11px] font-semibold uppercase tracking-wider text-white/30">
        Walk over items to pick them up · [{formatKeyLabel(interactKey)}] open chests
      </div>
    </>
  );
}
