"use client";

import { useEffect, useMemo } from "react";
import { PLAYER_SPAWNS } from "@/game/config/match";
import { useMatchStore } from "@/stores/matchStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useBuildsStore } from "@/stores/buildsStore";
import { createLocalAdapter } from "@/game/networking/localAdapter";
import { LocalPlayer } from "@/components/game/LocalPlayer";
import { TrainingTargets } from "@/components/game/TrainingTargets";

/**
 * Free-play sandbox: spawn alone, shoot respawning targets, build freely,
 * no round timer, no elimination, no score. "Reset Arena" in the pause
 * menu already does the right thing here for free (see PauseMenu.tsx's
 * mode !== "online" branch), so this scene only needs to set the match
 * phase straight to "combat" once, skipping the countdown entirely.
 */
export function TrainingArenaScene({ domElement }: { domElement: React.RefObject<HTMLDivElement | null> }) {
  const adapter = useMemo(() => createLocalAdapter(), []);

  useEffect(() => {
    usePlayerStore.getState().resetForRound();
    useBuildsStore.getState().clear();
    useMatchStore.setState({ phase: "combat", round: 1, score: { local: 0, opponent: 0 } });
  }, []);

  return (
    <>
      <LocalPlayer mode="bot" adapter={adapter} spawn={PLAYER_SPAWNS.a} domElement={domElement} />
      <TrainingTargets />
    </>
  );
}
