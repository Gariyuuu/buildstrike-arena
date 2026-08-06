"use client";

import { useEffect, useMemo } from "react";
import { PLAYER_SPAWNS, MATCH_CONFIG } from "@/game/config/match";
import { useMatchStore } from "@/stores/matchStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useBuildsStore } from "@/stores/buildsStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { soundManager } from "@/game/audio/soundManager";
import { createLocalAdapter } from "@/game/networking/localAdapter";
import { LocalPlayer } from "@/components/game/LocalPlayer";
import { BotPlayer } from "@/components/game/BotPlayer";

export function BotDuelScene({ domElement }: { domElement: React.RefObject<HTMLDivElement | null> }) {
  const adapter = useMemo(() => createLocalAdapter(), []);
  const phase = useMatchStore((s) => s.phase);
  const roundWinner = useMatchStore((s) => s.roundWinner);
  const botDifficulty = useSettingsStore((s) => s.botDifficulty);

  useEffect(() => {
    useMatchStore.getState().startMatch();
    usePlayerStore.getState().resetForRound();
    useBuildsStore.getState().clear();
  }, []);

  useEffect(() => {
    if (phase !== "countdown") return;
    soundManager.play("countdown");
    const id = setInterval(() => {
      const s = useMatchStore.getState();
      if (s.countdown <= 1) {
        clearInterval(id);
        useMatchStore.getState().beginCombat();
      } else {
        useMatchStore.getState().setCountdown(s.countdown - 1);
        soundManager.play("countdown");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (!roundWinner) return;
    soundManager.play("roundVictory");
  }, [roundWinner]);

  useEffect(() => {
    if (phase !== "round-end") return;
    const t = setTimeout(() => {
      usePlayerStore.getState().resetForRound();
      useBuildsStore.getState().clear();
      useMatchStore.getState().advanceRound();
    }, MATCH_CONFIG.roundEndDelay * 1000);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <>
      <LocalPlayer mode="bot" adapter={adapter} spawn={PLAYER_SPAWNS.a} domElement={domElement} />
      <BotPlayer difficulty={botDifficulty} spawn={PLAYER_SPAWNS.b} />
    </>
  );
}
