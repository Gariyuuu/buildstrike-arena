"use client";

import { useEffect } from "react";
import { useInventoryStore } from "@/stores/inventoryStore";
import { usePlayerStore } from "@/stores/playerStore";
import { EMOTES } from "@/game/config/cosmetics";
import { soundManager } from "@/game/audio/soundManager";

/** Radial-ish emote picker for the 4 equipped emote slots — opened with B, closed by selecting one or pressing B/Escape again. */
export function EmoteWheel({ onClose }: { onClose: () => void }) {
  const equippedEmotes = useInventoryStore((s) => s.equipped.emote);

  function play(id: string | null) {
    if (!id) return;
    usePlayerStore.getState().playEmote(id);
    soundManager.play("emote");
    onClose();
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const num = Number(e.key);
      if (num >= 1 && num <= 4) play(equippedEmotes[num - 1]);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equippedEmotes]);

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="glass-panel bs-pop-in grid grid-cols-2 gap-3 p-6" onClick={(e) => e.stopPropagation()}>
        {[0, 1, 2, 3].map((slot) => {
          const id = equippedEmotes[slot];
          const def = id ? EMOTES[id] : null;
          return (
            <button
              key={slot}
              disabled={!def}
              onClick={() => play(id)}
              className={`flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border text-center transition ${
                def ? "border-white/15 bg-black/30 hover:border-bs-cyan hover:bg-bs-cyan/10" : "border-white/5 bg-black/10 opacity-30"
              }`}
            >
              <span className="text-[10px] font-bold text-white/40">{slot + 1}</span>
              <span className="text-xs font-semibold text-white">{def?.name ?? "Empty"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
