"use client";

import { create } from "zustand";
import type { Side } from "@/game/networking/types";
import type { WeaponId } from "@/game/config/weapons";

export type ConnectionStatus =
  | "offline"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface OpponentInfo {
  displayName: string;
  level: number;
  skinId: string;
  primaryWeapon: WeaponId;
  secondaryWeapon: WeaponId;
}

export interface MatchSettings {
  roundsToWin: number;
  headshotsEnabled: boolean;
  healingEnabled: boolean;
  infiniteBuilds: boolean;
}

export const DEFAULT_MATCH_SETTINGS: MatchSettings = {
  roundsToWin: 5,
  headshotsEnabled: true,
  healingEnabled: true,
  infiniteBuilds: false,
};

interface NetworkState {
  status: ConnectionStatus;
  roomCode: string | null;
  playerName: string;
  isHost: boolean;
  mySide: Side | null;
  opponentPresent: boolean;
  opponentConnected: boolean;
  opponentReady: boolean;
  opponentInfo: OpponentInfo | null;
  matchSettings: MatchSettings;
  localReady: boolean;
  matchStarted: boolean;
  ping: number;
  errorMessage: string | null;
  setStatus: (status: ConnectionStatus) => void;
  setRoomCode: (code: string | null) => void;
  setPlayerName: (name: string) => void;
  setIsHost: (v: boolean) => void;
  setMySide: (side: Side | null) => void;
  setOpponentPresent: (v: boolean) => void;
  setOpponentConnected: (v: boolean) => void;
  setOpponentReady: (v: boolean) => void;
  setOpponentInfo: (info: OpponentInfo) => void;
  setMatchSettings: (settings: MatchSettings) => void;
  setLocalReady: (v: boolean) => void;
  setMatchStarted: (v: boolean) => void;
  setPing: (ms: number) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

const initial = {
  status: "offline" as ConnectionStatus,
  roomCode: null,
  playerName: "Player",
  isHost: false,
  mySide: null,
  opponentPresent: false,
  opponentConnected: false,
  opponentReady: false,
  opponentInfo: null as OpponentInfo | null,
  matchSettings: DEFAULT_MATCH_SETTINGS,
  localReady: false,
  matchStarted: false,
  ping: 0,
  errorMessage: null,
};

export const useNetworkStore = create<NetworkState>((set) => ({
  ...initial,
  setStatus: (status) => set({ status }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setPlayerName: (playerName) => set({ playerName }),
  setIsHost: (isHost) => set({ isHost }),
  setMySide: (mySide) => set({ mySide }),
  setOpponentPresent: (opponentPresent) => set({ opponentPresent }),
  setOpponentConnected: (opponentConnected) => set({ opponentConnected }),
  setOpponentReady: (opponentReady) => set({ opponentReady }),
  setOpponentInfo: (opponentInfo) => set({ opponentInfo }),
  setMatchSettings: (matchSettings) => set({ matchSettings }),
  setLocalReady: (localReady) => set({ localReady }),
  setMatchStarted: (matchStarted) => set({ matchStarted }),
  setPing: (ping) => set({ ping }),
  setError: (errorMessage) => set({ errorMessage }),
  reset: () => set({ ...initial }),
}));
