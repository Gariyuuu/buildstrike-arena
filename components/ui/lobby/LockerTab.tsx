"use client";

import { useState } from "react";
import { useInventoryStore } from "@/stores/inventoryStore";
import { SKINS, RARITY_COLOR, type SkinDefinition } from "@/game/config/cosmetics";
import { soundManager } from "@/game/audio/soundManager";

export function LockerTab() {
  const owned = useInventoryStore((s) => s.owned);
  const equippedSkin = useInventoryStore((s) => s.equipped.skin);
  const equip = useInventoryStore((s) => s.equip);
  const [selected, setSelected] = useState<SkinDefinition>(SKINS[equippedSkin] ?? SKINS["skin-default"]);

  const ownedSkins = Object.values(SKINS).filter((s) => owned.includes(s.id));

  return (
    <div className="flex flex-col gap-5 sm:flex-row">
      <div className="glass-panel flex-1 p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">
          Character ({ownedSkins.length} owned)
        </p>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {ownedSkins.map((skin) => {
            const isEquipped = equippedSkin === skin.id;
            const isSelected = selected.id === skin.id;
            return (
              <button
                key={skin.id}
                onClick={() => {
                  setSelected(skin);
                  soundManager.play("uiClick");
                }}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center transition ${
                  isSelected ? "border-bs-cyan bg-bs-cyan/10" : "border-white/10 bg-black/25 hover:border-white/25"
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-md" style={{ background: `radial-gradient(circle, ${skin.skin.jacketColor}55, transparent 70%)` }}>
                  <div className="h-8 w-8 rounded-sm" style={{ background: skin.skin.jacketColor }} />
                </div>
                <p className="truncate text-[11px] font-semibold text-white/80">{skin.name}</p>
                {isEquipped && <p className="text-[9px] font-bold uppercase text-bs-cyan">Equipped</p>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-panel w-full p-5 sm:w-72">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: RARITY_COLOR[selected.rarity] }}>
          {selected.rarity}
        </p>
        <h3 className="mt-1 text-2xl font-black text-white">{selected.name}</h3>
        <p className="mt-2 text-sm text-white/60">{selected.description}</p>
        <button
          className="btn-primary mt-5 w-full"
          disabled={equippedSkin === selected.id}
          onClick={() => {
            equip("skin", selected.id);
            soundManager.play("equip");
          }}
        >
          {equippedSkin === selected.id ? "Equipped" : "Equip"}
        </button>
      </div>
    </div>
  );
}
