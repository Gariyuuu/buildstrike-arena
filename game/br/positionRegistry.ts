/** Plain mutable per-frame position registry for every live agent in a BR
 * match (mirrors game/state/positionTracker.ts's pattern) — a Zustand store
 * here would mean every agent re-rendering all 19 others every frame just to
 * find the nearest enemy. */
interface AgentPos {
  x: number;
  y: number;
  z: number;
  squadId: number;
  alive: boolean;
}

class BRPositionRegistry {
  private agents = new Map<string, AgentPos>();

  clear() {
    this.agents.clear();
  }

  set(id: string, x: number, y: number, z: number, squadId: number, alive: boolean) {
    const existing = this.agents.get(id);
    if (existing) {
      existing.x = x;
      existing.y = y;
      existing.z = z;
      existing.squadId = squadId;
      existing.alive = alive;
    } else {
      this.agents.set(id, { x, y, z, squadId, alive });
    }
  }

  setAlive(id: string, alive: boolean) {
    const existing = this.agents.get(id);
    if (existing) existing.alive = alive;
  }

  nearestEnemy(id: string, x: number, z: number, squadId: number): { id: string; x: number; z: number; distance: number } | null {
    let best: { id: string; x: number; z: number; distance: number } | null = null;
    for (const [otherId, p] of this.agents) {
      if (otherId === id || !p.alive || p.squadId === squadId) continue;
      const dx = p.x - x;
      const dz = p.z - z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (!best || distance < best.distance) best = { id: otherId, x: p.x, z: p.z, distance };
    }
    return best;
  }

  get(id: string): AgentPos | undefined {
    return this.agents.get(id);
  }
}

export const brPositions = new BRPositionRegistry();
