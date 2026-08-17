# DECISIONS.md

Architectural decision log. Reasoning is labeled **Verified** when it is
backed by an explicit in-repo comment or doc (quoted/paraphrased with a
file:line pointer) and **Inferred** when reconstructed from code
structure/naming with no explicit written justification found. No
decision reasoning below is fabricated beyond what one of those two
sources supports.

---

## D-001 — No database of any kind

- **Date:** Unknown (project inception)
- **Status:** Accepted, in effect
- **Context:** The game needs no persistent user data — no accounts, no
  cross-session state, no leaderboards.
- **Decision:** Use no database. Settings persist to `localStorage`
  client-side; match state is in-memory only in both the browser tab and
  the Durable Object.
- **Reasoning:** **Inferred** from the product scope (a stateless,
  no-account casual game) and the complete absence of any DB-related
  code, config, or dependency anywhere in the repo.
- **Alternatives considered:** None documented in-repo.
- **Consequences:** Zero persistence — closing a tab or losing a Durable
  Object instance loses all state. See `DATABASE.md`.
- **Affected files:** Entire project (absence of a `db/`, `prisma/`,
  `drizzle/`, or similar directory is itself the evidence).
- **Verification:** Verified (absence confirmed by repo-wide search).

## D-002 — PartyServer + Cloudflare Workers instead of Next.js API routes for realtime

- **Date:** Unknown (project inception)
- **Status:** Accepted, in effect
- **Context:** Online 1v1 needs a persistent WebSocket connection to
  relay state and referee matches. Vercel serverless functions are
  request/response and cannot hold a WebSocket open.
- **Decision:** Ship a separate Cloudflare Worker (`party/server.ts`)
  using the `partyserver` library (Durable Objects), deployed
  independently via `wrangler`.
- **Reasoning:** **Verified** — `README.md`'s "Multiplayer backend
  setup" section states this explicitly: *"Standard Vercel serverless
  functions are request/response and don't hold a WebSocket connection
  open, so this project ships a small, free-tier-friendly realtime
  server built with PartyServer on Cloudflare Workers + Durable Objects
  instead."*
- **Alternatives considered (per README):** A plain Node WebSocket
  server on any host that supports long-lived connections (Fly.io,
  Render, Railway, a VPS), or PartyKit's own hosted platform — both
  listed in `README.md` → "Alternative deployment" as viable swaps if
  the message protocol (`game/networking/types.ts`) and shared logic
  (`game/config/*`, `game/building/grid.ts`) are reused.
- **Consequences:** Two separate deployables in one repo, coordinated
  only by the `NEXT_PUBLIC_PARTY_HOST` env var and the shared TypeScript
  message protocol (no schema versioning).
- **Affected files:** `party/server.ts`, `party/tsconfig.json`,
  `wrangler.jsonc`, `game/networking/*`.
- **Verification:** Verified.

## D-003 — `partyserver` (raw Durable Objects) instead of the PartyKit CLI

- **Date:** Unknown
- **Status:** Accepted, in effect
- **Context:** PartyKit offers both a hosted CLI-deploy workflow
  (`partykit deploy`) and the lower-level `partyserver` library that
  deploys via plain `wrangler`.
- **Decision:** Use `partyserver` + `wrangler deploy` directly, not the
  `partykit` CLI.
- **Reasoning:** **Inferred** — no comment in this repo states the
  reason, but `package.json`'s scripts (`party:dev`/`party:deploy` both
  invoke `wrangler`, not `partykit`) and the presence of `wrangler.jsonc`
  (not a `partykit.json`) confirm the choice. Cannot verify the original
  motivation from this repository alone.
- **Alternatives considered:** Not documented in-repo.
- **Consequences:** Deployment requires `wrangler login` + `wrangler
  deploy`/`dev` directly rather than a single `partykit` CLI command.
- **Affected files:** `package.json` scripts, `wrangler.jsonc`.
- **Verification:** Inferred (from config/script evidence, not a written
  rationale).

## D-004 — `reactStrictMode: false`

- **Date:** Unknown (same build session as the rest of the project)
- **Status:** Accepted, in effect — **do not revert without re-verifying**
- **Context:** React Strict Mode's dev-only double-invocation of
  `useMemo` caused `game/physics/useCharacterMover.ts`'s
  `world.createCharacterController(0.04)` to run twice against the same
  Rapier world, corrupting the resulting controller object (subsequent
  frames threw `TypeError: Cannot read properties of undefined (reading
  'computeColliderMovement')`). This was reproduced live (not just
  theorized) via a Playwright browser session during development, then
  fixed, then re-verified with a clean console.
- **Decision:** Disable React Strict Mode entirely for this project.
- **Reasoning:** **Verified** — `next.config.ts`'s comment states:
  *"React Strict Mode intentionally double-invokes render/useMemo in
  development to surface impure code. That's incompatible with the
  Rapier physics world... Strict Mode has no effect on production builds
  either way, so disabling it only changes dev-time behavior."*
