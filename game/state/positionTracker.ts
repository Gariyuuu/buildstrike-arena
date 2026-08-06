import * as THREE from "three";

/**
 * Frame-updated positions shared across the local player, bot and remote
 * player without going through React state (avoids re-renders on hot paths
 * like bot perception and network state sync).
 */
class PositionTracker {
  local = new THREE.Vector3();
  opponent = new THREE.Vector3();
  opponentAlive = true;
}

export const positionTracker = new PositionTracker();
