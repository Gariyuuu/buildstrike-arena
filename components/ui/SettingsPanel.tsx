"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useSettingsStore, type GraphicsQuality } from "@/stores/settingsStore";
import { useKeybindsStore, KEYBIND_LABELS, formatKeyLabel, type KeybindAction } from "@/stores/keybindsStore";
import { normalizeKey } from "@/hooks/useKeyboard";
import type { BotDifficulty } from "@/game/config/bots";
import { soundManager } from "@/game/audio/soundManager";
import { RedeemCodePanel } from "@/components/ui/RedeemCodePanel";
import { LobbyBackground } from "@/components/ui/LobbyBackground";

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <div className="flex justify-between text-white/70">
        <span>{label}</span>
        <span className="font-mono text-bs-cyan">{display ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#33e6ff]"
      />
    </label>
  );
}

function KeybindButton({ action }: { action: KeybindAction }) {
  const bound = useKeybindsStore((s) => s.binds[action]);
  const setBind = useKeybindsStore((s) => s.setBind);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!capturing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.code === "Escape") {
        setCapturing(false);
        return;
      }
      setBind(action, normalizeKey(e));
      setCapturing(false);
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [capturing, action, setBind]);

  return (
    <div className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-2 text-sm">
      <span className="text-white/75">{KEYBIND_LABELS[action]}</span>
      <button
        onClick={() => setCapturing(true)}
        className={`min-w-16 rounded-md border px-2 py-1 font-mono text-xs transition ${
          capturing ? "border-bs-orange bg-bs-orange/15 text-bs-orange" : "border-white/15 bg-white/5 text-bs-cyan hover:border-bs-cyan/50"
        }`}
      >
        {capturing ? "Press a key…" : formatKeyLabel(bound)}
      </button>
    </div>
  );
}

const KEYBIND_ACTIONS: KeybindAction[] = [
  "buildWall",
  "buildFloor",
  "buildRamp",
  "toggleBuildMode",
  "rotateBuild",
  "reload",
  "melee",
  "sprint",
  "jump",
  "emoteWheel",
  "interact",
];

export function SettingsPanel({ onBack }: { onBack?: () => void }) {
  const setScreen = useGameStore((s) => s.setScreen);
  const s = useSettingsStore();
  const back = onBack ?? (() => setScreen("menu"));

  function requestFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-y-auto p-4">
      <LobbyBackground />
      <div className="glass-panel bs-pop-in relative w-full max-w-xl p-6">
        <h2 className="mb-5 text-2xl font-black text-white">Settings</h2>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Slider label="Mouse Sensitivity" value={s.mouseSensitivity} min={0.1} max={3} step={0.05} onChange={(v) => s.set({ mouseSensitivity: v })} />
          <Slider label="Field of View" value={s.fov} min={60} max={100} step={1} onChange={(v) => s.set({ fov: v })} />
          <Slider label="Master Volume" value={Math.round(s.masterVolume * 100)} min={0} max={100} step={1} display={`${Math.round(s.masterVolume * 100)}%`} onChange={(v) => s.set({ masterVolume: v / 100 })} />
          <Slider label="SFX Volume" value={Math.round(s.sfxVolume * 100)} min={0} max={100} step={1} display={`${Math.round(s.sfxVolume * 100)}%`} onChange={(v) => s.set({ sfxVolume: v / 100 })} />
          <Slider label="Crosshair Size" value={s.crosshairSize} min={2} max={16} step={1} onChange={(v) => s.set({ crosshairSize: v })} />
          <Slider label="Crosshair Opacity" value={Math.round(s.crosshairOpacity * 100)} min={10} max={100} step={5} display={`${Math.round(s.crosshairOpacity * 100)}%`} onChange={(v) => s.set({ crosshairOpacity: v / 100 })} />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Graphics Quality</p>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as GraphicsQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => s.set({ graphicsQuality: q })}
                  className={`rounded-lg border px-2 py-2 text-sm font-semibold capitalize transition ${
                    s.graphicsQuality === q ? "border-bs-cyan bg-bs-cyan/15 text-bs-cyan" : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Bot Difficulty</p>
            <div className="grid grid-cols-4 gap-2">
              {(["easy", "normal", "hard", "expert"] as BotDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => s.set({ botDifficulty: d })}
                  className={`rounded-lg border px-2 py-2 text-sm font-semibold capitalize transition ${
                    s.botDifficulty === d ? "border-bs-orange bg-bs-orange/15 text-bs-orange" : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" checked={s.shadowsEnabled} onChange={(e) => s.set({ shadowsEnabled: e.target.checked })} className="h-4 w-4 accent-[#33e6ff]" />
            Shadows
          </label>
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" checked={s.showFps} onChange={(e) => s.set({ showFps: e.target.checked })} className="h-4 w-4 accent-[#33e6ff]" />
            Show FPS counter
          </label>
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" checked={s.muted} onChange={(e) => s.set({ muted: e.target.checked })} className="h-4 w-4 accent-[#33e6ff]" />
            Mute all sound
          </label>
          <button className="btn-secondary ml-auto text-sm" onClick={requestFullscreen}>
            Toggle Fullscreen
          </button>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Keybinds</p>
            <button className="text-xs font-semibold text-bs-cyan hover:underline" onClick={() => useKeybindsStore.getState().reset()}>
              Reset Keybinds
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {KEYBIND_ACTIONS.map((action) => (
              <KeybindButton key={action} action={action} />
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Redeem Code</p>
          <RedeemCodePanel />
        </div>

        <div className="flex gap-3">
          <button
            className="btn-secondary flex-1"
            onClick={() => {
              soundManager.play("uiClick");
              back();
            }}
          >
            Back
          </button>
          <button className="btn-secondary flex-1" onClick={() => s.reset()}>
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