- **Alternatives considered:** Keeping Strict Mode and instead guarding
  `useCharacterMover`'s `useMemo` against double-creation (e.g., a
  module-level dedup key) was not attempted/documented — the simpler
  global disable was chosen instead.
- **Consequences:** This project will not benefit from Strict Mode's
  other dev-time checks (detecting other classes of impure
  render/effect bugs) anywhere in the app, not just in the R3F tree.
- **Affected files:** `next.config.ts`,
  `game/physics/useCharacterMover.ts` (see D-004b below).
- **Verification:** Verified (in-repo comment + reproduced-and-fixed in
  this session's development history).

## D-004b — No cleanup of the Rapier character controller on unmount

- **Date:** Same as D-004
- **Status:** Accepted, in effect
- **Context:** A companion fix to D-004 — the original code called
  `world.removeCharacterController(controller)` in a `useEffect` cleanup,
  which (even with Strict Mode later disabled) is unsafe because a
  double-invoked cleanup+re-effect cycle could still free a controller
  that's still referenced by the memoized value.
- **Decision:** Do not explicitly remove the character controller on
  unmount at all.
- **Reasoning:** **Verified** — `game/physics/useCharacterMover.ts`'s comment:
  *"Not explicitly removed on unmount: the whole Rapier World (and every
  controller/collider/body it owns) is torn down when `<Physics>`
  unmounts... removing it eagerly here is unsafe under React StrictMode's
  dev-only double-invoked effects."*
- **Consequences:** A very minor resource-lifetime looseness within a
  single still-mounted `<Physics>` tree (not a leak across full page
  sessions, since the whole world is destroyed on unmount regardless).
- **Affected files:** `game/physics/useCharacterMover.ts`.
- **Verification:** Verified.

## D-005 — Disabling four React Compiler ESLint hook rules for game-engine code

- **Date:** Same build session
- **Status:** Accepted, in effect
- **Context:** `eslint-config-next` 16.3.0 enables new React Compiler
  lint rules (`react-hooks/purity`, `immutability`, `refs`,
  `set-state-in-effect`) that assume typical component render bodies.
  React Three Fiber's `useFrame` callback intentionally runs every
  animation frame, outside React's render phase, mutating
  `Object3D`/camera properties directly and reading `performance.now()`
  — all flagged as violations by these rules even though it's the
  correct, idiomatic r3f pattern.
- **Decision:** Scope-disable those four rules for
  `components/game/**`, `game/**`, `hooks/**` only, via
  `eslint.config.mjs`. Leave them enabled everywhere else
  (`components/ui/**`, `app/**`, `stores/**`).
- **Reasoning:** **Verified** — `eslint.config.mjs`'s comment: *"The
  React Compiler hook rules... assume typical component render bodies.
  react-three-fiber's `useFrame` callback intentionally runs outside
  React's render phase every animation frame and mutates Object3D/camera
  properties directly — that's the correct, idiomatic r3f pattern, not a
  purity violation."* Several genuine violations of the same *shape* were
  also found and fixed in `components/ui/*` during the same session
  (`components/ui/CombatHud.tsx`'s `DamageFlash`/`HitMarker` refactored to derive the
  animation `key` directly from the trigger timestamp instead of
  `useState`+`useEffect`; `components/game/OnlineDuelScene.tsx`'s `handleMessage`/
  `translate` hoisted above the `useEffect` that references them) —
  confirming the rules were correctly *kept* enabled outside the game
  tree, not blanket-disabled out of convenience.
- **Alternatives considered:** Rewriting all `useFrame` bodies to avoid
  the flagged patterns was rejected as actively harmful — it would fight
  react-three-fiber's fundamental per-frame-imperative-mutation design,
  not fix a real bug.
- **Consequences:** These four rules provide no protection inside the
  scoped directories going forward — a genuine purity bug introduced
  there in the future would not be caught by lint.
- **Affected files:** `eslint.config.mjs`.
- **Verification:** Verified.

## D-006 — Client-side hit detection, server-side damage/rate authority (not full server-side physics)

- **Date:** Same build session
- **Status:** Accepted, in effect
- **Context:** A fully server-authoritative shooter would re-simulate
  the 3D scene (raycasts against synced geometry) on the server for
  every shot. That requires shipping a physics/geometry engine to the
  Cloudflare Worker.
- **Decision:** Each client raycasts locally and reports a hit *claim*
  (weapon, headshot flag, pellet count); the server recomputes the
  resulting damage from the shared `WEAPONS` config and enforces
  fire-rate, but does not independently verify the raycast/geometry
  claim itself.
- **Reasoning:** **Verified** — `README.md`'s "Known limitations"
  section: *"This is a deliberate, documented simplification appropriate
  for a casual 1v1 game on a free-tier relay — it is not resistant to a
  determined cheater running a modified client, only to naive
  damage/rate tampering."*
- **Alternatives considered:** Full server-side physics replay — rejected
  as disproportionate to the project's scope ("Keep multiplayer
  architecture simple enough to use on a free tier," per the original
  product brief reflected in `README.md`).
