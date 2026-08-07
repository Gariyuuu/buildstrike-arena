"use client";

import { useMatchStore } from "@/stores/matchStore";
import { useGameStore } from "@/stores/gameStore";
import { useNetworkStore } from "@/stores/networkStore";
import { MATCH_CONFIG } from "@/game/config/match";

export function Scoreboard() {
  const score = useMatchStore((s) => s.score);
  const round = useMatchStore((s) => s.round);
  const phase = useMatchStore((s) => s.phase);
  const countdown = useMatchStore((s) => s.countdown);
  const roundWinner = useMatchStore((s) => s.roundWinner);
  const mode = useGameStore((s) => s.mode);
  const onlineRoundsToWin = useNetworkStore((s) => s.matchSettings.roundsToWin);
  const roundsToWin = mode === "online" ? onlineRoundsToWin : MATCH_CONFIG.roundsToWin;

  return (
    <>
      <div className="pointer-events-none absolute left-1/2 top-5 flex -translate-x-1/2 items-center gap-4 glass-panel px-5 py-2">
        <ScorePip label="YOU" value={score.local} />
        <div className="text-center text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Round {round}
          <br />
          <span className="text-white/25">first to {roundsToWin}</span>
        </div>
        <ScorePip label="OPP" value={score.opponent} accent="#ff8a33" />
      </div>

      {phase === "countdown" && <CountdownBanner countdown={countdown} />}
      {phase === "round-end" && roundWinner && <RoundEndBanner winner={roundWinner} />}
    </>
  );
}

function ScorePip({ label, value, accent = "#33e6ff" }: { label: string; value: number; accent?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] font-bold tracking-widest text-white/40">{label}</span>
      <span className="font-mono text-2xl font-black" style={{ color: accent }}>
        {value}
      </span>
    </div>
  );
}

function CountdownBanner({ countdown }: { countdown: number }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2">
      <p key={countdown} className="bs-pop-in text-7xl font-black text-white drop-shadow-[0_0_20px_rgba(51,230,255,0.6)]">
        {countdown > 0 ? countdown : "FIGHT"}
      </p>
    </div>
  );
}

function RoundEndBanner({ winner }: { winner: "local" | "opponent" }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 bs-pop-in text-center">
      <p className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(51,230,255,0.5)]">
        {winner === "local" ? "Round Won" : "Round Lost"}
      </p>
      <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-white/50">Resetting arena…</p>
    </div>
  );
}
