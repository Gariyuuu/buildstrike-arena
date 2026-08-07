// Procedural emote poses, following the same philosophy as pose.ts: no
// animation clips, just target joint values CharacterModel damps toward,
// with an optional oscillation layered on top for the ones that move
// continuously (wave, clap, robot dance, laugh, victory dance's bounce).

export type OscillationChannel =
  | "shoulderXL"
  | "shoulderXR"
  | "shoulderZL"
  | "shoulderZR"
  | "elbowXL"
  | "elbowXR"
  | "spineLean"
  | "hipDrop"
  | "headPitch";

export interface Oscillation {
  channel: OscillationChannel;
  amplitude: number;
  frequency: number; // Hz
  /** "sine" for smooth motion, "square" for a jerky robotic feel. */
  wave?: "sine" | "square";
}

export interface EmotePoseTarget {
  shoulderXL: number;
  shoulderXR: number;
  shoulderZL: number;
  shoulderZR: number;
  elbowXL: number;
  elbowXR: number;
  spineLean: number;
  hipDrop: number;
  headPitch: number;
  oscillations?: Oscillation[];
}

const REST: EmotePoseTarget = {
  shoulderXL: 0.06,
  shoulderXR: 0.06,
  shoulderZL: 0.12,
  shoulderZR: 0.12,
  elbowXL: 0.18,
  elbowXR: 0.18,
  spineLean: 0,
  hipDrop: 0,
  headPitch: 0,
};

export const EMOTE_POSES: Record<string, EmotePoseTarget> = {
  "emote-wave": {
    ...REST,
    shoulderXR: -2.1,
    shoulderZR: 0.5,
    elbowXR: 1.7,
    oscillations: [{ channel: "shoulderZR", amplitude: 0.35, frequency: 2.2 }],
  },
  "emote-victory": {
    ...REST,
    shoulderXL: -2.6,
    shoulderXR: -2.6,
    elbowXL: 0.2,
    elbowXR: 0.2,
    oscillations: [{ channel: "hipDrop", amplitude: -0.06, frequency: 2.4 }],
  },
  "emote-sit": {
    ...REST,
    shoulderXL: 0.5,
    shoulderXR: 0.5,
    elbowXL: 1.3,
    elbowXR: 1.3,
    hipDrop: -0.42,
    spineLean: 0.05,
  },
  "emote-clap": {
    ...REST,
    shoulderXL: 0.75,
    shoulderXR: 0.75,
    shoulderZL: 0.05,
    shoulderZR: 0.05,
    elbowXL: 1.75,
    elbowXR: 1.75,
    oscillations: [
      { channel: "elbowXL", amplitude: 0.2, frequency: 3.4 },
      { channel: "elbowXR", amplitude: 0.2, frequency: 3.4 },
    ],
  },
  "emote-point": {
    ...REST,
    shoulderXR: 0.55,
    shoulderZR: -0.05,
    elbowXR: 0.05,
  },
  "emote-salute": {
    ...REST,
    shoulderXR: -0.55,
    shoulderZR: 0.55,
    elbowXR: 2.15,
    headPitch: -0.05,
  },
  "emote-robot": {
    ...REST,
    shoulderXL: 0.9,
    shoulderXR: -0.9,
    elbowXL: 1.57,
    elbowXR: 1.57,
    oscillations: [
      { channel: "shoulderXL", amplitude: 0.7, frequency: 1.4, wave: "square" },
      { channel: "shoulderXR", amplitude: 0.7, frequency: 1.4, wave: "square" },
      { channel: "headPitch", amplitude: 0.15, frequency: 0.7, wave: "square" },
    ],
  },
  "emote-laugh": {
    ...REST,
    shoulderXL: 0.4,
    shoulderXR: 0.4,
    elbowXL: 0.7,
    elbowXR: 0.7,
    oscillations: [
      { channel: "spineLean", amplitude: -0.18, frequency: 2.6 },
      { channel: "headPitch", amplitude: -0.12, frequency: 2.6 },
    ],
  },
};

export const EMOTE_DURATION_MS = 3000;