- **Consequences:** See `SECURITY.md` — a modified client could falsely
  claim hits it didn't land, bounded only by fire-rate limiting.
- **Affected files:** `party/server.ts` (`handleFire`/`applyDamage`),
  `game/physics/damageable.tsx`, `components/game/LocalPlayer.tsx`/`components/game/BotPlayer.tsx` hit
  resolution.
- **Verification:** Verified.

## D-007 — `GameAdapter` interface to unify bot-mode and online-mode player logic

- **Date:** Same build session
- **Status:** Accepted, in effect
- **Context:** `components/game/LocalPlayer.tsx` needs to behave almost identically
  whether the opponent is a local bot or a networked human — the input,
  movement, camera, and most combat/building logic is mode-agnostic.
- **Decision:** Define a `GameAdapter` interface
  (`game/networking/adapter.ts`) with two implementations
  (`game/networking/localAdapter.ts` — synchronous local commits, `game/networking/onlineAdapter.ts` —
  sends WebSocket messages), injected into `LocalPlayer` as a prop.
- **Reasoning:** **Inferred** from the clean structural separation and
  consistent usage pattern across the codebase — no explicit comment
  states this rationale, but it's the obvious purpose given the code
  shape (one component, two behavior-swappable dependencies).
- **Alternatives considered:** Not documented in-repo; a plausible
  rejected alternative would have been branching on `mode` throughout
  `components/game/LocalPlayer.tsx`'s combat/build logic directly, which the adapter
  pattern avoids (see `CLAUDE.md`'s coding-conventions note on this).
- **Consequences:** Adding a new player action requires adding a method
  to `GameAdapter` and implementing it in both adapters, even if one
  implementation is a no-op — see `CLAUDE.md`'s "DO NOT CHANGE WITHOUT
  REVIEW."
- **Affected files:** `game/networking/adapter.ts`, `game/networking/localAdapter.ts`,
  `game/networking/onlineAdapter.ts`, `components/game/LocalPlayer.tsx`.
- **Verification:** Inferred.

## D-008 — `positionTracker` as a plain mutable singleton, not a Zustand store

- **Date:** Same build session
- **Status:** Accepted, in effect
- **Context:** Bot AI and the online adapter's `getOpponentPosition()`
  need to read the current player/opponent position every frame (60fps).
- **Decision:** Use a plain mutable class instance
  (`game/state/positionTracker.ts`) updated via direct property mutation
  (`positionTracker.local.set(x,y,z)`), not a Zustand store.
- **Reasoning:** **Verified** — the file's own comment: *"Frame-updated
  positions shared across the local player, bot and remote player
  without going through React state (avoids re-renders on hot paths like
  bot perception and network state sync)."*
- **Alternatives considered:** A Zustand store would provide the same
  data with a more "idiomatic" API but would trigger React re-renders (or
  require careful selector memoization) on every position update, which
  happens far too often for that to be free.
- **Consequences:** This value is **not** reactive — nothing should ever
  do `useStore` on it or expect React to re-render from it changing. See
  `CLAUDE.md`'s coding-conventions note.
- **Affected files:** `game/state/positionTracker.ts`, read/written by
  `components/game/LocalPlayer.tsx`, `components/game/BotPlayer.tsx`, `components/game/RemotePlayer.tsx`.
- **Verification:** Verified.

## D-009 — 100% procedural audio and visuals, zero external asset files

- **Date:** Same build session
- **Status:** Accepted, in effect
- **Context:** The product brief (reflected in `README.md`) requires
  fully original assets — "no copyrighted Fortnite assets," original
  sounds, original models.
- **Decision:** Every 3D model is primitive Three.js geometry
  (capsules/boxes/cones); every sound effect is synthesized at runtime
  via the Web Audio API (`game/audio/soundManager.ts`, oscillators +
  filtered noise) — no image, model, or audio files exist anywhere in
  `public/` beyond one SVG logo.
- **Reasoning:** **Verified** — `README.md`'s "Third-party assets &
  licenses" section: *"There is nothing to attribute and nothing
  borrowed from Fortnite or any other game."*
- **Alternatives considered:** Sourcing free/CC0 sound packs or low-poly
  model packs was the "expected" approach per the original brief's
  suggestion list, but the fully-procedural approach was chosen instead
  — likely to guarantee zero licensing risk and zero asset-loading
  overhead (performance requirement), though the performance angle is
  **Inferred**, not stated explicitly.
- **Consequences:** Sound "quality" is bounded by what's achievable with
  synthesized oscillators/noise — no recorded/sampled audio character.
  Visual fidelity is bounded by primitive geometry — no textures, no
  detailed character models.
- **Affected files:** `game/audio/soundManager.ts`,
  `components/game/CharacterModel.tsx`, `components/game/Arena.tsx`, `components/game/WeaponView.tsx`,
  `components/game/BuildInstance.tsx`/`components/game/BuildGhost.tsx`.
- **Verification:** Verified (asset-absence claim) / Inferred
  (performance-motivation claim).

## D-010 — Central `game/config/*` tuning files, imported by both deployables

- **Date:** Same build session
- **Status:** Accepted, in effect — **partially violated in one place**
- **Context:** Weapon/movement/build/healing/bot/match numbers need to
  be tunable from one place and must produce *identical* values on both
  the client (for prediction/preview) and the server (for authority).
- **Decision:** All such numbers live in `game/config/*.ts` as `as const`
  objects with no logic, imported directly by both the Next.js client
  (via `@/` alias) and `party/server.ts` (via relative imports).
- **Reasoning:** **Inferred** from the consistent pattern across every
  config file and both import sites — no single comment states this as
  a rule, but `game/config/weapons.ts`'s own header comment (*"Central
  weapon tuning. Edit values here to rebalance combat."*) implies the
  intent for at least that file, and the same pattern is followed for
  every other config file.
- **Known violation:** `components/game/BotPlayer.tsx` hardcodes two
  `BOT_DIFFICULTY` values locally instead of importing them (see
  `TASKS.md` `BUG-002`) — this was **not** a deliberate exception, it is
  tracked as a bug to fix, not a documented alternative pattern.
- **Consequences:** Tuning gameplay is normally a one-file edit; the
  `components/game/BotPlayer.tsx` exception is a trap for anyone who doesn't know about
  it (now documented in `CLAUDE.md`, `FILE_MAP.md`, `TASKS.md`).
- **Affected files:** All of `game/config/*.ts`; violation in
  `components/game/BotPlayer.tsx`.
- **Verification:** Inferred (the pattern) / Verified (the specific
  violation, confirmed via direct code reading + grep this session).

## D-011 — Swallow `requestPointerLock()` promise rejections

- **Date:** Same build session, found during the Playwright smoke-test
  pass (not from a real end-user report)
- **Status:** Accepted, in effect
- **Context:** An automated headless-Chromium (Playwright) test session
  surfaced an unhandled promise rejection: `WrongDocumentError: The root
  document of this element is not valid for pointer lock.` Modern
  browsers return a `Promise` from `Element.requestPointerLock()` that
  can reject for several reasons (rapid re-requests, focus loss,
  unsupported embedding context, and possibly headless/automated-browser
  quirks specifically).
- **Decision:** `hooks/usePointerLock.ts`'s `requestLock()` now checks
  whether the call returned a `Promise` and attaches a no-op
  `.catch(() => {})` to it, instead of letting a rejection surface as an
  unhandled promise rejection.
- **Reasoning:** **Verified** — the fix and its rationale are recorded in
  a code comment at `hooks/usePointerLock.ts` lines 33–36: *"requestPointerLock()
  returns a Promise in modern browsers that can reject... Swallow
  failures — onLockError/pointerlockchange already keep `locked` in
  sync, and the user can just click again."*
- **Update 2026-08-06 (T-001 live two-client test) — CONFIRMED:** What
  was an open question is now resolved. A dedicated check
  (`document.pointerLockElement !== null` via `page.evaluate`) during the
  T-001 live test showed pointer lock **never engages at all** in this
  headless Chromium environment — `document.pointerLockElement` stayed
  `null` through every attempt, confirming `requestPointerLock()`'s
  rejection is a genuine, reproducible headless-automation limitation
  (not a one-off artifact, and not something a code fix here can solve —
  it's fundamental to headless browsers not having a real display to
  capture a cursor for). This also explains why a scripted client that
  fires without adjusting mouse-look can't land a shot at a same-height
  target: the third-person camera sits ~0.6 units above a standing
  target's hitbox top, and only real mouse-look pitch (unavailable
  without pointer lock) can compensate. **Practical implication:** any
  future automated testing of this project that depends on aiming
  (weapon accuracy, aiming builds at the ground) will hit this same wall
  in a headless browser — a *headed* browser session (real display, or a
  virtual framebuffer like Xvfb) would be needed to test that path
  automatically. Manual human play in a real browser is unaffected by
  any of this — pointer lock works normally there.
