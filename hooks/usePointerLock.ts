"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/** Manages pointer-lock state for a target element and exposes mouse deltas via a ref. */
export function usePointerLock(targetRef: React.RefObject<HTMLElement | null>) {
  const [locked, setLocked] = useState(false);
  const delta = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      delta.current.x += e.movementX || 0;
      delta.current.y += e.movementY || 0;
    };
    const onLockChange = () => setLocked(document.pointerLockElement === el);
    const onLockError = () => setLocked(false);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("pointerlockerror", onLockError);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("pointerlockerror", onLockError);
    };
  }, [targetRef]);

  const requestLock = useCallback(() => {
    // requestPointerLock() returns a Promise in modern browsers that can
    // reject (rapid re-requests, focus loss, unsupported embedding context).
    // Swallow failures — onLockError/pointerlockchange already keep `locked`
    // in sync, and the user can just click again.
    const result = targetRef.current?.requestPointerLock() as unknown;
    if (result instanceof Promise) result.catch(() => {});
  }, [targetRef]);

  const exitLock = useCallback(() => {
    if (document.pointerLockElement) document.exitPointerLock();
  }, []);

  /** Call once per frame to drain accumulated mouse delta. */
  const consumeDelta = useCallback(() => {
    const d = { x: delta.current.x, y: delta.current.y };
    delta.current.x = 0;
    delta.current.y = 0;
    return d;
  }, []);

  return { locked, requestLock, exitLock, consumeDelta };
}
