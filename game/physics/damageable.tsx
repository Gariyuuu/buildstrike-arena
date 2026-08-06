"use client";

import * as THREE from "three";
import { createContext, useContext, useRef, useCallback, type ReactNode } from "react";
import type { EntitySide } from "@/game/shared/side";

export type DamageableKind = "player" | "bot" | "build";
export type DamageableSide = EntitySide;

export interface DamageableEntry {
  id: string;
  kind: DamageableKind;
  side: DamageableSide;
  object: THREE.Object3D; // used as raycast target (invisible hitbox or build mesh)
  headY?: number; // world-space Y above which counts as a headshot
  takeDamage: (amount: number, sourceSide: DamageableSide) => void;
  isAlive: () => boolean;
}

interface RegistryApi {
  register: (entry: DamageableEntry) => void;
  unregister: (id: string) => void;
  all: () => DamageableEntry[];
}

const RegistryContext = createContext<RegistryApi | null>(null);

export function DamageableProvider({ children }: { children: ReactNode }) {
  const map = useRef(new Map<string, DamageableEntry>());

  const register = useCallback((entry: DamageableEntry) => {
    map.current.set(entry.id, entry);
  }, []);
  const unregister = useCallback((id: string) => {
    map.current.delete(id);
  }, []);
  const all = useCallback(() => Array.from(map.current.values()), []);

  const api: RegistryApi = { register, unregister, all };
  return <RegistryContext.Provider value={api}>{children}</RegistryContext.Provider>;
}

export function useDamageableRegistry() {
  const ctx = useContext(RegistryContext);
  if (!ctx) throw new Error("useDamageableRegistry must be used within DamageableProvider");
  return ctx;
}

export interface RaycastHit {
  entry: DamageableEntry;
  point: THREE.Vector3;
  distance: number;
  headshot: boolean;
}

const raycaster = new THREE.Raycaster();

/** Cast a single ray against all registered damageables, excluding a given id, and return the closest hit. */
export function raycastDamageables(
  entries: DamageableEntry[],
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  maxDistance: number,
  excludeId?: string
): RaycastHit | null {
  raycaster.set(origin, direction);
  raycaster.far = maxDistance;
  raycaster.near = 0;

  let closest: RaycastHit | null = null;
  for (const entry of entries) {
    if (entry.id === excludeId) continue;
    if (!entry.isAlive()) continue;
    const intersections = raycaster.intersectObject(entry.object, true);
    if (intersections.length === 0) continue;
    const hit = intersections[0];
    if (closest && hit.distance >= closest.distance) continue;
    const headshot = entry.headY !== undefined && hit.point.y >= entry.headY;
    closest = { entry, point: hit.point.clone(), distance: hit.distance, headshot };
  }
  return closest;
}