- **Alternatives considered:** None documented — the defensive `.catch()`
  was the simplest fix that couldn't make behavior worse.
- **Consequences:** A failed pointer-lock request now fails silently
  (from the browser console's perspective) rather than throwing an
  unhandled rejection; `locked` state is still kept accurate via the
  existing `pointerlockerror`/`pointerlockchange` event listeners, which
  are unaffected by this change.
- **Affected files:** `hooks/usePointerLock.ts`.
- **Verification:** Verified (the fix and its immediate rationale) /
  Unverified (whether the root cause was environment-specific or a real
  production concern — explicitly flagged above, not resolved).

## D-012 — Resolving ambiguities in the original product specification

- **Date:** Same build session
- **Status:** Accepted, in effect
- **Context:** The original product brief this game was built from left
  several control/behavior details ambiguous or underspecified. These
  interpretations exist only as implementation choices in the code and
  UI copy — no comment or doc previously recorded that they were
  deliberate judgment calls rather than unambiguous spec requirements.
  Recording them now so a future agent doesn't "fix" an intentional
  interpretation back toward a literal (but ambiguous) reading of the
  original brief, which is not itself part of this repository.
- **Decisions made under ambiguity:**
  1. **Build-rotate key = `F`.** The brief specified only "rotate builds
     with a configurable key" without naming one, and `R` (an obvious
     candidate) was already assigned to Reload. `F` was chosen as
     unused and reasonably ergonomic; "configurable" was interpreted as
     "give it a key" rather than "build a user-remappable keybinding
     system" (no keybinding-remap UI exists anywhere in this project).
  2. **Item-cycling scope.** The brief assigned key `3` to a single
     generic "healing item" slot but separately defined two distinct
     healing items (Shield Potion, Medkit) with different behavior. The
     build interprets `3` as selecting the Shield Potion specifically,
     with the Medkit reachable via mouse-wheel cycling through all four
     selectable items (`ITEM_ORDER` in `components/game/LocalPlayer.tsx`:
     rifle → shotgun → shieldPotion → medkit) — i.e., every item is
     reachable, just not all four are bound to a single number key.
     `components/ui/InstructionsModal.tsx`'s copy reflects this interpretation.
  3. **Right-click "Aim" in a third-person game.** The brief listed
     "Right click: aim" alongside a third-person camera requirement,
     which are somewhat in tension (traditional ADS is a first-person
     concept). This was implemented as a camera-distance pull-in + FOV
     narrowing + tighter effective spread while held, rather than a
     perspective switch — see `components/game/LocalPlayer.tsx`'s `isAiming`-driven
     camera/FOV logic.
