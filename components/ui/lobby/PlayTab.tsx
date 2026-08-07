"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useNetworkStore } from "@/stores/networkStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useProfileStore } from "@/stores/profileStore";
import { createRoomCode } from "@/game/networking/client";
import type { BotDifficulty } from "@/game/config/bots";
import { soundManager } from "@/game/audio/soundManager";
import { LoadoutPicker } from "@/components/ui/lobby/LoadoutPicker";
import { useBRStore, type BRMapId } from "@/stores/brStore";
import { SQUAD_SIZE_LABEL, type SquadSize } from "@/game/config/battleRoyale";

const DIFFICULTIES: { id: BotDifficulty; label: string; desc: string }[] = [
  { id: "easy", label: "Easy", desc: "Slower reactions, forgiving aim" },
  { id: "normal", label: "Normal", desc: "Balanced challenge" },
  { id: "hard", label: "Hard", desc: "Sharp aim, aggressive plays" },
  { id: "expert", label: "Expert", desc: "Near-perfect aim, optimal weapon picks" },
];

const BR_MAPS: { id: BRMapId; label: string; desc: string }[] = [
  { id: "tiltedVibes", label: "Tilted Vibes", desc: "A dense cluster of leaning towers around the center" },
  { id: "desert", label: "Sand Wastes", desc: "Open dunes, rock cover, and a canyon arena at the center" },
  { id: "neonDistrict", label: "Neon District", desc: "A dense neon mega-city grid split by two wide avenues" },
];

export function PlayTab() {
  const setScreen = useGameStore((s) => s.setScreen);
  const setMode = useGameStore((s) => s.setMode);
  const hasSeenControls = useGameStore((s) => s.hasSeenControls);
  const markControlsSeen = useGameStore((s) => s.markControlsSeen);
  const botDifficulty = useSettingsStore((s) => s.botDifficulty);
  const setSettings = useSettingsStore((s) => s.set);
  const displayName = useProfileStore((s) => s.displayName);

  const [tab, setTab] = useState<"bot" | "online" | "training" | "br">("bot");
  const [joinCode, setJoinCode] = useState("");
  const [squadSize, setSquadSize] = useState<SquadSize>(1);
  const [brMap, setBrMap] = useState<BRMapId>("tiltedVibes");

  function goPlay(mode: "bot" | "online" | "training") {
    soundManager.resume();
    soundManager.play("uiClick");
    setMode(mode);
    if (mode !== "training" && !hasSeenControls) {
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
    useNetworkStore.getState().setPlayerName(displayName || "Recruit");
    goPlay("online");
  }

  function joinRoom() {
    if (joinCode.trim().length < 4) return;
    useNetworkStore.getState().reset();
    useNetworkStore.getState().setRoomCode(joinCode.trim().toUpperCase());
    useNetworkStore.getState().setIsHost(false);
    useNetworkStore.getState().setPlayerName(displayName || "Recruit");
    goPlay("online");
  }

  function deployBattleRoyale() {
    soundManager.resume();
    soundManager.play("uiClick");
    useBRStore.getState().deploy(squadSize, brMap);
    setMode("battleRoyale");
    setScreen("playing");
  }

  return (
    <div className="glass-panel w-full max-w-md p-6">
      <div className="mb-5 flex rounded-xl bg-black/30 p-1 text-sm font-semibold">
        {(["bot", "online", "br", "training"] as const).map((t) => (
          <button
            key={t}
            className={`flex-1 rounded-lg py-2 transition ${tab === t ? "bg-bs-cyan text-[#04141a]" : "text-white/70 hover:text-white"}`}
            onClick={() => setTab(t)}
          >
            {t === "bot" ? "1v1 Bot" : t === "online" ? "Private 1v1" : t === "br" ? "Battle Royale" : "Training"}
          </button>
        ))}
      </div>

      {tab === "bot" && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Bot difficulty</p>
            <div className="grid grid-cols-4 gap-2">
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
          <LoadoutPicker />
          <button className="btn-primary w-full" onClick={() => goPlay("bot")}>
            Play vs Bot
          </button>
        </div>
      )}

      {tab === "online" && (
        <div className="flex flex-col gap-4">
          <LoadoutPicker />
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

      {tab === "br" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-white/60">
            Up to 20 players — any seats you don&apos;t fill with friends get filled with bots. Loot weapons and
            heals from the ground and chests, and stay inside the shrinking zone.
          </p>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Map</p>
            <div className="grid grid-cols-3 gap-2">
              {BR_MAPS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setBrMap(m.id)}
                  title={m.desc}
                  className={`rounded-lg border px-2 py-2 text-left text-sm font-semibold transition ${
                    brMap === m.id ? "border-bs-cyan bg-bs-cyan/15 text-bs-cyan" : "border-white/10 bg-white/5 text-white/70 hover:border-white/25"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Squad size</p>
            <div className="grid grid-cols-4 gap-2">
              {([1, 2, 3, 4] as SquadSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setSquadSize(size)}
                  className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                    squadSize === size ? "border-bs-cyan bg-bs-cyan/15 text-bs-cyan" : "border-white/10 bg-white/5 text-white/70 hover:border-white/25"
                  }`}
                >
                  {SQUAD_SIZE_LABEL[size]}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" onClick={deployBattleRoyale}>
            Deploy
          </button>
        </div>
      )}

      {tab === "training" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-white/60">
            Spawn alone in the arena. Shoot targets, place builds freely, and reset instantly — no score, no
            matchmaking.
          </p>
          <LoadoutPicker />
          <button className="btn-primary w-full" onClick={() => goPlay("training")}>
            Enter Training Arena
          </button>
        </div>
      )}
    </div>
  );
}
