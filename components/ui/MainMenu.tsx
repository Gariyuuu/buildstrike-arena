"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useNetworkStore } from "@/stores/networkStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { createRoomCode } from "@/game/networking/client";
import type { BotDifficulty } from "@/game/config/bots";
import { soundManager } from "@/game/audio/soundManager";

const DIFFICULTIES: { id: BotDifficulty; label: string; desc: string }[] = [
  { id: "easy", label: "Easy", desc: "Slower reactions, forgiving aim" },
  { id: "normal", label: "Normal", desc: "Balanced challenge" },
  { id: "hard", label: "Hard", desc: "Sharp aim, aggressive plays" },
];

export function MainMenu() {
  const setScreen = useGameStore((s) => s.setScreen);
  const setMode = useGameStore((s) => s.setMode);
  const hasSeenControls = useGameStore((s) => s.hasSeenControls);
  const markControlsSeen = useGameStore((s) => s.markControlsSeen);
  const botDifficulty = useSettingsStore((s) => s.botDifficulty);
  const setSettings = useSettingsStore((s) => s.set);

  const [name, setName] = useState("Recruit");
  const [joinCode, setJoinCode] = useState("");
  const [tab, setTab] = useState<"bot" | "online">("bot");

  function goPlay(mode: "bot" | "online") {
    soundManager.resume();
    soundManager.play("uiClick");
    setMode(mode);
    if (!hasSeenControls) {
      markControlsSeen();
      setScreen("instructions");
      return;
    }
    setScreen("playing");
  }

  function createRoom() {
    const code = createRoomCode();
    useNetworkStore.getState().reset();
    useNetworkStore.getState().setRoomCode(code);
    useNetworkStore.getState().setIsHost(true);
    useNetworkStore.getState().setPlayerName(name.trim() || "Recruit");
    goPlay("online");
  }

  function joinRoom() {
    if (joinCode.trim().length < 4) return;
    useNetworkStore.getState().reset();
    useNetworkStore.getState().setRoomCode(joinCode.trim().toUpperCase());
    useNetworkStore.getState().setIsHost(false);
    useNetworkStore.getState().setPlayerName(name.trim() || "Recruit");
    goPlay("online");
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_50%_20%,#132033,transparent_60%),linear-gradient(180deg,#05070d,#0a0e17)] px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 bs-pop-in">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="BuildStrike Arena logo" className="h-14 w-14 rounded-2xl shadow-[0_0_30px_rgba(51,230,255,0.35)]" />
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              BUILD<span className="text-bs-cyan">STRIKE</span>
            </h1>
            <p className="text-sm font-semibold tracking-[0.3em] text-bs-orange">ARENA</p>
          </div>
        </div>
        <p className="max-w-md text-center text-sm text-white/60">
          Fast 1v1 build-and-shoot duels. Original arena, original rules — no download required.
        </p>
      </div>

      <div className="glass-panel w-full max-w-md p-6 bs-pop-in">
        <div className="mb-5 flex rounded-xl bg-black/30 p-1 text-sm font-semibold">
          <button
            className={`flex-1 rounded-lg py-2 transition ${tab === "bot" ? "bg-bs-cyan text-[#04141a]" : "text-white/70 hover:text-white"}`}
            onClick={() => setTab("bot")}
          >
            Bot Duel
          </button>
          <button
            className={`flex-1 rounded-lg py-2 transition ${tab === "online" ? "bg-bs-cyan text-[#04141a]" : "text-white/70 hover:text-white"}`}
            onClick={() => setTab("online")}
          >
            Online 1v1
          </button>
        </div>

        {tab === "bot" ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Bot difficulty</p>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSettings({ botDifficulty: d.id })}
                    className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                      botDifficulty === d.id
                        ? "border-bs-cyan bg-bs-cyan/15 text-bs-cyan"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/25"
                    }`}
                    title={d.desc}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary w-full" onClick={() => goPlay("bot")}>
              Play vs Bot
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-white/50">
              Your name
              <input
                value={name}
                maxLength={16}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-normal normal-case text-white outline-none focus:border-bs-cyan"
              />
            </label>
            <button className="btn-primary w-full" onClick={createRoom}>
              Create Private Room
            </button>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <div className="h-px flex-1 bg-white/10" />
              or join a friend
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="flex gap-2">
              <input
                value={joinCode}
                maxLength={6}
                placeholder="ROOM CODE"
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-center text-sm font-mono tracking-[0.3em] text-white outline-none focus:border-bs-cyan"
              />
              <button className="btn-orange" onClick={joinRoom} disabled={joinCode.trim().length < 4}>
                Join
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-3 bs-pop-in">
        <button className="btn-secondary" onClick={() => setScreen("instructions")}>
          Instructions
        </button>
        <button className="btn-secondary" onClick={() => setScreen("settings")}>
          Settings
        </button>
      </div>

      <p className="mt-8 max-w-lg text-center text-[11px] text-white/30">
        Keyboard and mouse recommended. All characters, weapons and sounds are original assets created for BuildStrike Arena.
      </p>
    </div>
  );
}
