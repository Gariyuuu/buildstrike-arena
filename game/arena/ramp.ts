export interface RampTransform {
  position: [number, number, number];
  rotationX: number;
  length: number;
}

/** Computes a box transform that spans between two points, tilted to form a ramp. */
export function computeRamp(from: [number, number, number], to: [number, number, number]): RampTransform {
  const rise = to[1] - from[1];
  const run = to[2] - from[2];
  const length = Math.sqrt(rise * rise + run * run);
  const rotationX = Math.atan2(-rise, run);
  const position: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];
  return { position, rotationX, length };
}
