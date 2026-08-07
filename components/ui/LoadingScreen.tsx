"use client";

import { LobbyBackground } from "@/components/ui/LobbyBackground";

export function LoadingScreen({ label = "Loading Arena..." }: { label?: string }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
      <LobbyBackground />
      <img src="/logo.svg" alt="BuildStrike Arena" className="relative h-16 w-16 bs-pulse rounded-2xl" />
      <div className="relative h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-[bs-loading_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-bs-cyan to-bs-orange" />
      </div>
      <p className="relative text-sm font-semibold tracking-wide text-white/60">{label}</p>
      <style>{`
        @keyframes bs-loading {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(210%); }
        }
      `}</style>
    </div>
  );
}