- **Reasoning:** **Inferred** — these are reconstructed from the gap
  between the (out-of-repo) original brief's wording and the concrete
  implementation choices found in code; no in-repo comment previously
  stated "this is a deliberate interpretation of an ambiguous spec" for
  any of the three.
- **Alternatives considered:** Not documented — these were made in the
  moment during initial implementation, not from a weighed list of
  options.
- **Consequences:** None of these are "bugs" — do not treat a mismatch
  between this behavior and a literal re-reading of a spec document (if
  one is reintroduced to the project later) as evidence something is
  broken without first checking here.
- **Affected files:** `components/game/LocalPlayer.tsx` (`BUILD_KEYS`,
  `ITEM_ORDER`, `isAiming` camera logic), `components/ui/InstructionsModal.tsx`.
- **Verification:** Inferred.

## D-013 — Fix `PLAYER_SPAWNS` yaw (BUG-006)

- **Date:** 2026-08-06, during T-001's live two-client test
- **Status:** Fixed, in effect
- **Context:** `game/config/match.ts`'s `PLAYER_SPAWNS.a.yaw` was `0` and
  `PLAYER_SPAWNS.b.yaw` was `Math.PI`. Given this project's camera/aim
  convention (`components/game/LocalPlayer.tsx`: `forward =
  (0,0,-1).applyQuaternion(quat)` from `Euler(pitch, yaw, 0, "YXZ")`,
  which resolves to `forward = (-sin(yaw), 0, -cos(yaw))` at pitch 0),
  yaw `0` faces **-Z** and yaw `π` faces **+Z**. Spawn `a` sits at
  `z=-16` and needs to face `+Z` (toward the arena center and spawn
  `b`); spawn `b` sits at `z=+16` and needs to face `-Z`. The original
  values were exactly backwards: both players spawned facing the
  boundary wall behind them, away from each other and away from the
  center ramp structure.
- **Decision:** Swap the two yaw values (`a: Math.PI`, `b: 0`).
- **Reasoning:** **Verified live** — this was not caught by any prior
  code review or the earlier Bot Duel smoke test (a bot's facing
  self-corrects within its first AI decision frame, masking the bug for
  the bot; a human player would just turn around, also masking it in
  casual play). It was only caught because a *scripted* Online 1v1
  client fired immediately without rotating the camera, and zero shots
  landed — tracing the geometry back showed both spawns faced outward.
- **Alternatives considered:** None — this is a straightforward data
  correction, not a design choice with trade-offs.
- **Consequences:** Every match now starts with both players already
  looking roughly toward each other/the arena center, matching the
  product spec's "quickly encounter each other" intent for a compact
  1v1 arena. No other spawn-related code needed to change (movement,
  camera, bot AI all derive facing dynamically at runtime and were
  unaffected).
- **Affected files:** `game/config/match.ts`.
- **Verification:** Verified (reproduced broken, fixed, re-verified
  working, via a live two-client test).

## D-014 — Reset client-side score on `matchStart` (BUG-007, later refined by D-016/BUG-009)

- **Date:** 2026-08-06, during T-001
- **Status:** Superseded by D-016 (see below) — kept for the historical
  record since D-016 builds directly on this fix, doesn't replace it
- **Context:** `party/server.ts`'s `rematchRequest` handler resets its
  own `this.score` to `{a:0, b:0}` but never broadcasts that reset as
  its own message — the client only ever learns the score via
  `roundEnd`'s `score` field. After a rematch, the client kept
  displaying the *previous* match's final score (e.g. "5–0") through
  the entire first round of the new match, since no `roundEnd` had
  fired yet to correct it.
