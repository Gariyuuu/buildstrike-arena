// "Tilted Vibes" — a dense cluster of leaning skyscrapers around the map
// center, original geometry generated at deploy time (no external assets,
// consistent with the rest of the project).
export interface TowerDef {
  position: [number, number, number];
  footprint: [number, number]; // width, depth (collision + base geometry)
  height: number;
  tiltX: number;
  tiltZ: number;
  color: string;
  accent: string;
}

const TOWER_COLORS = ["#2a3142", "#232b3a", "#1e2836", "#333d52", "#28324a"];
const ACCENTS = ["#33e6ff", "#ff8a33", "#7dffb0", "#b56bff"];

export function generateTiltedVibesLayout(): TowerDef[] {
  const towers: TowerDef[] = [];
  const ringCount = 3;
  let placed = 0;
  for (let ring = 0; ring < ringCount; ring++) {
    const ringRadius = 14 + ring * 16;
    const count = 6 + ring * 4;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + ring * 0.35;
      const jitterR = ringRadius + (Math.random() - 0.5) * 6;
      const x = Math.cos(angle) * jitterR;
      const z = Math.sin(angle) * jitterR;
      const w = 5 + Math.random() * 4;
      const d = 5 + Math.random() * 4;
      const height = 16 + Math.random() * 22 - ring * 3;
      towers.push({
        position: [x, height / 2, z],
        footprint: [w, d],
        height,
        tiltX: (Math.random() - 0.5) * 0.1,
        tiltZ: (Math.random() - 0.5) * 0.1,
        color: TOWER_COLORS[placed % TOWER_COLORS.length],
        accent: ACCENTS[placed % ACCENTS.length],
      });
      placed++;
    }
  }
  return towers;
}
