# FEATURES.md

Every major feature, classified by actual verified wiring through the
full flow — not by "files exist." Status legend:

`Verified complete` · `Mostly complete` · `Partially implemented` ·
`UI only` · `Backend only` · `Mocked` · `Planned` · `Broken` ·
`Deprecated` · `Unable to verify`

---

## 1. Main menu & navigation

- **Purpose:** Entry point — choose Bot Duel or Online 1v1, set bot
  difficulty, view instructions, open settings.
- **Status: Verified complete** (visually confirmed via Playwright
  screenshot this session — see `PROJECT_STATE.md`).
- **Frontend:** `components/ui/MainMenu.tsx`, `app/page.tsx` (screen
  switcher), `stores/gameStore.ts`.
- **Backend:** None needed.
- **DB dependencies:** None.
- **External integrations:** None.
- **Env vars:** None.
- **Validation:** Join-room code requires ≥4 characters before the Join
  button enables (`joinCode.trim().length < 4`).
- **Error states:** None explicit for menu itself.
- **Loading states:** N/A (instant).
- **Edge cases:** First-time play routes through `InstructionsModal`
  before entering a match (`gameStore.hasSeenControls` flag, not
  persisted — resets every page load).
- **Tests:** None automated. One manual/scripted visual check performed.
- **Known issues:** None found.
- **Remaining work:** None identified.

## 2. Bot Duel mode — movement, camera, collision (Phase 1 scope)

- **Purpose:** Third-person movement (walk/sprint/jump/gravity) with a
  chase camera that avoids clipping through geometry.
- **Status: Verified complete.** Movement code executes with zero
  console errors after the Strict Mode fix (`DECISIONS.md` D-004);
  visually confirmed in a live browser session.
- **Frontend:** `components/game/LocalPlayer.tsx` (input + camera),
  `game/physics/useCharacterMover.ts` (Rapier kinematic character
  controller), `components/game/Arena.tsx` (colliders), `game/config/movement.ts`.
- **Backend:** N/A (client-only physics simulation).
- **Validation:** Server-side speed sanity check exists **only** in
  online mode (`party/server.ts`'s `handleState`, `MAX_SPEED` constant)
  — bot mode has no server, so there's nothing to validate against.
- **Error states:** None explicit.
- **Loading states:** N/A.
- **Edge cases:** Camera occlusion raycast (`castWorldRay` in
  `LocalPlayer.tsx`) pulls the camera closer when backed against a wall —
  confirmed present in code, not exhaustively visually verified at every
  angle.
- **Tests:** None automated.
- **Known issues:** `MOVEMENT.groundFriction` and `MOVEMENT.turnSmoothing`
  are defined in config but never read anywhere (dead config — see
  `TASKS.md`). **Resolved 2026-08-06:** `game/config/match.ts`'s
  `PLAYER_SPAWNS` yaw values were backwards (both spawns faced away from
  the arena center) — fixed as `BUG-006`, see `DECISIONS.md` D-013. Bot
  Duel wasn't re-run to visually reconfirm the new spawn framing (low
  risk, see `PROJECT_STATE.md`), but the fix is strictly correct.
- **Remaining work:** None blocking; dead-config cleanup optional; quick
  Bot Duel re-check after `BUG-006` recommended.

## 3. Combat system (rifle, shotgun, hit detection, health/shield)

- **Purpose:** Two hitscan weapons with distinct fire-rate/damage/spread/
  magazine profiles; shield absorbs damage before health; elimination at
  0 health.
- **Status: Verified complete.** Bot mode end-to-end verified (earlier
  session). Online-mode damage authority **live-verified 2026-08-06**
  (`TASKS.md` `T-001`): server-computed damage matched
  `game/config/weapons.ts` exactly across repeated hits (18 × 1.5
  headshot = 27 per hit, health decremented 100→73→46→19→0 server-side,
  broadcast correctly to both clients). Finding this required first
  fixing `BUG-006` (spawns faced away from each other, so no shot could
  land at all) — see `DECISIONS.md` D-013.
- **Frontend:** `components/game/LocalPlayer.tsx` (`fireLocalWeapon`),
  `components/game/BotPlayer.tsx` (`fireBotWeapon`), `game/weapons/hitscan.ts`,
  `game/physics/damageable.tsx`, `components/game/WeaponView.tsx` (visual
  gun model + muzzle flash), `components/game/EffectsLayer.tsx` (tracers/
  impacts/damage numbers), `components/ui/CombatHud.tsx` (ammo/health/
  shield bars, hit marker, damage flash), `game/config/weapons.ts`.
