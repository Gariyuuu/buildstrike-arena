"use client";

import { useMemo, useState } from "react";
import { useInventoryStore } from "@/stores/inventoryStore";
import { usePlayerStore } from "@/stores/playerStore";
import { SKINS, WEAPON_WRAPS, BACK_ACCESSORIES, EMOTES, BANNERS, ICONS, PICKAXES, RARITY_COLOR, type CosmeticCategory, type Rarity } from "@/game/config/cosmetics";
import { soundManager } from "@/game/audio/soundManager";

interface LockerItem {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  previewColor: string;
  glyph?: string;
}

const CATEGORIES: { id: CosmeticCategory; label: string }[] = [
  { id: "skin", label: "Character" },
  { id: "weaponWrap", label: "Weapon Wrap" },
  { id: "pickaxe", label: "Pickaxe" },
  { id: "backAccessory", label: "Back" },
  { id: "emote", label: "Emote" },
  { id: "banner", label: "Banner" },
  { id: "icon", label: "Icon" },
];

function itemsForCategory(category: CosmeticCategory): LockerItem[] {
  switch (category) {
    case "skin":
      return Object.values(SKINS).map((s) => ({ id: s.id, name: s.name, rarity: s.rarity, description: s.description, previewColor: s.skin.jacketColor ?? "#3aa0c9" }));
    case "weaponWrap":
      return Object.values(WEAPON_WRAPS).map((w) => ({ id: w.id, name: w.name, rarity: w.rarity, description: w.description, previewColor: w.bodyColor }));
    case "pickaxe":
      return Object.values(PICKAXES).map((p) => ({ id: p.id, name: p.name, rarity: p.rarity, description: p.description, previewColor: p.headColor }));
    case "backAccessory":
      return Object.values(BACK_ACCESSORIES).map((b) => ({ id: b.id, name: b.name, rarity: b.rarity, description: b.description, previewColor: b.color }));
    case "emote":
      return Object.values(EMOTES).map((e) => ({ id: e.id, name: e.name, rarity: e.rarity, description: e.description, previewColor: "#33e6ff" }));
    case "banner":
      return Object.values(BANNERS).map((b) => ({ id: b.id, name: b.name, rarity: b.rarity, description: "A lobby banner.", previewColor: b.gradient[0] }));
    case "icon":
      return Object.values(ICONS).map((i) => ({ id: i.id, name: i.name, rarity: i.rarity, description: "A player icon.", previewColor: "#33e6ff", glyph: i.glyph }));
    default:
      return [];
  }
}

function equippedIdFor(equipped: ReturnType<typeof useInventoryStore.getState>["equipped"], category: CosmeticCategory): string | null {
  if (category === "emote") return equipped.emote[0] ?? null;
  if (category === "skin") return equipped.skin;
  if (category === "backAccessory") return equipped.backAccessory;
  if (category === "pickaxe") return equipped.pickaxe;
  if (category === "weaponWrap") return equipped.weaponWrap;
  if (category === "banner") return equipped.banner;
  if (category === "icon") return equipped.icon;
  return null;
}

export function LockerTab() {
  const owned = useInventoryStore((s) => s.owned);
  const equipped = useInventoryStore((s) => s.equipped);
  const equip = useInventoryStore((s) => s.equip);
  const [category, setCategory] = useState<CosmeticCategory>("skin");

  const items = useMemo(() => itemsForCategory(category), [category]);
  const ownedItems = items.filter((i) => owned.includes(i.id));
  const equippedId = equippedIdFor(equipped, category);
  const [selected, setSelected] = useState<LockerItem | null>(null);
  const active = selected ?? items.find((i) => i.id === equippedId) ?? ownedItems[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-black/30 p-1 text-xs font-semibold">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCategory(c.id);
              setSelected(null);
              soundManager.play("uiClick");
            }}
            className={`flex-1 rounded-lg py-1.5 transition ${category === c.id ? "bg-bs-cyan text-[#04141a]" : "text-white/70 hover:text-white"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="glass-panel flex-1 p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">
            {ownedItems.length} owned
          </p>
          {ownedItems.length === 0 ? (
            <p className="text-sm text-white/40">Nothing owned yet — check the Shop.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {ownedItems.map((item) => {
                const isEquipped = equippedId === item.id;
                const isSelected = active?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelected(item);
                      soundManager.play("uiClick");
                      if (category === "emote") usePlayerStore.getState().playEmote(item.id);
                    }}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center transition ${
                      isSelected ? "border-bs-cyan bg-bs-cyan/10" : "border-white/10 bg-black/25 hover:border-white/25"
                    }`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-md" style={{ background: `radial-gradient(circle, ${item.previewColor}55, transparent 70%)` }}>
                      {item.glyph ? <span className="text-xl">{item.glyph}</span> : <div className="h-8 w-8 rounded-sm" style={{ background: item.previewColor }} />}
                    </div>
                    <p className="truncate text-[11px] font-semibold text-white/80">{item.name}</p>
                    {isEquipped && <p className="text-[9px] font-bold uppercase text-bs-cyan">Equipped</p>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {active && (
          <div className="glass-panel w-full p-5 sm:w-72">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: RARITY_COLOR[active.rarity] }}>
              {active.rarity}
            </p>
            <h3 className="mt-1 text-2xl font-black text-white">{active.name}</h3>
            <p className="mt-2 text-sm text-white/60">{active.description}</p>
            <button
              className="btn-primary mt-5 w-full"
              disabled={equippedId === active.id}
              onClick={() => {
                equip(category, active.id, 0);
                soundManager.play("equip");
              }}
            >
              {equippedId === active.id ? "Equipped" : "Equip"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