- **Decision (initial, incomplete):** Reset `matchStore`'s score to
  `{local:0, opponent:0}` inside `applyServerCountdown` (the action
  driven by every `matchStart` message).
- **Reasoning:** **Verified live** — reproduced the stale-score display
  in a two-client test, fixed it, re-verified the rematch case showed
  "0-0". See D-016 for why this specific implementation was incomplete.
- **Affected files:** `stores/matchStore.ts`.
- **Verification:** Verified, but see D-016 — this fix alone caused a
  new regression (BUG-009) that D-016 also fixes.

## D-015 — Add `matchResume` for mid-match reconnection (BUG-008)

- **Date:** 2026-08-06, during T-001
- **Status:** Fixed, in effect
- **Context:** `party/server.ts` already supported *slot* reconnection
  (matching a returning client's token to its existing `PlayerSlot`
  within a 25s grace window), but sent that reconnecting client nothing
  beyond the normal `welcome`/`roomStatus` messages. Those messages
  don't include match phase/round/score/health/builds. A client that
  reconnects mid-match (e.g. a page reload after a dropped connection)
  therefore has no way to know a match is already in progress — its
  fresh `networkStore.matchStarted` defaults to `false`, so
  `OnlineLobbyOverlay` (the pre-match "Ready" screen) stays visible
  indefinitely, and the fresh `matchStore.phase` defaults to
  `"countdown"`, so `LocalPlayer`'s combat logic never activates either.
  **The player was permanently locked out of a match they were still
  an active participant in**, discovered live via a two-client
  reload-to-reconnect test.
- **Decision:** Add a new server→client message, `MatchResumeMsg`
  (`game/networking/types.ts`), sent immediately after `welcome`
  whenever `onConnect` matches an existing token (a true reconnect, not
  a fresh slot) **and** `this.phase !== "lobby"`. It carries the full
  authoritative snapshot needed to resume: `phase`, `round`, `score`,
  the reconnecting player's own `health`/`shield`, the opponent's
  `health`/`shield`, and the current `builds` array. The client
  (`components/game/OnlineDuelScene.tsx`) hydrates every relevant store from this one
  message and sets `matchStarted = true`, skipping the lobby overlay
  entirely.
- **Reasoning:** **Verified live** — reproduced the stuck-lobby bug via
  `pageB.reload()` (same tab, same `sessionStorage` token — the
  realistic way to simulate a dropped-connection-then-refresh; an
  earlier attempt using `page.close()` + a fresh `Page` object in the
  same browser context did *not* reproduce a reconnect at all, because
  `sessionStorage` is scoped per top-level browsing context/tab in real
  browsers and isn't shared between distinct `Page` objects even within
  one Playwright `BrowserContext` — a useful methodology note for future
  reconnection testing). After the fix, the same reload-based test
  showed the reconnecting client landing directly back in combat with
  the correct health/ammo/round state.
- **Known limitation (deliberately not fixed, tracked as `BUG-010`):**
  `MatchResumeMsg` doesn't carry a round/match *winner*, so reconnecting
  during the brief `round-end`/`match-end` window resumes without the
  winner banner. Narrow timing window, low severity, not fixed this
  session — see `TASKS.md`.
- **Alternatives considered:** Re-sending a synthetic `roundStart`/
  `matchStart` on reconnect was considered but rejected — those messages
  have side effects on the *other* client too (they're normally
  broadcasts), and a resume should only affect the reconnecting client.
  A dedicated, unicast-only message type was cleaner.
- **Affected files:** `game/networking/types.ts` (`MatchResumeMsg`),
  `party/server.ts` (`onConnect`), `components/game/OnlineDuelScene.tsx`
  (handler), `stores/matchStore.ts` (`applyServerResume`).
- **Verification:** Verified (reproduced broken, fixed, re-verified
  working, via a live two-client reload-based reconnect test).

## D-016 — Add `isNewMatch` to `MatchStartMsg` (BUG-009, refines D-014)

