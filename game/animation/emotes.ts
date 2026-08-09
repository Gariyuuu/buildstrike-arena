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
    // Shallow bend on purpose: past a ~90 degree shoulder swing (this is
    // ~120), a deep elbow bend reads as the forearm hyperextending backward
    // instead of a raised waving arm — the same combo that looks fine at
    // rifle/reload's much smaller shoulder angles breaks down out here.
    elbowXR: 0.4,
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
    // The square-wave oscillation below swings shoulderXR as far as -1.6 at
    // its extreme — past the point where a deep elbow bend reads as
    // hyperextended (see emote-wave) — so this side stays shallow.
    elbowXR: 0.5,
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
  "emote-shuffle": {
    ...REST,
    shoulderXL: 0.3,
    shoulderXR: 0.3,
    shoulderZL: 0.4,
    shoulderZR: 0.4,
    elbowXL: 0.6,
    elbowXR: 0.6,
    oscillations: [
      { channel: "shoulderZL", amplitude: 0.4, frequency: 2.0 },
      { channel: "shoulderZR", amplitude: 0.4, frequency: 2.0 },
      { channel: "hipDrop", amplitude: -0.05, frequency: 4.0 },
      { channel: "spineLean", amplitude: 0.1, frequency: 2.0 },
    ],
  },
  "emote-fistpump": {
    ...REST,
    shoulderXR: -1.8,
    // A raised fist pump reads better mostly straight anyway — see the
    // emote-wave comment for why a deep bend out here looks hyperextended.
    elbowXR: 0.3,
    shoulderXL: 0.3,
    elbowXL: 0.3,
    oscillations: [
      { channel: "shoulderXR", amplitude: 0.5, frequency: 2.6 },
      { channel: "hipDrop", amplitude: -0.04, frequency: 2.6 },
    ],
  },
  "emote-spinflex": {
    ...REST,
    // A double-biceps flex: arms out to the sides (shoulderZ) and bent up,
    // rather than swept back (shoulderX) — the previous version combined a
    // ~80 degree shoulderX swing with a very deep elbow bend, which is
    // exactly the combination that reads as the forearm hyperextending
    // backward (see emote-wave).
    shoulderXL: -0.25,
    shoulderXR: -0.25,
    shoulderZL: 1.1,
    shoulderZR: 1.1,
    elbowXL: 1.6,
    elbowXR: 1.6,
    oscillations: [
      { channel: "spineLean", amplitude: 0.3, frequency: 0.6 },
      { channel: "headPitch", amplitude: 0.15, frequency: 0.6 },
    ],
  },
  "emote-airguitar": {
    ...REST,
    shoulderXL: 0.8,
    shoulderXR: 0.5,
    shoulderZL: 0.3,
    shoulderZR: 0.6,
    elbowXL: 1.5,
    elbowXR: 0.9,
    oscillations: [
      { channel: "elbowXR", amplitude: 0.5, frequency: 4.5 },
      { channel: "spineLean", amplitude: 0.12, frequency: 2.2 },
      { channel: "headPitch", amplitude: 0.1, frequency: 2.2 },
    ],
  },
  "emote-moonwalk": {
    ...REST,
    shoulderXL: 0.5,
    shoulderXR: -0.9,
    shoulderZL: 0.15,
    shoulderZR: 0.15,
    elbowXL: 0.3,
    elbowXR: 0.3,
    spineLean: -0.1,
    oscillations: [
      { channel: "hipDrop", amplitude: -0.05, frequency: 1.8 },
      { channel: "shoulderZL", amplitude: 0.2, frequency: 1.8 },
    ],
  },
  "emote-breakdance": {
    ...REST,
    shoulderXL: -0.6,
    shoulderXR: -0.6,
    shoulderZL: 0.8,
    shoulderZR: 0.8,
    elbowXL: 1.2,
    elbowXR: 1.2,
    hipDrop: -0.15,
    oscillations: [
      { channel: "spineLean", amplitude: 0.35, frequency: 1.3 },
      { channel: "hipDrop", amplitude: -0.12, frequency: 1.3 },
      { channel: "shoulderXL", amplitude: 0.4, frequency: 1.3 },
      { channel: "shoulderXR", amplitude: -0.4, frequency: 1.3 },
    ],
  },
  "emote-powerstance": {
    ...REST,
    shoulderXL: 0.65,
    shoulderXR: 0.65,
    shoulderZL: 0.75,
    shoulderZR: 0.75,
    elbowXL: 1.85,
    elbowXR: 1.85,
    hipDrop: -0.06,
    spineLean: -0.05,
  },
  "emote-freezeframe": {
    ...REST,
    shoulderXL: -1.2,
    shoulderXR: 0.4,
    shoulderZL: 0.6,
    shoulderZR: 0.2,
    elbowXL: 0.3,
    elbowXR: 1.6,
    spineLean: -0.12,
    headPitch: -0.08,
  },
};

export const EMOTE_DURATION_MS = 3000;
