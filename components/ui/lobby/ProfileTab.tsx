"use client";

import { useState } from "react";
import { useProfileStore } from "@/stores/profileStore";
import { soundManager } from "@/game/audio/soundManager";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold text-white">{value}</p>
    </div>
  );
}

export function ProfileTab() {
  const displayName = useProfileStore((s) => s.displayName);
  const level = useProfileStore((s) => s.level);
  const totalXp = useProfileStore((s) => s.totalXp);
  const coins = useProfileStore((s) => s.coins);
  const stats = useProfileStore((s) => s.stats);
  const setDisplayName = useProfileStore((s) => s.setDisplayName);
  const [name, setName] = useState(displayName);

  const winRate = stats.matchesPlayed > 0 ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0;
  const favoriteWeapon = Object.entries(stats.weaponDamage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return (
    <div className="flex flex-col gap-5">
      <div className="glass-panel flex flex-wrap items-center gap-4 p-5">
        <input
          value={name}
          maxLength={16}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name.trim() && name !== displayName) {
              setDisplayName(name);
              soundManager.play("uiClick");
            }
          }}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-lg font-bold text-white outline-none focus:border-bs-cyan"
        />
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span className="rounded-md bg-bs-cyan/15 px-2.5 py-1 font-mono font-bold text-bs-cyan">Lvl {level}</span>
          <span>{totalXp.toLocaleString()} total XP</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Wins" value={stats.wins} />
        <StatCard label="Losses" value={stats.losses} />
        <StatCard label="Win Rate" value={`${winRate}%`} />
        <StatCard label="Matches" value={stats.matchesPlayed} />
        <StatCard label="Eliminations" value={stats.eliminations} />
        <StatCard label="Total Damage" value={stats.totalDamage.toLocaleString()} />
        <StatCard label="Win Streak" value={stats.currentWinStreak} />
        <StatCard label="Best Streak" value={stats.highestWinStreak} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Coins" value={coins.toLocaleString()} />
        <StatCard label="Favorite Weapon" value={favoriteWeapon} />
      </div>
    </div>
  );
}
