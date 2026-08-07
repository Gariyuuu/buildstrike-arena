"use client";

import { useEffect, useMemo, useState } from "react";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useProfileStore } from "@/stores/profileStore";
import { RARITY_COLOR, type CosmeticCategory } from "@/game/config/cosmetics";
import { fullShopPool, priceFor, type ShopItem } from "@/game/shop/pool";
import { pickForDate, msUntilNextRotation, formatCountdown } from "@/game/shop/rotation";
import { soundManager } from "@/game/audio/soundManager";
import { SkinIcon } from "@/components/ui/SkinIcon";

const CATEGORY_LABEL: Record<ShopItem["category"] | "all", string> = {
  all: "All",
  skin: "Skins",
  weaponWrap: "Weapon Wraps",
  backAccessory: "Accessories",
  emote: "Emotes",
  pickaxe: "Pickaxes",
};

function useCountdown() {
  const [ms, setMs] = useState(() => msUntilNextRotation(new Date()));
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextRotation(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return ms;
}

function ItemCard({ item }: { item: ShopItem }) {
  const owned = useInventoryStore((s) => s.owned);
  const grant = useInventoryStore((s) => s.grant);
  const equip = useInventoryStore((s) => s.equip);
  const spendCoins = useProfileStore((s) => s.spendCoins);
  const coins = useProfileStore((s) => s.coins);
  const [justBought, setJustBought] = useState(false);

  const isOwned = owned.includes(item.id);
  const price = priceFor(item);
  const canAfford = coins >= price;

  function buy() {
    if (isOwned) {
      // Already owned — clicking equips it directly for weapon-slot categories.
      equip(item.category, item.id);
      soundManager.play("equip");
      return;
    }
    if (!spendCoins(price)) {
      soundManager.play("uiClick");
      return;
    }
    grant(item.id);
    equip(item.category, item.id);
    soundManager.play("purchase");
    setJustBought(true);
    setTimeout(() => setJustBought(false), 1500);
  }

  return (
    <div className="glass-panel flex flex-col items-center gap-2 p-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg" style={{ background: `radial-gradient(circle, ${item.previewColor}55, transparent 70%)` }}>
        {item.category === "skin" && item.skin ? <SkinIcon skin={item.skin} size={48} /> : <div className="h-9 w-9 rounded-sm" style={{ background: item.previewColor }} />}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">{CATEGORY_LABEL[item.category]}</p>
      <p className="text-xs font-bold uppercase" style={{ color: RARITY_COLOR[item.rarity] }}>
        {item.rarity}
      </p>
      <p className="text-sm font-semibold text-white">{item.name}</p>
      <button
        className={`w-full rounded-lg py-1.5 text-sm font-bold transition ${
          isOwned ? "bg-bs-cyan/20 text-bs-cyan hover:bg-bs-cyan/30" : canAfford ? "bg-bs-cyan text-[#04141a] hover:brightness-110" : "cursor-not-allowed bg-white/5 text-white/30"
        }`}
        disabled={!isOwned && !canAfford}
        onClick={buy}
      >
        {isOwned ? "Equip" : justBought ? "Purchased!" : `${price} Coins`}
      </button>
    </div>
  );
}

export function ShopTab() {
  const coins = useProfileStore((s) => s.coins);
  const [category, setCategory] = useState<CosmeticCategory | "all">("all");
  const countdownMs = useCountdown();

  const pool = useMemo(() => fullShopPool(), []);
  const today = useMemo(() => new Date(), []);
  const featured = useMemo(() => pickForDate(pool, 4, today, "featured"), [pool, today]);
  const daily = useMemo(() => {
    const featuredIds = new Set(featured.map((i) => i.id));
    return pickForDate(
      pool.filter((i) => !featuredIds.has(i.id)),
      6,
      today,
      "daily"
    );
  }, [pool, today, featured]);

  const filtered = category === "all" ? pool : pool.filter((i) => i.category === category);

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40">Item Shop</p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-white/40">Refreshes in {formatCountdown(countdownMs)}</span>
          <span className="font-mono text-sm text-bs-orange">{coins.toLocaleString()} Coins</span>
        </div>
      </div>

      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">Featured</p>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {featured.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">Daily</p>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {daily.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      <div className="mb-3 flex gap-1.5 rounded-xl bg-black/30 p-1 text-xs font-semibold">
        {(["all", "skin", "weaponWrap", "backAccessory", "emote", "pickaxe"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex-1 rounded-lg py-1.5 transition ${category === c ? "bg-bs-cyan text-[#04141a]" : "text-white/70 hover:text-white"}`}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {filtered.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
