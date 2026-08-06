"use client";

export function LoadingScreen({ label = "Loading Arena..." }: { label?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_50%_20%,#132033,transparent_60%),linear-gradient(180deg,#05070d,#0a0e17)]">
      <img src="/logo.svg" alt="BuildStrike Arena" className="h-16 w-16 bs-pulse rounded-2xl" />
      <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-[bs-loading_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-bs-cyan to-bs-orange" />
      </div>
      <p className="text-sm font-semibold tracking-wide text-white/60">{label}</p>
      <style>{`
        @keyframes bs-loading {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(210%); }
        }
      `}</style>
    </div>
  );
}
