import { nanoid } from "nanoid";
import { BR_MAX_PLAYERS, BR_MAP_RADIUS, type SquadSize } from "@/game/config/battleRoyale";

export const LOCAL_AGENT_ID = "local";

export interface BRAgentSpawn {
  id: string;
  name: string;
  isBot: boolean;
  squadId: number;
  spawnAngle: number;
  spawnRadius: number;
}

const BOT_NAME_POOL = [
  "Ashfall", "Cinder", "Ridge", "Vex", "Rook", "Talon", "Static", "Onyx", "Fable", "Grit",
  "Marrow", "Slate", "Junco", "Ember", "Drift", "Vane", "Wraith", "Coyle", "Marsh", "Blaze",
];

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Builds a full 20-agent roster (1 local human + bots filling every other
 * seat) grouped into squads of `squadSize`, each with a drop position spread
 * evenly around the map so agents don't all land on top of each other. */
export function generateRoster(squadSize: SquadSize): BRAgentSpawn[] {
  const names = shuffled(BOT_NAME_POOL);
  const agents: BRAgentSpawn[] = [];
  const total = BR_MAX_PLAYERS;
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
    const radius = BR_MAP_RADIUS * (0.35 + Math.random() * 0.55);
    agents.push({
      id: i === 0 ? LOCAL_AGENT_ID : nanoid(6),
      name: i === 0 ? "You" : names[(i - 1) % names.length],
      isBot: i !== 0,
      squadId: Math.floor(i / squadSize),
      spawnAngle: angle,
      spawnRadius: radius,
    });
  }
  return agents;
}

export function squadCountAlive(agents: { squadId: number; alive: boolean }[]): number {
  return new Set(agents.filter((a) => a.alive).map((a) => a.squadId)).size;
}

export function playersAlive(agents: { alive: boolean }[]): number {
  return agents.filter((a) => a.alive).length;
}
