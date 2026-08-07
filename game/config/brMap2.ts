// "Sand Wastes" — a desert BR map: scattered rock-formation cover across
// open ground, a sunken canyon arena at the center, and an oasis pond.
// Same procedural-generation approach as brMap1.ts (original geometry, no
// external assets), warm sandstone palette instead of the cold city towers.
export interface RockDef {
  position: [number, number, number];
  footprint: [number, number];
  height: number;
  rotationY: number;
  color: string;
}

export interface CanyonWallDef {
  position: [number, number, number];
  rotationY: number;
  length: number;
  height: number;
}

export interface DesertLayout {
  rocks: RockDef[];
  canyonWalls: CanyonWallDef[];
  oasisRadius: number;
}

const ROCK_COLORS = ["#c9a066", "#a67c4a", "#8a6238", "#b98b52", "#7a5c38"];

function scatteredRocks(count: number, minR: number, maxR: number): RockDef[] {
  const rocks: RockDef[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = minR + Math.random() * (maxR - minR);
    const w = 3 + Math.random() * 5;
    const d = 3 + Math.random() * 5;
    const height = 3 + Math.random() * 7;
    rocks.push({
      position: [Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius],
      footprint: [w, d],
      height,
      rotationY: Math.random() * Math.PI,
      color: ROCK_COLORS[i % ROCK_COLORS.length],
    });
  }
  return rocks;
}

export function generateDesertLayout(): DesertLayout {
  const oasisRadius = 10;
  const canyonWalls: CanyonWallDef[] = [];
  const wallSegments = 14;
  const canyonRadius = 22;
  for (let i = 0; i < wallSegments; i++) {
    const angle = (i / wallSegments) * Math.PI * 2;
    // Leave two gaps in the ring so it's an arena, not a sealed pit.
    if (i === 3 || i === 10) continue;
    canyonWalls.push({
      position: [Math.cos(angle) * canyonRadius, 3, Math.sin(angle) * canyonRadius],
      rotationY: angle + Math.PI / 2,
      length: canyonRadius * ((Math.PI * 2) / wallSegments) * 1.3,
      height: 6,
    });
  }

  const rocks = [...scatteredRocks(14, 30, 75), ...scatteredRocks(18, 80, 150)];

  return { rocks, canyonWalls, oasisRadius };
}
