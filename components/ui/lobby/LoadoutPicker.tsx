"use client";

import { useLoadoutStore } from "@/stores/loadoutStore";
import { WEAPONS, PRIMARY_WEAPONS, SECONDARY_WEAPONS } from "@/game/config/weapons";
import { soundManager } from "@/game/audio/soundManager";

export function LoadoutPicker() {
  const primary = useLoadoutStore((s) => s.primary);
  const secondary = useLoadoutStore((s) => s.secondary);
  const setPrimary = useLoadoutStore((s) => s.setPrimary);
  const setSecondary = useLoadoutStore((s) => s.setSecondary);
  const setDefault = useLoadoutStore((s) => s.setDefault);

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Loadout</p>
        <button
          className="text-[11px] font-semibold text-bs-cyan hover:underline"
          onClick={() => {
            setDefault();
            soundManager.play("uiClick");
          }}
        >
          Default Competitive
        </button>
      </div>

      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">Primary</p>
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        {PRIMARY_WEAPONS.map((id) => (
          <button
            key={id}
            onClick={() => {
              setPrimary(id);
              soundManager.play("uiClick");
            }}
            className={`rounded-md border px-1.5 py-1.5 text-[11px] font-semibold transition ${
              primary === id ? "border-bs-cyan bg-bs-cyan/15 text-bs-cyan" : "border-white/10 bg-white/5 text-white/60 hover:border-white/25"
            }`}
          >
            {WEAPONS[id].name}
          </button>
        ))}
      </div>

      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">Secondary</p>
      <div className="grid grid-cols-3 gap-1.5">
        {SECONDARY_WEAPONS.map((id) => (
          <button
            key={id}
            onClick={() => {
              setSecondary(id);
              soundManager.play("uiClick");
            }}
            className={`rounded-md border px-1.5 py-1.5 text-[11px] font-semibold transition ${
              secondary === id ? "border-bs-orange bg-bs-orange/15 text-bs-orange" : "border-white/10 bg-white/5 text-white/60 hover:border-white/25"
            }`}
          >
            {WEAPONS[id].name}
          </button>
        ))}
      </div>
    </div>
  );
}
