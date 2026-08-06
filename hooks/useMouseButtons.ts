"use client";

import { useEffect, useRef } from "react";

export interface MouseButtonState {
  left: boolean;
  right: boolean;
  leftJustPressed: boolean;
  rightJustPressed: boolean;
  wheelDelta: number; // accumulated since last drain
}

/** Tracks mouse button state on a target element while pointer lock is engaged. */
export function useMouseButtons(targetRef: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const state = useRef<MouseButtonState>({ left: false, right: false, leftJustPressed: false, rightJustPressed: false, wheelDelta: 0 });

  useEffect(() => {
    const el = targetRef.current;
    if (!el || !enabled) return;

    const onDown = (e: MouseEvent) => {
      if (e.button === 0) {
        if (!state.current.left) state.current.leftJustPressed = true;
        state.current.left = true;
      }
      if (e.button === 2) state.current.right = true;
    };
    const onUp = (e: MouseEvent) => {
      if (e.button === 0) state.current.left = false;
      if (e.button === 2) state.current.right = false;
    };
    const onWheel = (e: WheelEvent) => {
      state.current.wheelDelta += Math.sign(e.deltaY);
    };
    const onContextMenu = (e: Event) => e.preventDefault();
    const onBlur = () => {
      state.current.left = false;
      state.current.right = false;
    };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("blur", onBlur);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("blur", onBlur);
    };
  }, [targetRef, enabled]);

  return state;
}

/** Call once per frame to drain the "just pressed" edge flags. */
export function drainMouseEdges(state: React.RefObject<MouseButtonState>) {
  const left = state.current.leftJustPressed;
  const wheel = state.current.wheelDelta;
  state.current.leftJustPressed = false;
  state.current.rightJustPressed = false;
  state.current.wheelDelta = 0;
  return { leftJustPressed: left, wheelDelta: wheel };
}
