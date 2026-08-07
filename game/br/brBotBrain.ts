import * as THREE from "three";

export type BRBotState = "loot" | "engage" | "rotate" | "wander";

export interface BRBotPerception {
  pos: THREE.Vector3;
  hasWeapon: boolean;
  nearestEnemy: { id: string; x: number; z: number; distance: number } | null;
  nearestLoot: { id: string; x: number; z: number; distance: number } | null;
  outsideZone: boolean;
}

export interface BRBotIntent {
  state: BRBotState;
  moveTarget: THREE.Vector3 | null;
  wantsToShoot: boolean;
  aimAt: THREE.Vector3 | null;
  wantsPickup: string | null;
}

const ENGAGE_RANGE = 30;
const PICKUP_RANGE = 2.2;

/** Deliberately simpler than the 1v1 BotBrain FSM (game/bots/fsm.ts) — at
 * up to 19 concurrent instances, a per-agent line-of-sight raycast every
 * frame (like the 1v1 bot does) would be a real perf cost, so BR bots use
 * distance-only perception. They're a bit omniscient through walls as a
 * result; a reasonable v1 trade-off, not a hard requirement to fix. */
export class BRBotBrain {
  state: BRBotState = "loot";
  private nextFireDecision = 0;

  update(p: BRBotPerception, now: number): BRBotIntent {
    if (p.outsideZone) {
      return { state: "rotate", moveTarget: new THREE.Vector3(0, 0, 0), wantsToShoot: false, aimAt: null, wantsPickup: null };
    }

    if (p.hasWeapon && p.nearestEnemy && p.nearestEnemy.distance < ENGAGE_RANGE) {
      this.state = "engage";
      const enemyPos = new THREE.Vector3(p.nearestEnemy.x, p.pos.y, p.nearestEnemy.z);
      let wantsToShoot = false;
      if (now >= this.nextFireDecision) {
        wantsToShoot = true;
        this.nextFireDecision = now + 0.35 + Math.random() * 0.5;
      }
      return {
        state: "engage",
        moveTarget: p.nearestEnemy.distance > 9 ? enemyPos : null,
        wantsToShoot,
        aimAt: enemyPos,
        wantsPickup: null,
      };
    }

    if (p.nearestLoot && (!p.hasWeapon || p.nearestLoot.distance < 40)) {
      this.state = "loot";
      const lootPos = new THREE.Vector3(p.nearestLoot.x, p.pos.y, p.nearestLoot.z);
      return {
        state: "loot",
        moveTarget: lootPos,
        wantsToShoot: false,
        aimAt: null,
        wantsPickup: p.nearestLoot.distance < PICKUP_RANGE ? p.nearestLoot.id : null,
      };
    }

    this.state = "wander";
    return { state: "wander", moveTarget: new THREE.Vector3(0, 0, 0), wantsToShoot: false, aimAt: null, wantsPickup: null };
  }
}
