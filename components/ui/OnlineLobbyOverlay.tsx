"use client";

import { useState } from "react";
import { useNetworkStore } from "@/stores/networkStore";
import { getActiveClient } from "@/game/networking/activeClient";
import { soundManager } from "@/game/audio/soundManager";

export function OnlineLobbyOverlay() {
  const matchStarted = useNetworkStore((s) => s.matchStarted);
  const status = useNetworkStore((s) => s.status);
  const roomCode = useNetworkStore((s) => s.roomCode);
  const isHost = useNetworkStore((s) => s.isHost);
  const opponentPresent = useNetworkStore((s) => s.opponentPresent);
  const opponentReady = useNetworkStore((s) => s.opponentReady);
  const localReady = useNetworkStore((s) => s.localReady);
  const errorMessage = useNetworkStore((s) => s.errorMessage);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel bs-pop-in w-full max-w-sm p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">
          {isHost ? "Private Room" : "Joining Room"}
        </p>
        {roomCode && (
          <button onClick={copyCode} className="mt-3 block w-full rounded-lg border border-bs-cyan/40 bg-bs-cyan/10 py-3 font-mono text-3xl font-black tracking-[0.4em] text-bs-cyan transition hover:bg-bs-cyan/20">
            {roomCode}
          </button>
        )}
        <p className="mt-2 text-[11px] text-white/40">{copied ? "Copied!" : isHost ? "Share this code with a friend to invite them" : "Connecting to host…"}</p>

        <div className="mt-5 flex justify-center gap-6 text-sm">
          <StatusPip label="You" ready={localReady} />
          <StatusPip label="Opponent" ready={opponentReady} present={opponentPresent} />
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

function StatusPip({ label, ready, present = true }: { label: string; ready: boolean; present?: boolean }) {
  const color = !present ? "#555" : ready ? "#33e6ff" : "#ff8a33";
  const text = !present ? "Absent" : ready ? "Ready" : "Not Ready";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-full bs-pulse" style={{ background: color }} />
      <span className="text-[11px] font-semibold text-white/60">{label}</span>
      <span className="text-[10px] font-bold" style={{ color }}>
        {text}
      </span>
    </div>
  );
}
