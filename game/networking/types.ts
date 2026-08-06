// Shared WebSocket protocol between the Next.js client and the PartyServer
// (Cloudflare Durable Object) room in party/server.ts. Kept dependency-free
// so it can be imported from both the app and the Worker bundle.
import type { WeaponId } from "../config/weapons";
import type { BuildKind } from "../config/builds";
import type { HealingItemId } from "../config/healing";

export type Side = "a" | "b";
export type Vec3 = [number, number, number];

// ---------- Client -> Server ----------

export interface ReadyMsg {
  type: "ready";
}
export interface StateMsg {
  type: "state";
  position: Vec3;
  rotationY: number;
  isBuildMode: boolean;
  buildKind: BuildKind;
  weapon: WeaponId;
  timestamp: number;
}
export interface FireMsg {
  type: "fire";
  weapon: WeaponId;
  origin: Vec3;
  direction: Vec3;
  timestamp: number;
  hitPlayer?: { headshot: boolean; pellets: number };
  hitBuild?: { buildId: string; pellets: number };
}
export interface BuildPlaceMsg {
  type: "buildPlace";
  clientId: string;
  kind: BuildKind;
  position: Vec3;
  rotationY: number;
}
export interface HealMsg {
  type: "healStart" | "healCancel" | "healComplete";
  item: HealingItemId;
}
export interface ResetRequestMsg {
  type: "resetRequest";
}
export interface RematchRequestMsg {
  type: "rematchRequest";
}
export interface PingMsg {
  type: "ping";
  t: number;
}
export interface LeaveMsg {
  type: "leave";
}

export type ClientMessage =
  | ReadyMsg
  | StateMsg
  | FireMsg
  | BuildPlaceMsg
  | HealMsg
  | ResetRequestMsg
  | RematchRequestMsg
  | PingMsg
  | LeaveMsg;

// ---------- Server -> Client ----------

export interface WelcomeMsg {
  type: "welcome";
  side: Side;
  roomCode: string;
  opponentPresent: boolean;
}
export interface RoomStatusMsg {
  type: "roomStatus";
  opponentPresent: boolean;
  opponentConnected: boolean;
  opponentReady: boolean;
}
export interface MatchStartMsg {
  type: "matchStart";
  countdown: number;
  /**
   * True only for a genuinely fresh match (first start from the lobby, or a
   * rematch) — false for the countdown that begins every ordinary next round
   * within an already-running match. The client needs this to know whether
   * to reset score/round to zero (see BUG-007/BUG-009 in TASKS.md — the
   * first version of this fix reset score on every round transition too,
   * since both cases broadcast "matchStart" and looked identical on the wire).
   */
  isNewMatch: boolean;
}
export interface RoundStartMsg {
  type: "roundStart";
  round: number;
}
export interface OpponentStateMsg {
  type: "opponentState";
  position: Vec3;
  rotationY: number;
  isBuildMode: boolean;
  buildKind: BuildKind;
  weapon: WeaponId;
  timestamp: number;
}
export interface OpponentFiredMsg {
  type: "opponentFired";
  weapon: WeaponId;
  origin: Vec3;
  direction: Vec3;
}
export interface DamageAppliedMsg {
  type: "damageApplied";
  target: Side;
  health: number;
  shield: number;
  damage: number;
  headshot: boolean;
}
export interface BuildConfirmedMsg {
  type: "buildConfirmed";
  clientId: string;
  build: {
    id: string;
    kind: BuildKind;
    owner: Side;
    position: Vec3;
    rotationY: number;
    health: number;
    maxHealth: number;
  };
}
export interface BuildRejectedMsg {
  type: "buildRejected";
  clientId: string;
}
export interface BuildDamagedMsg {
  type: "buildDamaged";
  buildId: string;
  health: number;
}
export interface BuildDestroyedMsg {
  type: "buildDestroyed";
  buildId: string;
}
export interface HealAppliedMsg {
  type: "healApplied";
  side: Side;
  item: HealingItemId;
  health: number;
  shield: number;
  event: "start" | "cancel" | "complete";
}
export interface RoundEndMsg {
  type: "roundEnd";
  winner: Side;
  score: Record<Side, number>;
}
export interface MatchEndMsg {
  type: "matchEnd";
  winner: Side;
}
export interface RoundResetMsg {
  type: "roundReset";
}
export interface OpponentDisconnectedMsg {
  type: "opponentDisconnected";
}
export interface OpponentReconnectedMsg {
  type: "opponentReconnected";
}
/**
 * Sent (in addition to the normal `welcome`) when a client reconnects with a
 * token matching an existing slot while a match is already in progress
 * (phase !== "lobby") — without this, a reconnecting client has no way to
 * know the match already started and gets stuck on the pre-match lobby
 * screen forever (BUG-008, found via a live two-client test — see
 * DECISIONS.md / TASKS.md).
 */
export interface MatchResumeMsg {
  type: "matchResume";
  phase: "countdown" | "combat" | "round-end" | "match-end";
  round: number;
  score: Record<Side, number>;
  yourHealth: number;
  yourShield: number;
  opponentHealth: number;
  opponentShield: number;
  builds: {
    id: string;
    kind: BuildKind;
    owner: Side;
    position: Vec3;
    rotationY: number;
    health: number;
    maxHealth: number;
  }[];
}
export interface PongMsg {
  type: "pong";
  t: number;
}
export interface ErrorMsg {
  type: "error";
  message: string;
}

export type ServerMessage =
  | WelcomeMsg
  | RoomStatusMsg
  | MatchStartMsg
  | RoundStartMsg
  | OpponentStateMsg
  | OpponentFiredMsg
  | DamageAppliedMsg
  | BuildConfirmedMsg
  | BuildRejectedMsg
  | BuildDamagedMsg
  | BuildDestroyedMsg
  | HealAppliedMsg
  | RoundEndMsg
  | MatchEndMsg
  | RoundResetMsg
  | OpponentDisconnectedMsg
  | OpponentReconnectedMsg
  | MatchResumeMsg
  | PongMsg
  | ErrorMsg;

export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
export const ROOM_CODE_LENGTH = 5;
