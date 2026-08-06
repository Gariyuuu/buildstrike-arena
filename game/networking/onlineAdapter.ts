import { nanoid } from "nanoid";
import { positionTracker } from "@/game/state/positionTracker";
import type { GameAdapter } from "@/game/networking/adapter";
import type { GameNetworkClient } from "@/game/networking/client";

/** Online adapter: every action is forwarded to the PartyServer room, which is authoritative. */
export function createOnlineAdapter(client: GameNetworkClient): GameAdapter {
  return {
    mode: "online",
    requestBuildPlacement(kind, position, rotationY) {
      client.send({ type: "buildPlace", clientId: nanoid(8), kind, position, rotationY });
    },
    reportFire(weapon, origin, direction, hit) {
      client.send({
        type: "fire",
        weapon,
        origin,
        direction,
        timestamp: Date.now(),
        hitPlayer: hit?.kind === "player" ? { headshot: hit.headshot, pellets: hit.pellets } : undefined,
        hitBuild: hit?.kind === "build" ? { buildId: hit.buildId, pellets: hit.pellets } : undefined,
      });
    },
    reportHeal(item, event) {
      client.send({ type: event === "start" ? "healStart" : event === "cancel" ? "healCancel" : "healComplete", item });
    },
    sendState(state) {
      client.send({
        type: "state",
        position: state.position,
        rotationY: state.rotationY,
        isBuildMode: state.isBuildMode,
        buildKind: state.buildKind,
        weapon: state.weapon,
        timestamp: Date.now(),
      });
    },
    getOpponentPosition() {
      return [positionTracker.opponent.x, positionTracker.opponent.y, positionTracker.opponent.z];
    },
  };
}
