"use client";

import { create } from "zustand";
import type { Side } from "@/game/networking/types";

export type ConnectionStatus =
  | "offline"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

interface NetworkState {
  status: ConnectionStatus;
  roomCode: string | null;
  playerName: string;
  isHost: boolean;
  mySide: Side | null;
  opponentPresent: boolean;
  opponentConnected: boolean;
  opponentReady: boolean;
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
  setLocalReady: (localReady) => set({ localReady }),
  setMatchStarted: (matchStarted) => set({ matchStarted }),
  setPing: (ping) => set({ ping }),
  setError: (errorMessage) => set({ errorMessage }),
  reset: () => set({ ...initial }),
}));
