"use client";

/**
 * Shared decorative backdrop for every non-gameplay screen (Lobby, Settings,
 * Instructions, Loading) — a tech-grid + slowly drifting glow orbs, all CSS/
 * SVG so it stays consistent with the project's no-external-assets rule.
 * Pure background: `pointer-events-none`, sits behind `children` via z-index.
 */
export function LobbyBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,#132033,transparent_60%),linear-gradient(180deg,#05070d,#0a0e17)]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(51,230,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(51,230,255,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(circle at 50% 30%, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 30%, black, transparent 75%)",
        }}
      />
      <div className="bs-drift-a absolute -left-20 top-10 h-72 w-72 rounded-full bg-bs-cyan/10 blur-3xl" />
      <div className="bs-drift-b absolute right-0 top-1/3 h-96 w-96 rounded-full bg-bs-orange/10 blur-3xl" />
      <div className="bs-drift-a absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#b56bff]/10 blur-3xl" style={{ animationDelay: "-6s" }} />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#05070d] to-transparent" />
      <style>{`
        @keyframes bs-drift-a { 0%,100% { transform: translate(0,0); } 50% { transform: translate(24px,-18px); } }
        @keyframes bs-drift-b { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-30px,20px); } }
        .bs-drift-a { animation: bs-drift-a 14s ease-in-out infinite; }
        .bs-drift-b { animation: bs-drift-b 18s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
