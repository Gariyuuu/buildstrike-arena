import type { GameNetworkClient } from "@/game/networking/client";

// Lets DOM-level UI (outside the R3F tree) reach the live network client
// without prop-drilling through the Canvas boundary.
let current: GameNetworkClient | null = null;

export function setActiveClient(client: GameNetworkClient | null) {
  current = client;
}

export function getActiveClient(): GameNetworkClient | null {
  return current;
}
