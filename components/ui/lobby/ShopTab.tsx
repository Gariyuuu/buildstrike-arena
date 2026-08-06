"use client";

import { useState } from "react";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useProfileStore } from "@/stores/profileStore";
import { SKINS, RARITY_COLOR, type Rarity } from "@/game/config/cosmetics";
import { soundManager } from "@/game/audio/soundManager";

// Full daily-rotating shop with featured/daily sections and a countdown is
// TASKS.md's shop-rotation follow-up — this is the real, functional core:
// every shop-unlockable skin, priced by rarity, purchasable with earned
// coins only, granted straight into the Locker.
const PRICE_BY_RARITY: Record<Rarity, number> = {
  common: 300,
  uncommon: 500,
  rare: 800,
  epic: 1200,
  legendary: 2000,
};

export function ShopTab() {
  const coins = useProfileStore((s) => s.coins);
  const owned = useInventoryStore((s) => s.owned);
  const grant = useInventoryStore((s) => s.grant);
  const equip = useInventoryStore((s) => s.equip);
  const spendCoins = useProfileStore((s) => s.spendCoins);
  const [justBought, setJustBought] = useState<string | null>(null);

  const shopSkins = Object.values(SKINS).filter((s) => s.unlock === "shop");

  function buy(skinId: string, price: number) {
    if (owned.includes(skinId)) return;
    if (!spendCoins(price)) {
      soundManager.play("uiClick");
      return;
    }
    grant(skinId);
    equip("skin", skinId);
    soundManager.play("purchase");
    setJustBought(skinId);
    setTimeout(() => setJustBought(null), 1600);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40">Featured Skins</p>
        <p className="font-mono text-sm text-bs-orange">{coins.toLocaleString()} Coins</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shopSkins.map((skin) => {
          const price = PRICE_BY_RARITY[skin.rarity];
          const isOwned = owned.includes(skin.id);
          const canAfford = coins >= price;
          return (
            <div key={skin.id} className="glass-panel flex flex-col items-center gap-2 p-4 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-lg"
                style={{ background: `radial-gradient(circle, ${skin.skin.jacketColor}55, transparent 70%)` }}
              >
                <div className="h-9 w-9 rounded-sm" style={{ background: skin.skin.jacketColor }} />
              </div>
              <p className="text-xs font-bold uppercase" style={{ color: RARITY_COLOR[skin.rarity] }}>
                {skin.rarity}
              </p>
              <p className="text-sm font-semibold text-white">{skin.name}</p>
              <button
                className={`w-full rounded-lg py-1.5 text-sm font-bold transition ${
                  isOwned
                    ? "cursor-default bg-white/10 text-white/50"
                    : canAfford
                      ? "bg-bs-cyan text-[#04141a] hover:brightness-110"
                      : "cursor-not-allowed bg-white/5 text-white/30"
                }`}
                disabled={isOwned || !canAfford}
                onClick={() => buy(skin.id, price)}
              >
                {isOwned ? "Owned" : justBought === skin.id ? "Purchased!" : `${price} Coins`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
