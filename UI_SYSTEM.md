# UI_SYSTEM.md

## Layout system

Single-page, no router-based navigation. `app/page.tsx` renders exactly
one of four full-viewport "screens" based on `stores/gameStore.ts`'s
`screen` value (`"menu" | "instructions" | "settings" | "playing"`).
There is no nested layout system, no shared chrome between screens (each
screen component owns its full-viewport background).

During `"playing"`, `components/game/GameCanvas.tsx` renders the R3F
`<Canvas>` and then `components/ui/HUD.tsx` as an absolutely-positioned
DOM sibling on top of it (`<div className="relative h-full w-full">`
wrapping both). HUD itself is `pointer-events-none` at the root, with
specific overlays (`PauseMenu`, `MatchResults`, `OnlineLobbyOverlay`)
opting back into `pointer-events-auto` so the underlying 3D scene stays
click-through everywhere else (needed for pointer-lock click-to-engage).

## Navigation

No `<Link>`/router navigation exists. All screen transitions are
`gameStore.setScreen(...)` calls from button `onClick` handlers. See
`FILE_MAP.md` → "add a menu screen."

## Page structure

| Screen | Component | Notes |
|---|---|---|
| `menu` | `components/ui/Lobby.tsx` (renamed/refactored from a prior `components/ui/Lobby.tsx`, per session-log history) | Logo, Bot Duel / Online 1v1 tabs, difficulty picker, room create/join, Instructions/Settings buttons |
| `instructions` | `components/ui/InstructionsModal.tsx` | Full control scheme table + item explanations; "Got it" returns to `"playing"` if a mode was already chosen, else `"menu"` |
| `settings` | `components/ui/SettingsPanel.tsx` | Also embeddable (via `onBack` prop) inside `components/ui/PauseMenu.tsx` without leaving an active match |
| `playing` | `components/game/GameCanvas.tsx` + `components/ui/HUD.tsx` | The actual game |

## Reusable components / component hierarchy

```
HUD.tsx (composition root during "playing")
├── Crosshair.tsx              (center reticle, color reacts to build-mode/reload)
├── CombatHud.tsx              (bottom-left health/shield bars, bottom-right ammo/inventory,
│                                heal progress ring, hit marker, damage flash,
│                                elimination banner, FPS counter — all internal
│                                sub-components in this one file)
├── Scoreboard.tsx              (top-center score/round, countdown banner, round-end banner)
├── ConnectionStatus.tsx        (online mode only — connection pip/ping, disconnect banners)
├── PauseMenu.tsx                (shown when gameStore.paused; embeds SettingsPanel)
├── MatchResults.tsx             (shown when matchStore.phase === "match-end")
└── OnlineLobbyOverlay.tsx       (online mode only, shown until networkStore.matchStarted)
```

No shared "Button"/"Card"/"Modal" primitive components exist — every
screen/overlay hand-writes its own markup using the shared `className`
strings below. This is a flat, non-componentized UI layer by choice
(**Inferred** — consistent with the project's small scope; no comment
states this as deliberate).

## Themes

**One fixed dark theme. No light mode, no toggle, no `prefers-color-scheme`
handling found anywhere.** This is a deliberate product choice for a
game HUD, not an oversight — but flag it clearly to anyone assuming
Tailwind projects default to supporting both.

## Design tokens — exact file locations

All in `app/globals.css` (Tailwind v4 CSS-based config — **no**
`tailwind.config.js`/`.ts` exists in this project):

```css
:root {
  --bs-navy-950: #05070d;
  --bs-navy-900: #0a0e17;
  --bs-navy-800: #101725;
  --bs-cyan: #33e6ff;
  --bs-cyan-dim: #1c8fa3;
  --bs-orange: #ff8a33;
  --bs-red: #ff4d4d;
}
@theme inline {
  --color-bs-navy-950: var(--bs-navy-950);
  /* ...mapped into Tailwind's `bg-bs-navy-950`/`text-bs-cyan`/etc. utility classes */
}
```

Plus hand-written utility classes in the same file:
`.glass-panel` (translucent blurred panel — the base for every menu/HUD
card), `.btn-primary` (cyan gradient), `.btn-secondary` (subtle white
outline), `.btn-orange` (orange gradient, used for "destructive"-ish/
warning actions like Return to Menu).

## Typography

No custom font is loaded — `app/layout.tsx` does **not** use
`next/font` (the default create-next-app Geist font setup was removed;
verified by its absence in `layout.tsx`). Body font falls back to `ui-sans-serif,
system-ui, -apple-system, "Segoe UI", sans-serif` (set in
`app/globals.css`'s `body` rule).

## Spacing / border radius / shadows

No custom spacing/radius scale beyond Tailwind's defaults. `.glass-panel`
uses `border-radius: 1rem` and a hand-tuned `box-shadow` for the
"floating panel" look; buttons use `border-radius: 0.75rem`.

## Breakpoints

Tailwind's default breakpoints only (`sm:`/`md:`/etc. used ad hoc in
`components/ui/Lobby.tsx`/`components/ui/SettingsPanel.tsx`/`components/ui/InstructionsModal.tsx` grid layouts).
No custom breakpoint configuration exists.

