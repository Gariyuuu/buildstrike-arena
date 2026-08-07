// "Neon District" — a dense Tokyo-mega-city BR map: a tight grid of tall
// neon-trimmed towers split by two wide central avenues, tallest near the
// downtown core and shorter toward the outskirts. Same procedural-generation
// approach as brMap1/brMap2 (original geometry, no external assets).
export interface NeonTowerDef {
  position: [number, number, number];
  footprint: [number, number];
  height: number;
  baseColor: string;
  neonColor: string;
  neonColor2: string;
  hasSpire: boolean;
}

const BASE_COLORS = ["#1a1c24", "#20222c", "#181a22", "#242631", "#1c1e28"];
const NEON_PALETTE = ["#ff2ec4", "#33e6ff", "#b56bff", "#ff8a33", "#7dffb0"];

export function generateNeonCityLayout(): NeonTowerDef[] {
  const towers: NeonTowerDef[] = [];
  const half = 4;
  const blockSpacing = 28;
  let colorIdx = 0;

  for (let gx = -half; gx <= half; gx++) {
    for (let gz = -half; gz <= half; gz++) {
      // Two wide central avenues (a cross through the grid) for open sightlines/rotation.
      if (gx === 0 || gz === 0) continue;
      // Occasional gap for a plaza/parking lot — breaks up the density a bit.
      if (Math.random() < 0.15) continue;

      const x = gx * blockSpacing + (Math.random() - 0.5) * 4;
      const z = gz * blockSpacing + (Math.random() - 0.5) * 4;
      const distFromCenter = Math.sqrt(gx * gx + gz * gz);
      const w = 10 + Math.random() * 6;
      const d = 10 + Math.random() * 6;
      const heightBase = Math.max(12, 52 - distFromCenter * 5);
      const height = heightBase + Math.random() * 16;

      towers.push({
        position: [x, height / 2, z],
        footprint: [w, d],
        height,
        baseColor: BASE_COLORS[colorIdx % BASE_COLORS.length],
        neonColor: NEON_PALETTE[colorIdx % NEON_PALETTE.length],
        neonColor2: NEON_PALETTE[(colorIdx + 2) % NEON_PALETTE.length],
        hasSpire: Math.random() < 0.35,
      });
      colorIdx++;
    }
  }
  return towers;
}