- **Backend:** `party/server.ts`'s `handleFire()`/`applyDamage()` —
  recomputes damage from `WEAPONS` config server-side, enforces fire-rate
  (80% of the weapon's minimum interval, tolerance for jitter), never
  trusts a client-supplied damage number.
- **DB dependencies:** None (in-memory only).
- **Validation:** Fire-rate (server), ammo count / reload-blocks-fire
  (client only — not re-validated server-side beyond rate).
- **Error states:** None explicit; malformed messages silently dropped.
- **Loading/empty states:** N/A.
- **Edge cases:** Shotgun pellet grouping (multiple pellets hitting the
  same target reported as one hit-claim with a pellet count) — implemented,
  bot-mode verified only.
- **Tests:** None automated. Live-verified manually via a scripted
  two-client Playwright session (not committed) this session.
- **Known issues:** None specific to combat.
- **Remaining work:** None blocking. A real (non-scripted)
  two-human-browser confirmation is still a reasonable follow-up.

## 4. Building system (wall/floor/ramp)

- **Purpose:** Grid-snapped placement of three cover types, with a
  green/red validity preview, per-player active-build cap, placement
  cooldown, and destructible builds (block bullets, have HP, destroy at 0).
- **Status: Mostly complete.** Bot-mode path fully verified (screenshot
  confirmed build-mode UI toggling correctly in an earlier session).
  Online path is code-complete and the *underlying* client↔server↔
  broadcast pattern it shares with combat is now proven live (`TASKS.md`
  `T-001`, combat and match-flow specifically), but build placement
  itself was **not** specifically exercised in a live two-client session
  — risk is judged low given the shared, now-proven pattern, but this is
  not the same as having watched it happen.
- **Frontend:** `components/game/BuildGhost.tsx` (preview), `BuildInstance.tsx`
  (placed builds, physics collider, health bar sprite), `LocalPlayer.tsx`
  (placement input/raycast), `BotPlayer.tsx` (`tryBotBuild`), `game/building/grid.ts`
  (pure validation logic — shared with server), `stores/buildsStore.ts`.
- **Backend:** `party/server.ts`'s `handleBuildPlace()` — re-runs the
  same `validatePlacement()` server-side as the authority; assigns the
  build ID.
- **Validation:** Grid snap, arena bounds, no-overlap-with-player,
  no-overlap-with-existing-build, per-owner active cap
  (`BUILD_CONFIG.maxActivePerPlayer = 12`), client-side placement
  cooldown (`0.25s`).
- **Error states:** `BuildRejectedMsg` sent by server when server-side
  validation fails (client shows nothing specific on rejection currently
  — the ghost just never confirms; no explicit "rejected" UI feedback).
- **Edge cases:** Stacking builds on top of each other (Y-snapping logic
  in `validatePlacement`) — implemented, not exhaustively tested.
- **Tests:** None automated.
- **Known issues:** None build-system-specific beyond the general
  online-untested caveat.
- **Remaining work:** Consider adding explicit UI feedback for
  server-rejected placements; live online verification.

## 5. Healing items (Shield Potion, Medkit)

- **Purpose:** Hold-to-consume over time, circular progress indicator,
  cancel on shoot/build/switch, limited starting charges, can't
  overheal/use at cap.
- **Status: Mostly complete** — bot-mode verified via code path review
  (matches spec exactly: potion 50 shield/3.2s/3 charges, medkit full
  heal/5.5s/1 charge); UI progress ring code confirmed present
  (`components/ui/CombatHud.tsx`'s `HealProgress`); not visually
  screenshot-confirmed mid-heal this session. Online path untested live.
- **Frontend:** `LocalPlayer.tsx` (`handleHealing`/`completeHeal`/
  `cancelHeal`), `BotPlayer.tsx` (bot healing logic in its `useFrame`),
  `game/config/healing.ts`, `components/ui/CombatHud.tsx`.
- **Backend:** `party/server.ts`'s `handleHeal()` — applies the actual
  restore server-side on `"complete"` event, clamps to
  `MATCH_CONFIG.maxHealth`/`maxShield`.
- **Validation:** Client checks `hasCharges`/`atCap` before starting;
  server does **not** independently re-validate charge count (documented
  trust gap, see `SECURITY.md`).
- **Tests:** None automated.
- **Known issues:** None healing-specific.
- **Remaining work:** Live online verification; consider server-side
  charge-count validation.

## 6. Bot AI (finite-state machine)

- **Purpose:** A non-networked AI opponent that moves, detects the
  player via raycast line-of-sight, aims/shoots (with per-difficulty
  inaccuracy), occasionally jumps, builds defensive cover when hit, heals
  at low health, retreats when badly hurt — three difficulty tiers.
- **Status: Verified complete** (upgraded 2026-08-06 — `TASKS.md`
  `T-005`/`T-006`). All seven required behaviors are implemented. The
  `aimAccuracy`/`moveSpeedMultiplier` duplication (`BUG-002`) is fixed —
  `BotPlayer.tsx` now reads `BOT_DIFFICULTY[difficulty]` directly, no
  local hardcoded copies. All three previously-unused fields now affect
  real behavior: `reactionTime` gates a delay before the bot starts
  actively engaging after first spotting the player, `aggression` gates
  a periodic push-vs-hold decision while attacking, and `viewDistance`
  caps how far the bot can perceive the player at all (previously
  unbounded). See `DECISIONS.md` D-018 for the full reasoning. Live Bot
  Duel smoke test after these changes: zero console errors, bot
  correctly detected/closed in on/eliminated the test player within
  round 1.
- **Frontend:** `game/bots/fsm.ts` (`BotBrain` class — pure logic),
  `components/game/BotPlayer.tsx` (execution), `game/config/bots.ts`.
- **Backend:** N/A — bots only exist in Bot Duel mode (no server).
- **Tests:** None automated. `BotBrain` is pure logic and would be
  straightforward to unit test if a test framework existed (see
  `TESTING.md`).
- **Known issues:** None specific to this feature area currently open.
- **Remaining work:** Difficulty-tier *differences* (easy vs. hard
  actually feeling different) haven't been A/B-tested live — only Normal
  was exercised in this session's smoke test.

## 7. Online 1v1 multiplayer

- **Purpose:** Create/join a private room by code, ready up, play a
  server-authoritative synced match, handle disconnect/reconnect,
  rematch.
- **Status: Verified complete** (upgraded 2026-08-06 — `TASKS.md` `T-001`
  was executed live with two real connected browser clients: room
  create/join, ready-up, synced match start, synced combat with
  server-authoritative damage, round elimination with correct
  winner/score, a full match to 5 rounds, match-end, rematch with
  correctly-reset score, disconnect banner, and mid-match reconnect all
  confirmed working end-to-end). Four real bugs were found and fixed in
  the process — `BUG-006` (spawn facing), `BUG-007`/`BUG-009` (rematch/
  round score reset), `BUG-008` (mid-match reconnect stuck on lobby) —
  see `DECISIONS.md` D-013–D-016 and `TASKS.md`. **Two things were not
  specifically exercised in the live test:** building and healing sync
  (same validated code pattern as combat, so low risk but unconfirmed),
  and a real non-scripted two-human-browser session (only a scripted
  Playwright test was run) — see `PROJECT_STATE.md`.
- **Frontend:** `components/game/OnlineDuelScene.tsx` (message routing),
  `components/game/RemotePlayer.tsx` (interpolated remote rendering),
  `components/ui/OnlineLobbyOverlay.tsx` (room code, ready button,
  connection status), `components/ui/ConnectionStatus.tsx` (ping,
  disconnect banner), `game/networking/{client,onlineAdapter,types,activeClient}.ts`,
  `stores/networkStore.ts`.
- **Backend:** `party/server.ts` (entire `GameRoom` Durable Object).
- **DB dependencies:** None (in-memory).
- **External integrations:** Cloudflare Workers/Durable Objects
  (deployment target, not yet actually deployed).
- **Env vars:** `NEXT_PUBLIC_PARTY_HOST` — if unset in production (any
  hostname other than `localhost`), the client now fails fast with a
  clear, user-visible error instead of silently trying `localhost:8787`
  (`BUG-001` fixed 2026-08-06, `T-002`/`DECISIONS.md` D-017).
- **Validation (server-side):** Room capacity (2 max), fire-rate,
  movement speed, build placement — see `SECURITY.md`.
- **Error states:** `roomStatus`/`error` messages exist; `OnlineLobbyOverlay.tsx`
  surfaces `networkStore.errorMessage`. `ConnectionStatus.tsx` shows a
  "Connection Lost" overlay when `status === "disconnected"`.
- **Loading states:** "Connecting…" text on the Ready button while
  `status !== "connected"`.
- **Edge cases handled in code, now live-verified:** Reconnection within
  25s grace period (token-matched slot recovery) **including mid-match
  reconnection with full state resume** (`BUG-008` fix, `MatchResumeMsg`),
  room-full rejection (3rd connection — not re-verified live this
  session but unchanged code, previously reviewed), opponent-disconnected
  banner (live-verified), rematch handshake with correct score reset
  (`BUG-007`/`BUG-009` fixes, live-verified).
- **Edge cases handled (fixed 2026-08-06):** `resetRequest` is now
  rejected server-side unless `this.phase === "combat"` (`BUG-003`
  fixed, `T-004` — verified live via a raw-WebSocket protocol test, see
  `PROJECT_STATE.md`); the redundant, inconsistent "Reset Arena" button
  on the post-match results screen was removed entirely rather than
  fixed to sync (`BUG-004` fixed, `T-003`). A `buildRejected` server
  message now produces a visible "Placement denied" toast + sound
  client-side (`T-007`) — not yet independently live-repro'd, see below.
- **Edge cases NOT handled:** `BUG-010` (a client reconnecting during the
  brief round-end/match-end window resumes without the winner shown —
  `MatchResumeMsg` doesn't carry one) remains open.
- **Tests:** None automated. Combat/round/rematch/reconnect flows were
  **manually verified live** in the prior `T-001` session via a scripted
  two-client Playwright session; this session's server-only fixes
  (`resetRequest` phase guard, build health) were verified via a raw
  WebSocket script that bypasses the 3D client (see `PROJECT_STATE.md`
  for why — headless Chromium can't grant Pointer Lock, making scripted
  build placement unreliable). `T-007`'s buildRejected toast has **not**
  been live-repro'd — verified by code review + pattern-match only. No
  real two-human-driven-browser session has been done yet.
- **Known issues:** `BUG-010` in `TASKS.md` (narrow-scope, doesn't block
  basic play).
- **Remaining work:** See `TASKS.md`'s remaining "Low priority"/
  "Technical debt" sections. A real two-human-browser confirmation pass
  and explicit building/healing-sync verification (via the real client,
  not the raw-WebSocket bypass) are the two highest-value remaining gaps
  for this specific feature.

## 8. Match flow (countdown → combat → round-end → match-end, first to 5)

- **Purpose:** Three-second countdown, combat, elimination ends the
  round, builds/positions/ammo reset, next round starts, first to 5
  round wins ends the match with a results screen.
- **Status: Verified complete** (online path upgraded 2026-08-06 — a
  full 5-round match, round-to-round score accumulation, match-end, and
  rematch were all live-verified via `TASKS.md` `T-001`, after fixing
  `BUG-007`/`BUG-009`, two bugs specifically in this score-tracking
  logic). Bot-mode path was verified in an earlier session (scoreboard/
  round/countdown UI confirmed live) and matches spec
  (`MATCH_CONFIG.roundsToWin = 5`, `countdownSeconds = 3`,
  `roundEndDelay = 3`) — **not re-run this session** after the shared
  `PLAYER_SPAWNS` fix (`BUG-006`), though that fix should only improve
  Bot Duel's initial framing, not its match-flow logic.
- **Frontend:** `stores/matchStore.ts`, `components/game/BotDuelScene.tsx`
  (bot-mode timers), `components/game/OnlineDuelScene.tsx` (online-mode
  message→store translation), `components/ui/Scoreboard.tsx`,
  `MatchResults.tsx`.
- **Backend:** `party/server.ts`'s `maybeStartMatch()`/`endRound()`/
  `resetRound()` for the online path.
- **Known issues:** `BUG-010` (reconnecting during round-end/match-end
  resumes without the winner shown) — the only item still open for this
  feature; `BUG-003` was fixed 2026-08-06 (`T-004`, phase guard on
  `resetRequest`, verified live via raw WebSocket).
- **Remaining work:** Quick Bot Duel re-verification after `BUG-006`
  is still technically outstanding as an explicit "watched it happen"
  confirmation (this session's Bot Duel smoke test did exercise a full
  round via the shared `PLAYER_SPAWNS` config and completed cleanly,
  which implicitly covers it, but wasn't a dedicated spawn-facing check).

## 9. Settings system

- **Purpose:** Mouse sensitivity, master/SFX volume, graphics quality
  preset, shadow toggle, FOV, crosshair size/opacity, bot difficulty, FPS
  counter, mute, fullscreen — persisted to localStorage.
- **Status: Verified complete.** `stores/settingsStore.ts` uses
  `zustand/middleware persist`; `components/ui/SettingsPanel.tsx` wires
  every documented setting to a control; `GameCanvas.tsx` reads
  `graphicsQuality`/`shadowsEnabled`/`fov` to configure the R3F `<Canvas>`
  (DPR cap, antialiasing, shadow maps).
- **Frontend only** — no backend/DB involvement by design (client-local
  preference).
- **Validation:** Range-clamped via HTML `<input type="range">` min/max,
  no separate application-level validation.
- **Tests:** None automated.
- **Known issues:** None found.
- **Remaining work:** None identified.

## 10. Audio system

- **Purpose:** Every SFX (rifle/shotgun fire, reload, hit confirm, take
  damage, build place/destroy, potion/medkit use, jump, elimination,
  countdown, round victory, UI click) synthesized procedurally.
- **Status: Verified complete** as an implementation (no external assets,
  by design — see `README.md`'s asset-licensing section). Sound
  *correctness/quality* (does each effect sound "right") was tuned by
  ear during development but not re-verified this session (headless
  browser testing doesn't audibly confirm playback).
- **Frontend:** `game/audio/soundManager.ts` (singleton class,
  `SoundManager`), wired into effectively every gameplay action across
  `LocalPlayer.tsx`, `BotPlayer.tsx`, scene files, and UI click handlers.
- **Backend:** N/A.
- **Known issues:** `soundManager.resume()` (unlocks the AudioContext on
  a user gesture, browser autoplay-policy requirement) is called from
  MainMenu button clicks and the canvas click-to-lock handler — verify
  this covers every real entry path if audio silence is ever reported.
- **Remaining work:** None identified beyond normal audio polish/tuning,
  which is subjective and not a completeness gap.

## 11. Visual effects (tracers, impacts, destruction, damage numbers)

- **Purpose:** Object-pooled tracer lines, impact bursts, destruction
  particles, floating damage numbers, capped counts for performance.
- **Status: Verified complete** as implemented; pooling caps confirmed
  in code (`MAX_TRACERS=10`, `MAX_IMPACTS` scales 6/10/16 by graphics
  quality, `MAX_DESTRUCTIONS=6`, damage numbers capped 4/10 by quality).
  Visually confirmed indirectly (muzzle flash/crosshair rendered
  correctly in screenshots); tracer/impact effects specifically not
  individually screenshot-verified (they're sub-100ms events, hard to
  catch in a single screenshot).
- **Frontend:** `game/effects/effectsBus.ts` (pub/sub), `components/game/EffectsLayer.tsx`
  (pooled renderer).
- **Known issues:** None found.
- **Remaining work:** None identified.

## 12. Pause menu / Reset Arena / Return to menu

- **Purpose:** Escape key toggles pause; Resume, Reset Arena, Settings
  (embedded), Return to Menu.
- **Status: Verified complete** (upgraded 2026-08-06 — `TASKS.md`
  `T-003`/`T-004`). Resume/Settings/Return-to-Menu remain Verified
  complete. The `MatchResults.tsx` "Reset Arena" button (the one that
  didn't sync — `BUG-004`) has been **removed entirely**, not fixed to
  sync — it never did anything meaningful on the post-match screen
  (decision recorded in `TASKS.md` T-003). The
  server now rejects `resetRequest` unless the match is actually in
  `combat` phase (`BUG-003` fixed, `T-004`) — verified live via a raw
  WebSocket protocol test: allowed during combat, correctly rejected
  during round-end.
- **Frontend:** `components/ui/PauseMenu.tsx` (the only remaining Reset
  Arena button — mid-match, in the pause menu), `MatchResults.tsx`,
  `HUD.tsx` (Escape key listener + pointer-lock exit).
- **Backend:** `party/server.ts`'s `resetRound(false)` (online mode
  only), now phase-guarded.
- **Known issues:** None currently open for this feature.
- **Remaining work:** None identified.

## 13. Instructions / controls display

- **Purpose:** Show the full control scheme before a player's first
  match; accessible any time from the main menu.
- **Status: Verified complete.** Confirmed present via Playwright
  screenshot this session (`02-instructions.png` in the prior session's
  scratch test output — not committed to the repo, but the flow was
  exercised).
- **Frontend:** `components/ui/InstructionsModal.tsx`.
- **Known issues:** None found.
- **Remaining work:** None identified.
