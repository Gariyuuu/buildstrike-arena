"use client";

import { useState } from "react";
import { useNetworkStore, type MatchSettings } from "@/stores/networkStore";
import { useProfileStore } from "@/stores/profileStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useLoadoutStore } from "@/stores/loadoutStore";
import { getActiveClient } from "@/game/networking/activeClient";
import { soundManager } from "@/game/audio/soundManager";
import { SKINS, DEFAULT_SKIN_ID } from "@/game/config/cosmetics";
import { WEAPONS } from "@/game/config/weapons";

const ROUND_TARGETS = [3, 5, 10];

export function OnlineLobbyOverlay() {
  const matchStarted = useNetworkStore((s) => s.matchStarted);
  const status = useNetworkStore((s) => s.status);
  const roomCode = useNetworkStore((s) => s.roomCode);
  const isHost = useNetworkStore((s) => s.isHost);
  const opponentPresent = useNetworkStore((s) => s.opponentPresent);
  const opponentReady = useNetworkStore((s) => s.opponentReady);
  const opponentInfo = useNetworkStore((s) => s.opponentInfo);
  const matchSettings = useNetworkStore((s) => s.matchSettings);
  const localReady = useNetworkStore((s) => s.localReady);
  const errorMessage = useNetworkStore((s) => s.errorMessage);
  const [copied, setCopied] = useState(false);

  const displayName = useProfileStore((s) => s.displayName);
  const level = useProfileStore((s) => s.level);
  const localSkinId = useInventoryStore((s) => s.equipped.skin);
  const loadout = useLoadoutStore();

  if (matchStarted) return null;

  function ready() {
    soundManager.play("uiClick");
    useNetworkStore.getState().setLocalReady(true);
    getActiveClient()?.send({ type: "ready" });
  }

  function copyCode() {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function updateSettings(patch: Partial<MatchSettings>) {
    if (!isHost) return;
    const next = { ...matchSettings, ...patch };
    useNetworkStore.getState().setMatchSettings(next);
    soundManager.play("uiClick");
    getActiveClient()?.send({ type: "hostSettings", ...next });
  }

  const localSkin = SKINS[localSkinId] ?? SKINS[DEFAULT_SKIN_ID];
  const opponentSkin = opponentInfo ? SKINS[opponentInfo.skinId] : undefined;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/70 py-8 backdrop-blur-sm">
      <div className="glass-panel bs-pop-in w-full max-w-xl p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">
          {isHost ? "Private Room" : "Joining Room"}
        </p>
        {roomCode && (
          <button onClick={copyCode} className="mt-3 block w-full rounded-lg border border-bs-cyan/40 bg-bs-cyan/10 py-3 font-mono text-3xl font-black tracking-[0.4em] text-bs-cyan transition hover:bg-bs-cyan/20">
            {roomCode}
          </button>
        )}
        <p className="mt-2 text-[11px] text-white/40">{copied ? "Copied!" : isHost ? "Share this code with a friend to invite them" : "Connecting to host…"}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-left">
          <PlayerCard
            label="You"
            name={displayName}
            level={level}
            swatch={localSkin.skin.accentColor}
            primary={WEAPONS[loadout.primary].name}
            secondary={WEAPONS[loadout.secondary].name}
            ready={localReady}
            present
          />
          <PlayerCard
            label="Opponent"
            name={opponentInfo?.displayName ?? "—"}
            level={opponentInfo?.level ?? 0}
            swatch={opponentSkin?.skin.accentColor}
            primary={opponentInfo ? WEAPONS[opponentInfo.primaryWeapon].name : "—"}
            secondary={opponentInfo ? WEAPONS[opponentInfo.secondaryWeapon].name : "—"}
            ready={opponentReady}
            present={opponentPresent}
          />
        </div>

        <div className="mt-5 rounded-lg border border-white/10 bg-black/25 p-4 text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">Match Settings{!isHost && " (host-controlled)"}</p>

          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-white/70">Rounds to Win</span>
            <div className="flex gap-1.5">
              {ROUND_TARGETS.map((n) => (
                <button
                  key={n}
                  disabled={!isHost}
                  onClick={() => updateSettings({ roundsToWin: n })}
                  className={`h-8 w-8 rounded-md font-mono text-sm font-bold transition ${
                    matchSettings.roundsToWin === n
                      ? "bg-bs-cyan text-[#04141a]"
                      : "bg-white/5 text-white/50 disabled:opacity-40"
                  } ${isHost ? "hover:brightness-110" : "cursor-default"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <SettingToggle label="Headshots" value={matchSettings.headshotsEnabled} disabled={!isHost} onToggle={() => updateSettings({ headshotsEnabled: !matchSettings.headshotsEnabled })} />
          <SettingToggle label="Healing Items" value={matchSettings.healingEnabled} disabled={!isHost} onToggle={() => updateSettings({ healingEnabled: !matchSettings.healingEnabled })} />
          <SettingToggle label="Infinite Builds" value={matchSettings.infiniteBuilds} disabled={!isHost} onToggle={() => updateSettings({ infiniteBuilds: !matchSettings.infiniteBuilds })} last />
        </div>

        {errorMessage && <p className="mt-4 text-sm font-semibold text-bs-red">{errorMessage}</p>}

        <button
          className="btn-primary mt-6 w-full"
          onClick={ready}
          disabled={localReady || status !== "connected" || !opponentPresent}
        >
          {localReady ? "Waiting for opponent…" : status !== "connected" ? "Connecting…" : !opponentPresent ? "Waiting for opponent to join…" : "Ready"}
        </button>
      </div>
    </div>
  );
}

function PlayerCard({
  label,
  name,
  level,
  swatch,
  primary,
  secondary,
  ready,
  present,
}: {
  label: string;
  name: string;
  level: number;
  swatch?: string;
  primary: string;
  secondary: string;
  ready: boolean;
  present: boolean;
}) {
  const color = !present ? "#555" : ready ? "#33e6ff" : "#ff8a33";
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</span>
        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color }}>
          <span className="h-1.5 w-1.5 rounded-full bs-pulse" style={{ background: color }} />
          {!present ? "Absent" : ready ? "Ready" : "Not Ready"}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="h-6 w-6 shrink-0 rounded-full border border-white/20" style={{ background: swatch ?? "#333" }} />
        <span className="truncate text-sm font-bold text-white">{present ? name : "Waiting…"}</span>
        {present && <span className="ml-auto shrink-0 rounded bg-bs-cyan/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-bs-cyan">Lv{level}</span>}
      </div>
      {present && (
        <p className="mt-1.5 truncate text-[11px] text-white/40">
          {primary} / {secondary}
        </p>
      )}
    </div>
  );
}

function SettingToggle({ label, value, disabled, onToggle, last }: { label: string; value: boolean; disabled: boolean; onToggle: () => void; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${last ? "" : "border-b border-white/5"}`}>
      <span className="text-sm text-white/70">{label}</span>
      <button
        disabled={disabled}
        onClick={onToggle}
        className={`relative h-5 w-9 rounded-full transition ${value ? "bg-bs-cyan/70" : "bg-white/10"} ${disabled ? "cursor-default" : ""}`}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          style={{ left: value ? "18px" : "2px" }}
        />
      </button>
    </div>
  );
}
