"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { WEAPONS } from "@/game/config/weapons";
import { useLoadoutStore } from "@/stores/loadoutStore";
import { BUILD_TYPES, type BuildKind } from "@/game/config/builds";

const BUILD_ORDER: BuildKind[] = ["wall", "floor", "ramp"];
const BUILD_LABEL: Record<BuildKind, string> = { wall: "Wall", floor: "Floor", ramp: "Ramp" };

export function CombatHud() {
  const local = usePlayerStore((s) => s.local);

  return (
    <>
      <div className="pointer-events-none absolute bottom-5 left-5 flex w-64 flex-col gap-2">
        <Bar label="Health" value={local.health} max={100} color="#ff5c5c" bg="#3a1414" />
        <Bar label="Shield" value={local.shield} max={100} color="#33e6ff" bg="#0e2a30" />
      </div>

      <div className="pointer-events-none absolute bottom-5 right-5 flex flex-col items-end gap-2">
        {!local.isBuildMode ? (
          <div className="glass-panel px-4 py-2 text-right">
            <p className="text-xs uppercase tracking-wider text-white/50">{WEAPONS[local.weapon].name}</p>
            <p className="font-mono text-2xl font-bold text-white">
              {local.isReloading ? <span className="text-bs-orange">Reloading…</span> : `${local.ammoInMag} / ${WEAPONS[local.weapon].magazineSize}`}
            </p>
          </div>
        ) : (
          <div className="glass-panel px-4 py-2 text-right">
            <p className="text-xs uppercase tracking-wider text-white/50">Build Mode</p>
            <p className="font-mono text-lg font-bold text-bs-cyan">{BUILD_LABEL[local.buildKind]}</p>
          </div>
        )}
        <InventoryBar />
      </div>

      <HealProgress />
      <DamageFlash />
      <DirectionalDamageIndicator />
      <HitMarker />
      <BuildDeniedToast />
      <EliminationBanner />
      <FpsCounter />
    </>
  );
}

