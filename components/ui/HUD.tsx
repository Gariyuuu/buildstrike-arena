"use client";

import { useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useMatchStore } from "@/stores/matchStore";
import { useNetworkStore } from "@/stores/networkStore";
import { Crosshair } from "@/components/ui/Crosshair";
import { CombatHud } from "@/components/ui/CombatHud";
import { Scoreboard } from "@/components/ui/Scoreboard";
import { PauseMenu } from "@/components/ui/PauseMenu";
import { MatchResults } from "@/components/ui/MatchResults";
import { OnlineLobbyOverlay } from "@/components/ui/OnlineLobbyOverlay";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";

export function HUD({ domElement }: { domElement: React.RefObject<HTMLDivElement | null> }) {
  const mode = useGameStore((s) => s.mode);
  const paused = useGameStore((s) => s.paused);
  const setPaused = useGameStore((s) => s.setPaused);
  const matchPhase = useMatchStore((s) => s.phase);
  const matchStarted = useNetworkStore((s) => s.matchStarted);

  const showLobby = mode === "online" && !matchStarted;
  const showResults = matchPhase === "match-end";
  const showCombatUi = !showLobby && !showResults;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Escape") return;
      if (showLobby || showResults) return;
      const next = !useGameStore.getState().paused;
      setPaused(next);
      if (next && document.pointerLockElement) document.exitPointerLock();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLobby, showResults]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {showCombatUi && (
        <>
          <Crosshair />
          <CombatHud />
          {mode !== "training" && <Scoreboard />}
        </>
      )}
      {mode === "online" && <ConnectionStatus />}
      {showLobby && (
        <div className="pointer-events-auto absolute inset-0">
          <OnlineLobbyOverlay />
        </div>
      )}
      {showResults && (
        <div className="pointer-events-auto absolute inset-0">
          <MatchResults />
        </div>
      )}
      {paused && !showLobby && !showResults && (
        <div className="pointer-events-auto absolute inset-0">
          <PauseMenu requestUnlock={() => domElement.current?.requestPointerLock()} />
        </div>
      )}
    </div>
  );
}
