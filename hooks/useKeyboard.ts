"use client";

import { useEffect, useRef } from "react";

export interface KeyboardState {
  pressed: Set<string>;
  /** Keys pressed since last drain — for discrete one-shot actions. */
  justPressed: Set<string>;
}

/**
 * Global keyboard tracker. Returns a stable ref so game loops can read
 * key state every frame without causing React re-renders.
 */
export function useKeyboard(enabled: boolean = true) {
  const state = useRef<KeyboardState>({ pressed: new Set(), justPressed: new Set() });

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = normalizeKey(e);
      if (!state.current.pressed.has(key)) state.current.justPressed.add(key);
      state.current.pressed.add(key);
      // Prevent page scroll on space/arrow keys while playing.
      if ([" ", "Space"].includes(e.code)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      state.current.pressed.delete(normalizeKey(e));
    };
    const onBlur = () => {
      state.current.pressed.clear();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled]);

  return state;
}

/** Exported so the keybind-rebinding UI and any raw (non-hook) keydown
 * listeners (see HUD.tsx's emote-wheel key) use the exact same key-string
 * format as this hook's pressed/justPressed sets — otherwise a key captured
 * in Settings would never match what the game loop checks for. */
export function normalizeKey(e: KeyboardEvent): string {
  if (e.code.startsWith("Key")) return e.code.slice(3).toLowerCase();
  if (e.code.startsWith("Digit")) return e.code.slice(5);
  if (e.code.startsWith("Shift")) return "shift";
  if (e.code.startsWith("Control")) return "control";
  if (e.code.startsWith("Alt")) return "alt";
  if (e.code === "Escape") return "escape";
  return e.key.length === 1 ? e.key.toLowerCase() : e.code;
}

/** Drain justPressed for this frame — call once per frame from the game loop. */
export function drainJustPressed(state: React.RefObject<KeyboardState>) {
  const keys = Array.from(state.current.justPressed);
  state.current.justPressed.clear();
  return keys;
}
