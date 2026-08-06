"use client";

import { useGameStore } from "@/stores/gameStore";
import { soundManager } from "@/game/audio/soundManager";

const CONTROLS: [string, string][] = [
  ["WASD", "Move"],
  ["Mouse", "Look"],
  ["Left Click", "Shoot / Place build / Use item"],
  ["Right Click", "Aim"],
  ["Space", "Jump"],
  ["Shift", "Sprint"],
  ["R", "Reload"],
  ["Q", "Enter / exit build mode"],
  ["1 / 2 / 3", "Rifle / Shotgun / Shield Potion"],
  ["Scroll Wheel", "Cycle weapons & items"],
  ["Z / X / C", "Wall / Floor / Ramp"],
  ["F", "Rotate build (in build mode)"],
  ["Escape", "Pause menu"],
];

export function InstructionsModal() {
  const setScreen = useGameStore((s) => s.setScreen);
  const mode = useGameStore((s) => s.mode);

  function close() {
    soundManager.play("uiClick");
    setScreen(mode ? "playing" : "menu");
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_20%,#132033,transparent_60%),linear-gradient(180deg,#05070d,#0a0e17)] p-4">
      <div className="glass-panel bs-pop-in w-full max-w-2xl p-6">
        <h2 className="mb-1 text-2xl font-black text-white">How to Play</h2>
        <p className="mb-5 text-sm text-white/60">
          Eliminate your opponent five times to win the match. Shoot, build cover, and heal to survive.
        </p>

        <div className="mb-6 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
          {CONTROLS.map(([key, action]) => (
            <div key={key} className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-2 text-sm">
              <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-xs text-bs-cyan">{key}</span>
              <span className="ml-3 text-right text-white/75">{action}</span>
            </div>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/60">
            <p className="mb-1 font-bold text-bs-cyan">Shield Potion</p>
            Restores 50 shield over a few seconds. Cancels if you fight or build.
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/60">
            <p className="mb-1 font-bold text-bs-orange">Medkit</p>
            Restores health to full — slower, and unusable at full health.
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/60">
            <p className="mb-1 font-bold text-white">Building</p>
            Walls, floors and ramps snap to a grid and block bullets. Limited active builds each.
          </div>
        </div>

        <button className="btn-primary w-full" onClick={close}>
          Got it — Let&apos;s Go
        </button>
      </div>
    </div>
  );
}