function Bar({ label, value, max, color, bg }: { label: string; value: number; max: number; color: string; bg: string }) {
  const frac = Math.max(0, Math.min(1, value / max));
  return (
    <div className="glass-panel px-3 py-2">
      <div className="mb-1 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-white/50">
        <span>{label}</span>
        <span className="font-mono text-white/80">{Math.ceil(value)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: bg }}>
        <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${frac * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function InventoryBar() {
  const local = usePlayerStore((s) => s.local);
  const primary = useLoadoutStore((s) => s.primary);
  const secondary = useLoadoutStore((s) => s.secondary);
  const items = [
    ...[primary, secondary].map((id) => ({ id, kind: "weapon" as const, label: WEAPONS[id].name.split(" ")[0], count: null as number | null })),
    { id: "shieldPotion" as const, kind: "heal" as const, label: "Shield", count: local.healingCounts.shieldPotion },
    { id: "medkit" as const, kind: "heal" as const, label: "Medkit", count: local.healingCounts.medkit },
  ];
  return (
    <div className="flex gap-1.5">
      {items.map((item) => {
        const active = local.selected === item.id;
        return (
          <div
            key={item.id}
            className={`flex h-14 w-14 flex-col items-center justify-center rounded-lg border text-[10px] font-semibold transition ${
              active ? "border-bs-cyan bg-bs-cyan/20 text-bs-cyan" : "border-white/10 bg-black/30 text-white/50"
            }`}
          >
            <span>{item.label}</span>
            {item.count !== null && <span className="font-mono text-sm">{item.count}</span>}
          </div>
        );
      })}
      <div className="flex gap-1">
        {BUILD_ORDER.map((kind) => {
          const active = local.isBuildMode && local.buildKind === kind;
          return (
            <div
              key={kind}
              className={`flex h-14 w-10 flex-col items-center justify-center rounded-lg border text-[10px] font-semibold transition ${
                active ? "border-bs-orange bg-bs-orange/20 text-bs-orange" : "border-white/10 bg-black/20 text-white/40"
              }`}
            >
              {BUILD_LABEL[kind][0]}
              <span className="text-[9px] opacity-70">{BUILD_TYPES[kind].health}hp</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HealProgress() {
  const isHealing = usePlayerStore((s) => s.local.isHealing);
  const progress = usePlayerStore((s) => s.local.healProgress);
  if (!isHealing) return null;
  const deg = progress * 360;
  return (
    <div className="pointer-events-none absolute left-1/2 top-[62%] -translate-x-1/2">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(#33e6ff ${deg}deg, rgba(255,255,255,0.12) ${deg}deg)` }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0a0e17] text-xs font-bold text-white">
          {Math.round(progress * 100)}%
        </div>
      </div>
    </div>
  );
}

function DamageFlash() {
  const trigger = usePlayerStore((s) => s.damageFlash);
  if (!trigger) return null;
  return (
    <div
      key={trigger}
      className="bs-damage-flash pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(255,20,20,0.35)_100%)]"
    />
  );
}

function HitMarker() {
  const trigger = usePlayerStore((s) => s.hitMarker);
  const critical = usePlayerStore((s) => s.hitMarkerCritical);
  if (!trigger) return null;
  const color = critical ? "#ffb020" : "#ffffff";
  const size = critical ? 32 : 26;
  return (
    <div key={trigger} className="bs-hitmarker pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <svg width={size} height={size} viewBox="0 0 26 26">
        <line x1="2" y1="2" x2="24" y2="24" stroke={color} strokeWidth={critical ? 4 : 3} />
        <line x1="24" y1="2" x2="2" y2="24" stroke={color} strokeWidth={critical ? 4 : 3} />
      </svg>
    </div>
  );
}

function DirectionalDamageIndicator() {
  const trigger = usePlayerStore((s) => s.damageFlash);
  const bearing = usePlayerStore((s) => s.damageFlashBearing);
  if (!trigger || bearing === null) return null;
  // bearing: 0 = directly ahead, +/-PI = behind. Rotate a glow arc to sit at
  // the screen edge closest to where the damage came from.
  const deg = (bearing * 180) / Math.PI;
  return (
    <div
      key={trigger}
      className="bs-directional-damage pointer-events-none absolute left-1/2 top-1/2 h-0 w-0"
      style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)` }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: -230,
          width: 140,
          height: 90,
          background: "radial-gradient(ellipse at 50% 100%, rgba(255,60,60,0.55), transparent 70%)",
        }}
      />
    </div>
  );
}

function BuildDeniedToast() {
  const trigger = usePlayerStore((s) => s.buildDenied);
  if (!trigger) return null;
  return (
    <div key={trigger} className="bs-pop-in pointer-events-none absolute left-1/2 top-[70%] -translate-x-1/2">
      <p className="rounded-lg bg-black/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-bs-red">
        Placement denied
      </p>
    </div>
  );
}

function EliminationBanner() {
  const message = usePlayerStore((s) => s.eliminationMessage);
  const setMessage = usePlayerStore((s) => s.setEliminationMessage);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2200);
    return () => clearTimeout(t);
  }, [message, setMessage]);
  if (!message) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-[28%] -translate-x-1/2 bs-pop-in">
      <p className="rounded-lg bg-black/50 px-6 py-2 text-xl font-black uppercase tracking-widest text-bs-orange">{message}</p>
    </div>
  );
}

function FpsCounter() {
  const show = useSettingsStore((s) => s.showFps);
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    if (!show) return;
    let raf = 0;
    last.current = performance.now();
    const loop = () => {
      frames.current += 1;
      const now = performance.now();
      if (now - last.current >= 500) {
        setFps(Math.round((frames.current * 1000) / (now - last.current)));
        frames.current = 0;
        last.current = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [show]);

  if (!show) return null;
  return (
    <div className="pointer-events-none absolute left-5 top-5 rounded-md bg-black/40 px-2 py-1 font-mono text-xs text-bs-cyan">
      {fps} FPS
    </div>
  );
}
