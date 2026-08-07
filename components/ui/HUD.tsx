"use client";

import { useEffect, useState } from "react";
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
import { EmoteWheel } from "@/components/ui/EmoteWheel";
import { useKeybindsStore } from "@/stores/keybindsStore";
import { normalizeKey } from "@/hooks/useKeyboard";

export function HUD({ domElement }: { domElement: React.RefObject<HTMLDivElement | null> }) {
  const mode = useGameStore((s) => s.mode);
  const paused = useGameStore((s) => s.paused);
  const setPaused = useGameStore((s) => s.setPaused);
  const matchPhase = useMatchStore((s) => s.phase);
  const matchStarted = useNetworkStore((s) => s.matchStarted);
  const [emoteWheelOpen, setEmoteWheelOpen] = useState(false);

  const showLobby = mode === "online" && !matchStarted;
  const showResults = matchPhase === "match-end";
  const showCombatUi = !showLobby && !showResults;
  // Spec: allow emotes in Training (always free play) and "after a round"
  // (countdown/round-end/match-end) in real matches, but not mid-fight,
  // where they'd be an exploitable distraction.
  const canEmote = mode === "training" || matchPhase !== "combat";

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        if (showLobby || showResults) return;
        if (emoteWheelOpen) {
          setEmoteWheelOpen(false);
          return;
        }
        const next = !useGameStore.getState().paused;
        setPaused(next);
        if (next && document.pointerLockElement) document.exitPointerLock();
        return;
      }
      if (normalizeKey(e) === useKeybindsStore.getState().binds.emoteWheel) {
        if (showLobby || showResults || paused || !canEmote) return;
        setEmoteWheelOpen((v) => !v);
        if (document.pointerLockElement) document.exitPointerLock();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLobby, showResults, paused, canEmote, emoteWheelOpen]);

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
      {emoteWheelOpen && !paused && !showLobby && !showResults && <EmoteWheel onClose={() => setEmoteWheelOpen(false)} />}
    </div>
  );
}
