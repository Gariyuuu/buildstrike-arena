"use client";

import { useSettingsStore } from "@/stores/settingsStore";
import { usePlayerStore } from "@/stores/playerStore";

export function Crosshair() {
  const size = useSettingsStore((s) => s.crosshairSize);
  const opacity = useSettingsStore((s) => s.crosshairOpacity);
  const isBuildMode = usePlayerStore((s) => s.local.isBuildMode);
  const isReloading = usePlayerStore((s) => s.local.isReloading);

  const color = isBuildMode ? "#33e6ff" : isReloading ? "#ff8a33" : "#ffffff";
  const gap = size + 3;
  const thickness = 2;
  const len = size;

  const lines = [
    { style: { left: -gap - len, top: -thickness / 2, width: len, height: thickness } },
    { style: { left: gap, top: -thickness / 2, width: len, height: thickness } },
    { style: { top: -gap - len, left: -thickness / 2, height: len, width: thickness } },
    { style: { top: gap, left: -thickness / 2, height: len, width: thickness } },
  ];

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0" style={{ opacity }}>
      {lines.map((l, i) => (
        <div key={i} className="absolute rounded-full" style={{ ...l.style, background: color }} />
      ))}
      <div
        className="absolute rounded-full"
        style={{ left: -1.5, top: -1.5, width: 3, height: 3, background: color }}
      />
    </div>
  );
}
