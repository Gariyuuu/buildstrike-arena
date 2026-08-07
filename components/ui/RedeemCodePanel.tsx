"use client";

import { useState } from "react";
import { findCode } from "@/game/config/codes";
import { useRedeemedCodesStore } from "@/stores/redeemedCodesStore";
import { useProfileStore } from "@/stores/profileStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { SKINS, WEAPON_WRAPS, BACK_ACCESSORIES, PICKAXES, EMOTES, BANNERS, ICONS } from "@/game/config/cosmetics";
import { soundManager } from "@/game/audio/soundManager";

function unlockAllCosmetics() {
  const grant = useInventoryStore.getState().grant;
  for (const pool of [SKINS, WEAPON_WRAPS, BACK_ACCESSORIES, PICKAXES, EMOTES, BANNERS, ICONS]) {
    for (const id of Object.keys(pool)) grant(id);
  }
}

export function RedeemCodePanel() {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function redeem() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const code = findCode(trimmed);
    const normalized = trimmed.toUpperCase();
    if (!code) {
      setMessage({ text: "Invalid code.", ok: false });
      soundManager.play("buildDenied", { volume: 0.4 });
      return;
    }
    if (useRedeemedCodesStore.getState().redeemed.includes(normalized)) {
      setMessage({ text: "Already redeemed.", ok: false });
      soundManager.play("buildDenied", { volume: 0.4 });
      return;
    }
    if (code.coins) useProfileStore.getState().addCoins(code.coins);
    if (code.unlockAllCosmetics) unlockAllCosmetics();
    useRedeemedCodesStore.getState().markRedeemed(normalized);
    setMessage({ text: `Redeemed: ${code.description}`, ok: true });
    soundManager.play("coinGain");
    setInput("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setMessage(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && redeem()}
          placeholder="Enter code"
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-mono uppercase tracking-wider text-white outline-none focus:border-bs-cyan"
        />
        <button className="btn-orange px-4 text-sm" onClick={redeem} disabled={!input.trim()}>
          Redeem
        </button>
      </div>
      {message && <p className={`mt-2 text-xs font-semibold ${message.ok ? "text-bs-cyan" : "text-bs-red"}`}>{message.text}</p>}
    </div>
  );
}