- **Date:** 2026-08-06, during T-001 (same session as D-014, found
  immediately after verifying D-014's fix in a longer multi-round test)
- **Status:** Fixed, in effect
- **Context:** `matchStart` is broadcast from **two** different server
  code paths that look identical on the wire: (1) `maybeStartMatch()`,
  for a genuinely fresh match (first start from the lobby, or a
  rematch) — score should reset to 0-0; and (2) `resetRound(true)`,
  called from `endRound()`'s setTimeout after every *non-final* round
  within a match already in progress — score must be preserved, not
  reset. D-014's fix couldn't distinguish these two cases and reset
  score to 0-0 on **every** round transition, not just rematches — a
  regression discovered immediately when testing a full 5-round match
  (score displayed "1", then reset to "0" before round 2, etc., instead
  of accumulating 1→2→3→4→5).
- **Decision:** Add `isNewMatch: boolean` to `MatchStartMsg`. Set `true`
  in `maybeStartMatch()`'s broadcast, `false` in `resetRound(true)`'s
  broadcast. Client's `applyServerCountdown` now takes this flag and
  only resets `score`/`round` when it's `true`. Also removed a related
  redundancy found while fixing this: the `rematchRequest` handler used
  to call `resetRound(true)` (which itself broadcasts a `matchStart`,
  now correctly flagged `isNewMatch: false` — wrong for a rematch!) and
  then *also* call `maybeStartMatch(true)`, sending a **second**
  competing `matchStart` and scheduling a second countdown→combat timer.
  Changed the rematch path to call `resetRound(false)` (clears
  builds/health, no broadcast of its own) followed by
  `maybeStartMatch(true)` as the single source of the rematch's
  `matchStart` (correctly `isNewMatch: true`).
- **Reasoning:** **Verified live** — re-ran a full 5-round match after
  this fix; score correctly accumulated 1→2→3→4→5 across rounds, match
  end triggered correctly, and a subsequent rematch correctly showed
  "0-0" through round 1. All three scenarios (mid-match rounds,
  match-end, rematch) verified together in the same run.
- **Alternatives considered:** Inferring "is this a rematch" client-side
  from `round === 1` was considered and rejected — round 1 of a
  brand-new match (from the lobby) is indistinguishable from round 1
  after a rematch using only client state, and both are legitimately
  `isNewMatch: true`, but nothing client-side reliably rules out "this
  is actually just an unusual mid-match state" without the server
  telling it explicitly. An explicit server-computed flag removes all
  ambiguity.
- **Consequences:** `MatchStartMsg` now has one more required field —
  any future producer of this message (there are only the two documented
  call sites today) must set it deliberately, not default it.
- **Affected files:** `game/networking/types.ts` (`MatchStartMsg.isNewMatch`),
  `party/server.ts` (`maybeStartMatch`, `resetRound`, `rematchRequest`
  handler), `stores/matchStore.ts` (`applyServerCountdown` signature),
  `components/game/OnlineDuelScene.tsx` (passes the flag through).
- **Verification:** Verified (reproduced the regression, fixed, re-ran a
  full multi-round match + rematch to confirm both cases now behave
  correctly).

## D-017 — Fail loudly on unset `NEXT_PUBLIC_PARTY_HOST` in production (BUG-001, T-002)

- **Date:** 2026-08-06, during the T-002–T-010 cleanup pass
- **Status:** Fixed, in effect
- **Context:** `getPartyHost()` previously fell back to
  `"localhost:8787"` unconditionally when the env var was unset, even in
  a deployed production build. That silently pointed the client at a
  Worker no one is running, causing Online 1v1 to hang forever on
  "Connecting…" with zero signal to the user or a future developer about
  why.
- **Decision:** Chosen from the two options `TASKS.md` T-002 laid out:
  (a) throw/surface a clear, user-visible error state — not (b) fail the
  build. A new `PartyHostUnconfiguredError` is thrown from
  `getPartyHost()` when the var is unset and
  `window.location.hostname !== "localhost"`. `components/game/OnlineDuelScene.tsx`'s
  connect effect wraps `client.connect()` in a try/catch; on failure it
  sets `status: "disconnected"` and `errorMessage` to the error's
  message, which `components/ui/OnlineLobbyOverlay.tsx` already renders (that field
  existed and was already wired into the UI, previously only fed by the
  server's `error` message type — now also fed by this client-side
  failure).
- **Reasoning:** Option (b) (fail the build) would break `next build`
  for anyone who hasn't set the var yet, including this project's own
  CI-less local build/dry-run workflow, and provides no signal at
  runtime to a user hitting an already-deployed misconfigured instance.
  Option (a) degrades gracefully: the rest of the app (Bot Duel, menus)
  keeps working, and only the Online 1v1 path — the one actually
  affected — shows a clear, specific message instead of hanging.
- **Consequences:** Anyone deploying this project for real online play
  must set `NEXT_PUBLIC_PARTY_HOST` or Online 1v1 will visibly refuse to
  connect (by design) instead of silently trying `localhost:8787`.
- **Affected files:** `game/networking/client.ts` (`getPartyHost`, new
  `PartyHostUnconfiguredError`), `components/game/OnlineDuelScene.tsx`
  (try/catch around `client.connect()`).
- **Verification:** Partially verified — the local-dev path (hostname
  === "localhost") was exercised repeatedly via this session's live
  tests and still connects normally. The production-fallback throw path
  itself was verified by code review + `tsc` only; no real non-localhost
  deploy exists yet to reproduce it live against (see
  `PROJECT_STATE.md`).

## D-018 — Wire up `BOT_DIFFICULTY.reactionTime`/`aggression`/`viewDistance` rather than delete (BUG-003b, T-006)

- **Date:** 2026-08-06, during the T-002–T-010 cleanup pass
- **Status:** Fixed, in effect
- **Context:** These three fields were defined per bot-difficulty tier,
  with explanatory inline comments, since the project's initial build,
  but `game/bots/fsm.ts`'s `BotBrain` never read any of them —
  difficulty only actually varied `aimAccuracy`, `fireDecisionInterval`,
  `buildLikelihood`, `healThreshold`, and `moveSpeedMultiplier`.
- **Decision:** Wire them up rather than delete, since the original
  product spec calls for "adjustable difficulty" and these three fields
  map onto real, distinct behavioral axes that were genuinely missing:
  how fast a bot notices you, how likely it is to press an advantage vs.
  hold position, and how far it can perceive you at all.
  - `reactionTime`: `BotBrain` now accumulates `continuousSightTime`
    while `canSee` is true (reset to 0 the instant it's false) and only
    transitions into `"attack"` once that meets `cfg.reactionTime`.
  - `aggression`: a new decision re-rolled every 1.5s in the `"attack"`
    state (`pushDecision = Math.random() < cfg.aggression`) — re-rolled
    on a timer rather than every frame specifically to avoid jittery
    flip-flopping between pushing and holding — gates whether the bot
    closes distance when the player is far, versus holding ground while
    still aiming/firing.
  - `viewDistance`: `components/game/BotPlayer.tsx`'s `canSee` now also requires
    `distance <= BOT_DIFFICULTY[difficulty].viewDistance`, which
    previously had no distance cap at all (any clear line-of-sight
    counted as "seen", regardless of range).
- **Reasoning:** The alternative (delete the fields) would have been
  simpler but throws away difficulty-tuning knobs the original spec
  explicitly wanted, for no real reason other than that the initial
  build session didn't get to them.
- **Consequences:** Bot behavior changes slightly for all three
  difficulty tiers relative to the initial build (easier bots are now
  measurably slower to react and more passive, not just less accurate)
  — a deliberate improvement, not a regression, but worth knowing if
  comparing to pre-2026-08-06 playtesting notes.
- **Affected files:** `game/bots/fsm.ts` (`BotBrain.update`,
  `.act`'s `"attack"` case), `components/game/BotPlayer.tsx` (`canSee`
  computation).
- **Verification:** Live Bot Duel smoke test (Normal difficulty)
  confirmed the bot still detects, closes in on, and eliminates the
  player without stalling — round 1 ended with the bot winning
  (OPP 1–YOU 0), zero console errors. Difficulty-tier *differences*
  were not separately live-tested (see `TASKS.md` → Testing needed).

## D-019 — Wire up `turnSmoothing`/`destructionEffectDuration`, delete `groundFriction` (T-010)

- **Date:** 2026-08-06, during the T-002–T-010 cleanup pass
- **Status:** Fixed, in effect
- **Context:** Three config fields in `game/config/movement.ts`/
  `game/config/builds.ts` were defined but never read: `groundFriction`,
  `turnSmoothing`, `destructionEffectDuration`. Two had an obvious
  pre-existing near-duplicate in the code (a hardcoded literal doing the
  same job); one didn't.
- **Decision:**
  - `turnSmoothing` (14): `components/game/BotPlayer.tsx` and `components/game/RemotePlayer.tsx` each had
    a hardcoded `10` passed as the damping-speed argument to
    `THREE.MathUtils.damp(...)` for body-rotation-toward-facing. Replaced
    both with `MOVEMENT.turnSmoothing`.
  - `destructionEffectDuration` (0.6): `components/game/EffectsLayer.tsx` had its own
    local `DESTRUCTION_LIFE = 0.6` constant. Replaced both use sites with
    `BUILD_CONFIG.destructionEffectDuration`, imported from
    `game/config/builds.ts`.
  - `groundFriction`: **deleted**, not wired up. Movement in this
    project is direct per-frame displacement toward a desired velocity
    (see `game/physics/useCharacterMover.ts`) — there's no velocity-integration step
    where "friction" (gradual deceleration) would naturally apply without
    a materially larger change to the movement model, which is out of
    scope for what was meant to be a dead-code cleanup task.
- **Reasoning:** The first two were genuine single-source-of-truth fixes
  with zero behavior risk (the config value already matched the
  hardcoded one in the `destructionEffectDuration` case; the
  `turnSmoothing` case is a deliberate, minor, pre-existing-inconsistency
  fix — 10 vs. 14 — treated as "use the documented config value" rather
  than "preserve whatever arbitrary number was typed at the call site").
  Wiring up `groundFriction` would have required redesigning how
  movement deceleration works, which risks introducing real gameplay-feel
  regressions for a field that was never actually broken by its absence
  (the arcade-style instant-stop movement is a legitimate, consistent
  design choice for this genre).
- **Consequences:** Bot/remote-player body rotation is now ~40% snappier
  (damping constant 10 → 14) — a minor, likely-imperceptible visual
  tweak. `groundFriction` no longer exists in `MOVEMENT`; if instant-stop
  movement is ever revisited, a real velocity-integration pass would be
  needed rather than resurrecting this field.
- **Affected files:** `game/config/movement.ts`,
  `components/game/BotPlayer.tsx`, `components/game/RemotePlayer.tsx`,
  `components/game/EffectsLayer.tsx`.
- **Verification:** `tsc`/`eslint`/build clean. The rotation-damping
  change was not screenshot-diffed live (low risk, minor visual-only
  tweak).