## Animations

CSS keyframes in `app/globals.css`:
- `bs-flash-in` (`.bs-damage-flash`) — full-screen red vignette on taking damage
- `bs-hitmarker` (`.bs-hitmarker`) — scale/fade pop for the hit-confirm X
- `bs-pulse` (`.bs-pulse`) — slow opacity pulse (loading logo, connection status pips)
- `bs-pop-in` (`.bs-pop-in`) — translate+scale entrance for menu panels
- `bs-loading` (inline `<style>` in `components/ui/LoadingScreen.tsx` only) — the loading-bar sweep

3D-space animation (character leg swing, weapon reload tilt, muzzle
flash) is done imperatively per-frame inside `useFrame` callbacks, not
CSS — see `ARCHITECTURE.md`.

## Icon system

No icon library. The only graphic asset is `public/logo.svg` (also the
source for `app/icon.svg`, the favicon). All in-HUD "icons" (crosshair,
hit marker) are hand-drawn inline SVG or CSS shapes.

## Image asset conventions

Two `<img>` tags exist (`components/ui/Lobby.tsx`, `components/ui/LoadingScreen.tsx`), both
pointing at `/logo.svg`, both flagged by ESLint's
`@next/next/no-img-element` as **warnings** (not errors — verified via
`npx eslint .`, exit code 0). Not using `next/image` here is a
reasonable choice for a tiny SVG logo; not fixed, not blocking.

## Modals

No portal-based modal system (no `createPortal`, no dialog library).
"Modals" (`InstructionsModal`, `PauseMenu`, `MatchResults`,
`OnlineLobbyOverlay`) are just absolutely-positioned full-screen
`<div>`s rendered inline in the tree — acceptable given there's never
more than one such overlay active at a time by construction (mutually
exclusive `gameStore`/`matchStore`/`networkStore` conditions gate them).

## Notifications

No toast/notification system. Feedback is either inline (error text in
`components/ui/OnlineLobbyOverlay.tsx`) or a themed banner
(`components/ui/ConnectionStatus.tsx`'s disconnect banners, `components/ui/CombatHud.tsx`'s
elimination banner).

## Forms

Two real form inputs in the whole app: the player-name text input and
room-code text input in `components/ui/Lobby.tsx` (plain controlled `<input>`, no
form library, no `<form>` element, submission via button `onClick`, not
`onSubmit`). Settings use `<input type="range">`/`<input type="checkbox">`,
also uncontrolled-via-library, directly wired to `settingsStore.set()`.

## Loading states

- App-level: `components/ui/LoadingScreen.tsx`, used as the `next/dynamic` loading
  fallback while `GameCanvas` (and its heavy R3F/Rapier dependencies)
  streams in.
- In-HUD: "Reloading…" text replaces the ammo counter during weapon
  reload (`components/ui/CombatHud.tsx`); "Connecting…"/"Waiting for opponent…" text
  states on the Ready button (`components/ui/OnlineLobbyOverlay.tsx`); a circular
  progress ring during healing (`components/ui/CombatHud.tsx`'s `HealProgress`).

## Empty states

Minimal — this app has very little "no data yet" surface. The closest
examples: `components/ui/OnlineLobbyOverlay.tsx`'s "Waiting for opponent to join…"
button label when `opponentPresent` is false, and `components/ui/CombatHud.tsx`'s
build-health bar which simply doesn't render when a build is at full
health (`damagedFraction < 1` check).

## Error states

See `ARCHITECTURE.md` → Error handling. UI-visible error surfaces:
`components/ui/OnlineLobbyOverlay.tsx` (`networkStore.errorMessage`),
`components/ui/ConnectionStatus.tsx` ("Connection Lost" full-screen message when
`status === "disconnected"`). No generic error boundary exists anywhere
in the component tree.

## Accessibility

Not a focus area of this build — no explicit ARIA attributes, no
keyboard-navigation audit, no screen-reader considerations found. The
game itself is inherently mouse-aim-dependent (pointer lock + FPS-style
camera control), which is a hard accessibility ceiling for this genre
regardless of UI polish. `components/ui/Lobby.tsx` does explicitly tell the user
"Keyboard and mouse recommended" as a responsive-design disclosure, not
an accessibility feature per se.

## Browser support

Not documented/tested explicitly. Relies on: Pointer Lock API, Web Audio
API, WebGL2 (via Three.js/R3F), WebSocket — all broadly supported in
current evergreen browsers, unsupported in very old browsers with no
fallback/detection for that case.

## Known visual inconsistencies

- The two "Reset Arena" buttons (`components/ui/PauseMenu.tsx`, `components/ui/MatchResults.tsx`)
  look and are labeled identically but behave differently in online mode
  — see `TASKS.md` `BUG-004`. This is a *behavioral* inconsistency more
  than visual, but worth flagging here since a UI review would spot the
  duplicate button before spotting the behavior gap.
- No explicit UI feedback exists for a server-rejected build placement
  (`buildRejected` message is unhandled client-side — `TASKS.md` `T-007`)
  — the ghost preview simply never confirms, which could read as a
  transient glitch rather than a clear "denied" state.
