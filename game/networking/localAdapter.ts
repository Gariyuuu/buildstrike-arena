import { nanoid } from "nanoid";
import { BUILD_TYPES } from "@/game/config/builds";
import { validatePlacement } from "@/game/building/grid";
import { useBuildsStore } from "@/stores/buildsStore";
import { positionTracker } from "@/game/state/positionTracker";
import type { GameAdapter, Vec3 } from "@/game/networking/adapter";

/** Bot-duel adapter: every action resolves instantly against local client state. */
export function createLocalAdapter(): GameAdapter {
  return {
    mode: "bot",
    requestBuildPlacement(kind, position, rotationY) {
      const state = useBuildsStore.getState();
      const activeCount = state.builds.filter((b) => b.owner === "local").length;
      const playerPositions: Vec3[] = [
        [positionTracker.local.x, positionTracker.local.y, positionTracker.local.z],
        [positionTracker.opponent.x, positionTracker.opponent.y, positionTracker.opponent.z],
      ];
      const result = validatePlacement(kind, position, rotationY, state.builds, playerPositions, activeCount);
      if (!result.valid) return;
      const cfg = BUILD_TYPES[kind];
      state.add({
        id: nanoid(8),
        kind,
        owner: "local",
        position: result.position,
        rotationY: result.rotationY,
        health: cfg.health,
        maxHealth: cfg.health,
      });
    },
    reportFire() {
      // Damage already applied directly via the damageable registry in bot mode.
    },
    reportHeal() {
      // Healing already applied directly to the player store in bot mode.
    },
    sendState() {
      // No network peer to inform in bot mode.
    },
    getOpponentPosition() {
      return [positionTracker.opponent.x, positionTracker.opponent.y, positionTracker.opponent.z];
    },
  };
}
