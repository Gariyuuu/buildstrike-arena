"use client";

import { PartySocket } from "partysocket";
import { customAlphabet } from "nanoid";
import type { ClientMessage, ServerMessage } from "@/game/networking/types";
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "@/game/networking/types";

const generateCode = customAlphabet(ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH);
const generateToken = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

export function createRoomCode(): string {
  return generateCode();
}

export class PartyHostUnconfiguredError extends Error {
  constructor() {
    super(
      "Online multiplayer isn't configured on this deployment (NEXT_PUBLIC_PARTY_HOST is unset). Ask the site owner to set it to the deployed party server host.",
    );
    this.name = "PartyHostUnconfiguredError";
  }
}

function getPartyHost(): string {
  const configured = process.env.NEXT_PUBLIC_PARTY_HOST;
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "localhost:8787";
  }
  throw new PartyHostUnconfiguredError();
}

function tokenKey(roomCode: string) {
  return `buildstrike-token-${roomCode}`;
}

export type NetworkEventHandler = (msg: ServerMessage) => void;

export class GameNetworkClient {
  private socket: PartySocket | null = null;
  private listeners = new Set<NetworkEventHandler>();
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  connect(roomCode: string, playerName: string): PartySocket {
    let token = typeof window !== "undefined" ? sessionStorage.getItem(tokenKey(roomCode)) : null;
    if (!token) {
      token = generateToken();
      if (typeof window !== "undefined") sessionStorage.setItem(tokenKey(roomCode), token);
    }

    const socket = new PartySocket({
      host: getPartyHost(),
      party: "game-room",
      room: roomCode.toUpperCase(),
      query: { token, name: playerName },
    });

    socket.addEventListener("message", (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        this.listeners.forEach((fn) => fn(msg));
      } catch {
        // ignore malformed payloads
      }
    });

    this.socket = socket;
    this.pingInterval = setInterval(() => {
      this.send({ type: "ping", t: Date.now() });
    }, 3000);

    return socket;
  }

  onMessage(handler: NetworkEventHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  send(msg: ClientMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(msg));
  }

  disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = null;
    this.socket?.close();
    this.socket = null;
    this.listeners.clear();
  }

  get readyState() {
    return this.socket?.readyState ?? WebSocket.CLOSED;
  }
}
