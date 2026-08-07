export type BotDifficulty = "easy" | "normal" | "hard" | "expert";

export interface BotDifficultyConfig {
  aimAccuracy: number; // 0-1, higher = tighter aim toward target
  reactionTime: number; // seconds before bot reacts to seeing player
  fireDecisionInterval: number; // seconds between fire decisions
  aggression: number; // 0-1, likelihood to push vs hold
  buildLikelihood: number; // 0-1, chance to throw up defense when hit
  healThreshold: number; // health fraction below which bot tries to heal
  moveSpeedMultiplier: number;
  viewDistance: number;
}

export const BOT_DIFFICULTY: Record<BotDifficulty, BotDifficultyConfig> = {
  easy: {
    aimAccuracy: 0.35,
    reactionTime: 0.55,
    fireDecisionInterval: 0.9,
    aggression: 0.3,
    buildLikelihood: 0.25,
    healThreshold: 0.35,
    moveSpeedMultiplier: 0.85,
    viewDistance: 26,
  },
  normal: {
    aimAccuracy: 0.6,
    reactionTime: 0.32,
    fireDecisionInterval: 0.55,
    aggression: 0.5,
    buildLikelihood: 0.5,
    healThreshold: 0.45,
    moveSpeedMultiplier: 1,
    viewDistance: 32,
  },
  hard: {
    aimAccuracy: 0.85,
    reactionTime: 0.15,
    fireDecisionInterval: 0.3,
    aggression: 0.75,
    buildLikelihood: 0.75,
    healThreshold: 0.55,
    moveSpeedMultiplier: 1.1,
    viewDistance: 40,
  },
  expert: {
    aimAccuracy: 0.96,
    reactionTime: 0.08,
    fireDecisionInterval: 0.2,
    aggression: 0.85,
    buildLikelihood: 0.85,
    healThreshold: 0.6,
    moveSpeedMultiplier: 1.15,
    viewDistance: 48,
  },
};
