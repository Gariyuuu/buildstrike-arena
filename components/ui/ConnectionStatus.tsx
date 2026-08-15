"use client";

import { ThinkingOrb } from "thinking-orbs";
import { useNetworkStore } from "@/stores/networkStore";
import { useMatchStore } from "@/stores/matchStore";

export function ConnectionStatus() {
  const status = useNetworkStore((s) => s.status);
  const ping = useNetworkStore((s) => s.ping);
  const matchStarted = useNetworkStore((s) => s.matchStarted);
  const opponentDisconnected = useMatchStore((s) => s.opponentDisconnected);

  const color = status === "connected" ? "#33e6ff" : status === "connecting" ? "#ff8a33" : "#ff4d4d";

  return (
    <>
      <div className="pointer-events-none absolute right-5 top-5 flex items-center gap-2 rounded-md bg-black/40 px-2.5 py-1 text-xs font-mono">
        {status === "connecting" ? (
          <ThinkingOrb state="connecting" size={20} aria-label="Connecting" />
        ) : (
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        )}
        <span className="capitalize text-white/70">{status}</span>
        {status === "connected" && <span className="text-white/40">· {ping}ms</span>}
      </div>

      {matchStarted && opponentDisconnected && (
        <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 rounded-lg bg-bs-red/20 px-4 py-2 text-sm font-semibold text-bs-red bs-pulse">
          Opponent disconnected — waiting to reconnect…
        </div>
      )}
      {status === "disconnected" && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/70 px-6 py-4 text-center">
          <p className="text-lg font-bold text-bs-red">Connection Lost</p>
          <p className="text-xs text-white/50">Attempting to reconnect…</p>
        </div>
      )}
    </>
  );
}
