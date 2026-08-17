# TASKS.md

Active execution queue. IDs are stable — reference them in commit
messages/`SESSION_LOG.md`/`CHANGELOG.md` (real commits are happening now
— a git repo + GitHub remote has existed since 2026-08-06, see
`PROJECT_STATE.md` → Git state). Update this file after every meaningful
task (see `CLAUDE.md` → Permanent rules).

**Staleness note (2026-08-07, re-confirmed 2026-08-17):** `T-001`
through `T-010` below reflect work through the 2026-08-06
pre-"Lobby Update" state. Real feature work has shipped since
(progression, cosmetics, Battle Royale mode, Training Arena, theme
picker, an 8-weapon roster, redeem codes, keybind rebinding, quests/
achievements, emotes, a `thinking-orbs` UI dependency, and a merged
`fix/motion-a11y` accessibility branch — see `CHANGELOG.md` v0.2.0 and
`git log`) with no matching new task entries added here. **[Verified
2026-08-17]** As of this pass, the checked-out branch is a local,
unpushed `chore/polish` (1 commit ahead of `main`, working tree clean —
see `PROJECT_STATE.md` → Git state), and none of that later work has a
`T-0xx` task entry either. Don't assume this is the complete backlog —
check `CHANGELOG.md`/`git log` for what's actually shipped before
picking a "next task."

---

## Current task

**None in progress.** `T-001` through `T-010` (below) are all complete
— see each entry's Status/Outcome for the full result. Only
`T-006`'s reactionTime/aggression/viewDistance wiring and `T-007`'s
buildRejected UI feedback were not exercised in a live browser (see
their Outcome notes for why and what alternate verification was used).
Nothing is currently in progress; pick the next item from `TASKS.md`'s
remaining "Low priority"/"Technical debt" sections or from fresh
testing/polish work. **[Verified 2026-08-17]** Still true — working
tree is clean (nothing mid-task), but note the checked-out branch is
`chore/polish` (1 commit ahead of `main`, unpushed) rather than `main`;
if you continue work, decide whether to keep building on `chore/polish`
or merge/push it first. See `PROJECT_STATE.md` → Git state.

## Next up

### T-001 — Live two-client test of Online 1v1 ✅ DONE (2026-08-06)

- **Status:** **Complete.** Actually run with two real Playwright-driven
  browser clients against a local `wrangler dev` + `next dev` stack.
  All 8 acceptance criteria passed after fixing four real bugs
  discovered along the way (see Outcome below). This is no longer "the
  single largest unverified surface" — see `FEATURES.md` item 7 and
  `PROJECT_STATE.md`, both updated to reflect this.
- **Priority:** Was Highest; now closed.

**Outcome summary:**
- Criteria 1–3 (room create/join, ready/roomStatus sync, match-start
  sync) passed on the first successful run, no code changes needed.
- Criterion 4 (combat sync) initially appeared broken (zero damage ever
  landed) — root-caused to a **real, previously-undiscovered bug**:
  `PLAYER_SPAWNS` in `game/config/match.ts` had both spawns' `yaw`
  swapped, so both players started facing *away* from each other and
  the arena center instead of toward it. **Fixed** (`BUG-006`).
- After that fix, hit-testing still failed with a headless/scripted
  client that never moves the mouse — traced to `document.pointerLockElement`
  never becoming non-null in this headless Chromium environment (the
  camera can't pitch down the ~2.4° needed to line up with a
  same-height target without real mouse-look). This **confirms**
  `DECISIONS.md` D-011's previously-uncertain finding — it's a genuine,
  reproducible headless-automation limitation, not a one-off artifact.
  Worked around for testing purposes by keeping the shooter grounded
  and having the target jump repeatedly through the ray height; **not a
  product bug**, no code change.
- With that workaround, criterion 4 (damage) and criterion 5 (round
  elimination, correct winner/score) both **verified working
  correctly** — server-authoritative damage computation matched
  `game/config/weapons.ts` exactly (18 × 1.5 headshot = 27 per hit),
  and round-end/next-round-countdown fired correctly.
- Criterion 7 (match end + rematch) surfaced a **second real bug**: the
  server resets its internal score to 0-0 on rematch but never
  broadcast that reset, so the client kept showing the just-finished
  match's final score through the whole first round of the rematch.
  **Fixed** (`BUG-007`) by resetting score client-side on every
  `matchStart` message.
- Criterion 6 (disconnect/reconnect) surfaced a **third real bug**,
  more serious than the first two: a client reconnecting mid-match
  (e.g. after a page reload) got permanently stuck on the pre-match
  "Ready" lobby overlay, unable to rejoin the in-progress match at all,
  because the server never told a reconnecting client that a match was
  already underway. **Fixed** (`BUG-008`) by adding a new `matchResume`
  server message sent on reconnect whenever `phase !== "lobby"`,
  carrying phase/round/score/health/shield/builds, which the client
  uses to hydrate directly into the ongoing match.
- The `BUG-007` fix, verified in isolation, turned out to be **too
  broad**: `matchStart` is broadcast both for genuine
  new-match/rematch starts *and* for the ordinary countdown before
  every next round within a match already in progress, and the fix
  couldn't tell them apart — so score was incorrectly reset to 0-0
  after every single round, not just on rematch. **Fixed** (`BUG-009`)
  by adding an `isNewMatch` flag to `MatchStartMsg`, computed
  server-side, and only resetting score/round client-side when it's
  true.
- Re-ran all four scenarios (fresh match through 5 rounds, rematch,
  disconnect, mid-match reconnect) after all fixes — all passed
  cleanly. Full verification suite (`tsc` ×2, `eslint`, `npm run build`,
  `wrangler deploy --dry-run`) re-run clean after removing the temporary
  debug logging used during diagnosis.
- **Not exercised this pass:** building and healing sync specifically
  (criterion 4 mentions them; combat/damage sync was prioritized given
  time, and both go through the same validated client→server→broadcast
  pattern as combat, so risk is judged low, but this is not the same as
  having watched it happen — flag as light residual risk, not a known
  bug).

**Relevant files (all touched during the fix):**
- `game/config/match.ts` — `PLAYER_SPAWNS` yaw fix (BUG-006)
- `stores/matchStore.ts` — `applyServerCountdown` now takes `isNewMatch`
  (BUG-007/BUG-009), new `applyServerResume` action (BUG-008)
- `game/networking/types.ts` — `MatchStartMsg.isNewMatch` (BUG-009), new
  `MatchResumeMsg` (BUG-008)
- `party/server.ts` — `onConnect` sends `matchResume` on mid-match
  reconnect (BUG-008); `rematchRequest` no longer double-broadcasts
  `matchStart` (BUG-009); `resetRound`/`maybeStartMatch` set
  `isNewMatch` correctly (BUG-009)
- `components/game/OnlineDuelScene.tsx` — handles `matchResume`
  (BUG-008), passes `isNewMatch` through (BUG-009)
- `party/server.ts`, `game/config/movement.ts` — unrelated: `PLAYER_SPAWNS`
  fix required no server change since spawns are client-only data

**Verification steps used (repeatable for future regressions):**
```bash
# Terminal 1
npm run party:dev        # http://localhost:8787
# Terminal 2
cp .env.example .env.local   # if not already present
npm run dev                    # http://localhost:3000 (or another port if 3000 is taken)
```
Two-client scripted verification was done with a scratch Playwright
setup (not committed to this repo — see `SESSION_LOG.md` for the exact
technique: two browser contexts, one creates a room, the other joins by
code, both ready up, then a grounded shooter + a repeatedly-jumping
target to work around the no-pointer-lock-in-headless-Chromium
limitation). A real two-human-browser test was **not** additionally
performed but is expected to behave at least as well, since real mouse
aim removes the only workaround-requiring constraint.

### T-002 — Fix `NEXT_PUBLIC_PARTY_HOST` production fallback (BUG-001) ✅ DONE (2026-08-06)
- **Status:** **Complete.** Chose option (a): fail loudly and visibly
  rather than silently connecting to `localhost:8787` in production.
- **Outcome:** `getPartyHost()` now throws a new `PartyHostUnconfiguredError`
  when the env var is unset and `window.location.hostname !== "localhost"`.
  `components/game/OnlineDuelScene.tsx`'s connect effect wraps `client.connect()` in a
  try/catch; on failure it sets `status: "disconnected"` and
  `errorMessage` to the thrown error's message, which
  `components/ui/OnlineLobbyOverlay.tsx` already rendered (pre-existing, previously
  unused for this case). See `DECISIONS.md` D-017.
- **Verified:** `tsc` ×2 clean; local dev (hostname === "localhost")
  still connects normally, confirmed via the live two-client tests run
  for T-004/T-005b below. The production-fallback throw path itself
  can't be exercised without a real non-localhost deploy (none has
  happened — see `PROJECT_STATE.md`), so it's verified by code
  review + type-check only, not a live repro.
- **Relevant files:** `game/networking/client.ts`,
  `components/game/OnlineDuelScene.tsx`

## Blocked

None currently.

## High priority

### T-003 — Reconcile Reset Arena behavior (BUG-004) ✅ DONE (2026-08-06)
- **Status:** **Complete.** Decision: removed the redundant "Reset
  Arena" button from `components/ui/MatchResults.tsx` entirely rather than wiring it
  to sync — the match is already over on that screen, "Rematch" already
  starts a correctly-synced fresh round/match, and "Reset Arena" there
  never did anything that mattered (it only cleared local builds/health,
  both already meaningless post-match). `components/ui/PauseMenu.tsx`'s "Reset Arena"
  (the one that matters, mid-match) is untouched.
- **Verified:** `tsc`/`eslint`/build clean; confirmed via code read that
  no other file referenced `components/ui/MatchResults.tsx`'s removed `resetArena`
  function/button.
- **Relevant files:** `components/ui/MatchResults.tsx`

### T-004 — Add server-side phase guard to `resetRound` (BUG-003) ✅ DONE (2026-08-06)
- **Status:** **Complete.** `resetRequest` is now a no-op unless
  `this.phase === "combat"`.
- **Verified live** via a raw-WebSocket test that bypassed the 3D client
  entirely (see T-005b's Outcome for why): confirmed `resetRequest`
  during `combat` still broadcasts `roundReset` as before (the allowed
  case doesn't regress), then eliminated a player to force `round-end`
  phase and confirmed a subsequent `resetRequest` produces **no**
  `roundReset` broadcast (the previously-buggy case is now correctly
  rejected).
- **Relevant files:** `party/server.ts` (`resetRequest` case)

## Medium priority

### T-005 — Fix duplicated bot-difficulty values (BUG-002) ✅ DONE (2026-08-06)
- **Status:** **Complete.** `components/game/BotPlayer.tsx` now reads
  `BOT_DIFFICULTY[difficulty].moveSpeedMultiplier` and `.aimAccuracy`
  directly; the two local `brainSpeedMultiplier`/`aimAccuracyFor`
  functions (which duplicated those exact values) are deleted.
- **Verified:** `tsc` clean (confirms no dangling references); live
  Bot Duel smoke test (see below) confirmed the bot still moves, aims,
  and fires correctly with the config-driven values.
- **Relevant files:** `components/game/BotPlayer.tsx`

### T-005b — Fix hardcoded build health on the server (BUG-005) ✅ DONE (2026-08-06)
- **Status:** **Complete.** `party/server.ts`'s `handleBuildPlace` now
  reads `BUILD_TYPES[msg.kind].health` instead of the literal `150`.
- **Verified live**, and this is worth explaining because the obvious
  approach (a scripted browser client placing a build) didn't work: with
  no real mouse movement, headless Chromium never grants Pointer Lock
  (D-011), so the camera's `forward` vector never updates from its
  initial spawn direction, and the build-ghost position computed from it
  landed somewhere invalid (self-overlap) every time — `tryPlaceBuild`
  bailed out client-side before ever sending `buildPlace` to the server,
  confirmed by checking `wrangler dev`'s local observability log (zero
  matching entries after a full click-to-place attempt). Instead, this
  was verified by **bypassing the 3D client entirely**: a small raw
  WebSocket script (native `WebSocket`, no browser) connected directly to
  the party server's wire protocol, went through ready→matchStart→
  roundStart, then sent a `buildPlace` message directly and inspected the
  `buildConfirmed` response — `health: 150, maxHealth: 150`, sourced from
  config, confirmed correct.
- **Relevant files:** `party/server.ts` (`handleBuildPlace`)

### T-006 — Wire up unused `BOT_DIFFICULTY` fields (BUG-003b) ✅ DONE (2026-08-06)
- **Status:** **Complete.** Decision: wire up rather than delete (see
  `DECISIONS.md` D-018) — the fields do map onto real, meaningful bot
  behavior differences, matching the original spec's "adjustable
  difficulty" intent more fully than deleting them would.
  - `reactionTime`: `BotBrain` now tracks continuous sight time
    (`continuousSightTime`) and only transitions into `"attack"` once it
    meets `cfg.reactionTime` — easy bots take longer to start engaging
    after first spotting the player.
  - `aggression`: a new periodic (every 1.5s) `pushDecision` roll in the
    `"attack"` state, gated by `Math.random() < cfg.aggression`, decides
    whether the bot closes distance or holds ground while still aiming/
    firing — low-aggression bots hold back more.
  - `viewDistance`: `components/game/BotPlayer.tsx`'s `canSee` computation now also
    requires `distance <= BOT_DIFFICULTY[difficulty].viewDistance`,
    capping how far a bot can perceive the player (previously unbounded
    given clear line of sight).
- **Verified:** `tsc` clean. Live Bot Duel smoke test (default Normal
  difficulty, viewDistance 32, exactly matching this arena's 32-unit
  spawn separation) confirmed the bot still detected, closed in on, and
  eliminated the test player within the observed window (round 1 ended
  with the bot winning, score OPP 1–YOU 0), with zero console errors —
  i.e. the new gating logic doesn't stall bot engagement. The specific
  difficulty-to-difficulty behavioral *differences* (easy visibly more
  passive than hard) were not separately A/B-tested live — low risk
  given the values are simple, bounded multipliers/thresholds on
  existing, already-verified code paths.
- **Relevant files:** `game/bots/fsm.ts`, `components/game/BotPlayer.tsx`

### T-007 — Explicit UI feedback for server-rejected build placement ✅ DONE (2026-08-06)
- **Status:** **Complete.** Added a new `case "buildRejected":` handler
  in `components/game/OnlineDuelScene.tsx` that calls a new `usePlayerStore` action
  `triggerBuildDenied()` and plays a new synthesized `buildDenied` sound.
  `components/ui/CombatHud.tsx` has a new `BuildDeniedToast` component (subscribed to
  the `buildDenied` timestamp trigger) that briefly shows a "Placement
  denied" toast — follows the exact same proven `key={trigger}`
  self-clearing-animation pattern already used for `hitMarker`/
  `damageFlash`/`eliminationMessage`.
- **Verified:** `tsc`/`eslint`/build clean. **Not verified with a live
  repro** — forcing a genuine server-side rejection requires either a
  true network race (two clients placing overlapping builds within the
  same round-trip window) or exceeding `maxActivePerPlayer`, both of
  which the client's own local pre-validation (same `validatePlacement`
  function, run client-side for the ghost) already blocks before ever
  sending to the server in a simple sequential-click test, and the
  headless-Chromium pointer-lock limitation (see T-005b) makes precise
  build-ghost positioning from a script unreliable anyway. Verified by
  code review + type-check + pattern-match with the proven-working
  `hitMarker` mechanism instead. Flag as light residual risk, not a
  known bug — a real two-human-browser session placing overlapping
  builds is the natural way to close this gap.
- **Relevant files:** `game/networking/types.ts` (no change — reused
  existing `BuildRejectedMsg`), `components/game/OnlineDuelScene.tsx`,
  `stores/playerStore.ts`, `game/audio/soundManager.ts`,
  `components/ui/CombatHud.tsx`

## Low priority

### T-008 — Remove dead protocol fields ✅ DONE (2026-08-06)
- **Status:** **Complete.** Removed `HelloMsg` from `ClientMessage`
  entirely (confirmed unreferenced anywhere via grep before removing).
  Removed `StateMsg.seq` and the corresponding `seq` counter in
  `game/networking/onlineAdapter.ts`'s `sendState` (decision: remove rather than wire up
  — the server already has an equivalent staleness/sanity check via
  `msg.timestamp`-derived speed validation in `handleState`, making a
  second sequence-number mechanism redundant). Removed the dead
  `stateSeq` ref from `components/game/LocalPlayer.tsx`.
- **Verified:** `tsc` ×2 clean (both the app and `party/tsconfig.json`
  configs — confirms no dangling reference on either side of the wire
  protocol).
- **Relevant files:** `game/networking/types.ts`,
  `game/networking/onlineAdapter.ts`, `components/game/LocalPlayer.tsx`

### T-009 — Delete unused default/leftover assets ✅ DONE (2026-08-06)
- **Status:** **Complete.** Removed `public/file.svg`, `globe.svg`,
  `next.svg`, `vercel.svg`, `window.svg`, and the empty `public/sounds/`
  directory. Confirmed via grep beforehand that nothing referenced any
  of them.
- **Verified:** `npm run build` succeeded cleanly after removal.
- **Relevant files:** `public/`

### T-010 — Wire up dead `MOVEMENT`/`BUILD_CONFIG` fields ✅ DONE (2026-08-06)
- **Status:** **Complete.** Decision: wire up `turnSmoothing` and
  `destructionEffectDuration` (both had an obvious, low-risk natural
  call site); remove `groundFriction` (no natural call site exists —
  movement is direct per-frame displacement, not velocity-integrated, so
  "friction" has no meaningful hook without a much larger change to the
  movement model, which is out of scope for a cleanup task). See
  `DECISIONS.md` D-019.
  - `turnSmoothing`: `components/game/BotPlayer.tsx` and `components/game/RemotePlayer.tsx` both had a
    hardcoded `10` in their `THREE.MathUtils.damp(...)` body-rotation
    calls — replaced with `MOVEMENT.turnSmoothing` (14) in both.
  - `destructionEffectDuration`: `components/game/EffectsLayer.tsx` had its own local
    `DESTRUCTION_LIFE = 0.6` constant duplicating this value — replaced
    both use sites with `BUILD_CONFIG.destructionEffectDuration`,
    imported from `game/config/builds.ts`.
  - `groundFriction`: deleted from `game/config/movement.ts`.
- **Verified:** `tsc`/`eslint`/build clean. The `turnSmoothing` value
  change (10 → 14, ~40% snappier body-rotation damping) is a minor
  visual tweak, not separately screenshot-diffed live — low risk.
- **Relevant files:** `game/config/movement.ts`,
  `components/game/BotPlayer.tsx`, `components/game/RemotePlayer.tsx`,
  `components/game/EffectsLayer.tsx`

## Bugs

Cross-referenced from `CLAUDE.md` → Known issues. Full details above
(or, for fixed bugs, in `DECISIONS.md`) under their respective entries.

| ID | Summary | Severity | Status | Task/Decision |
|---|---|---|---|---|
| BUG-001 | `NEXT_PUBLIC_PARTY_HOST` unset → silent localhost fallback in prod | Medium | **Fixed** 2026-08-06 | T-002, `DECISIONS.md` D-017 |
| BUG-002 | Bot difficulty values duplicated between config and `components/game/BotPlayer.tsx` | Low-Medium (currently in sync) | **Fixed** 2026-08-06 | T-005 |
| BUG-003 | Server `resetRound(false)` doesn't phase-guard | Low | **Fixed** 2026-08-06 | T-004 |
| BUG-003b | `BOT_DIFFICULTY.reactionTime`/`aggression`/`viewDistance` unused | Low | **Fixed** 2026-08-06 | T-006, `DECISIONS.md` D-018 |
| BUG-004 | Reset Arena inconsistent between PauseMenu and MatchResults | Low | **Fixed** 2026-08-06 | T-003 |
| BUG-005 | Server hardcodes build health (150) instead of reading `BUILD_TYPES` config | Low (currently in sync) | **Fixed** 2026-08-06 | T-005b |
| BUG-006 | `PLAYER_SPAWNS` yaw backwards — both players spawned facing away from each other/arena center | **High** (broke all aiming) | **Fixed** 2026-08-06 | `game/config/match.ts`, found via T-001 |
| BUG-007 | Client kept showing stale score through the first round after Rematch | Medium | **Fixed** 2026-08-06 | `stores/matchStore.ts`, found via T-001 |
| BUG-008 | Client reconnecting mid-match got stuck on the pre-match lobby forever, unable to rejoin | **High** | **Fixed** 2026-08-06 | New `matchResume` message, found via T-001 |
| BUG-009 | BUG-007's fix was too broad — reset score after every round, not just on rematch | Medium (regression introduced and fixed same session) | **Fixed** 2026-08-06 | `MatchStartMsg.isNewMatch`, found via T-001 |
| BUG-010 | Reconnecting during a `round-end`/`match-end` window resumes without the winner (no winner field in `matchResume`) | Low (narrow timing window) | Open — deferred | See `DECISIONS.md` D-008 note in `applyServerResume` |

## Technical debt

- No shared/typed schema validation on incoming WebSocket messages
  (both client and server trust `JSON.parse` output's shape matches the
  TypeScript type with no runtime check — a malformed-but-valid-JSON
  message could cause a `TypeError` deep in a handler rather than being
  rejected cleanly at the boundary).
- `party/server.ts`'s `rematchRequest` case in the `onMessage` switch
  declares `const other = ...` directly inside a `case` block without
  braces — works correctly (no naming collision with other cases) but is
  a minor style inconsistency worth a lint rule or brace-wrapping if
  touched again.

## Testing needed

See `TESTING.md` for the full breakdown. Highest-value gaps:
- ~~T-001 (live online test)~~ — done 2026-08-06, see above. A real
  (non-scripted) two-human-browser pass is still a reasonable follow-up
  but is no longer the top gap.
- Building and healing sync in Online 1v1 were not specifically
  exercised via the 3D client during T-001's live pass or this session
  (see T-005b/T-007's Outcome notes for why — headless Chromium's lack
  of Pointer Lock makes click-to-build unreliable to script). Server-side
  build logic (health, phase guard) was verified via a raw-WebSocket
  script instead, bypassing the 3D client entirely. A real
  (non-scripted) two-human-browser session is the natural way to close
  this gap, and would also be the way to get a genuine live repro of
  T-007's buildRejected toast.
- Bot difficulty *differences* (easy vs. hard actually feeling
  different after T-006's wiring) were not A/B-tested live — only
  Normal was exercised.
- No unit tests exist for `game/building/grid.ts` or `game/bots/fsm.ts`
  despite both being pure, easily-testable logic — good first targets if
  a test framework is introduced.
- No regression test exists for the Strict Mode/Rapier interaction fixed
  in `DECISIONS.md` D-004 — if Next.js or `@react-three/rapier` are ever
  upgraded, manually re-verify this doesn't regress (re-enable Strict
  Mode temporarily in a throwaway branch and check for the
  `computeColliderMovement` crash).

## Documentation needed

None outstanding — updated alongside the T-002–T-010 fixes in the same
session (see `SESSION_LOG.md`'s latest entry for the full file list).
Keep it updated per `CLAUDE.md`'s permanent rules as code changes.

## Recently completed

- **2026-08-06 (prior session, same day):** Full game build across all 7
  scoped phases (movement/camera/collision, combat, building, items+UI,
  bot AI, online multiplayer, polish). Verified via typecheck, lint,
  production build, Worker dry-run bundle, and one live browser smoke
  test of Bot Duel. `README.md` written. See `CHANGELOG.md` and
  `SESSION_LOG.md` for the full record.
- **2026-08-06 09:46 UTC session:** Full documentation/handoff system
  created (this file and 16 others). No product code changed.
- **2026-08-06 10:21 UTC session:** Account-switch checkpoint —
  re-verified static checks still pass, recovered two pieces of
  conversation-only context into `DECISIONS.md` (D-011, D-012),
  restructured this task entry (`T-001`) to be fully self-contained,
  refreshed `PROJECT_STATE.md`/`HANDOFF.md`/`CLAUDE.md`/`SESSION_LOG.md`.
- **2026-08-06 (later same day) session:** Executed `T-001` for real —
  live two-client Online 1v1 test. Found and fixed four real bugs
  (`BUG-006` spawn-facing, `BUG-007` stale rematch score, `BUG-008`
  mid-match reconnect stuck on lobby, `BUG-009` a regression from the
  BUG-007 fix itself). Confirmed `DECISIONS.md` D-011's pointer-lock
  finding as a real, reproducible headless-automation limitation.
  Verified the full match/rematch/disconnect/reconnect flow end-to-end
  after fixes. Full verification suite re-run clean. See
  `SESSION_LOG.md` for the complete record.
- **2026-08-06 (later same day, second half of session):** Worked
  through the entire remaining `TASKS.md` queue, `T-002` through
  `T-010`: production env-var fail-fast (`BUG-001`), removed the
  redundant post-match Reset Arena button (`BUG-004`), added a
  server-side phase guard to `resetRequest` (`BUG-003`), de-duplicated
  bot-difficulty values (`BUG-002`), fixed hardcoded server build health
  (`BUG-005`), wired up previously-unused `reactionTime`/`aggression`/
  `viewDistance` bot config fields into real FSM/perception behavior
  (`BUG-003b`), added a `buildRejected` UI toast+sound, removed dead
  `HelloMsg`/`StateMsg.seq` protocol fields, deleted unused leftover
  `public/` assets, and wired up `turnSmoothing`/
  `destructionEffectDuration` (removing the truly-unused
  `groundFriction`). Verified via the full static suite plus a live Bot
  Duel smoke test and a raw-WebSocket server-protocol test (worked
  around a genuine headless-Chromium Pointer-Lock limitation that made
  scripted online build-placement unreliable — see T-005b's Outcome).
  See `SESSION_LOG.md` for the complete record.

## Deferred

- Matchmaking (explicitly out of scope per the original product spec —
  private rooms by code only).
- Spectator mode (never scoped).
- Mobile/touch controls (explicitly out of scope — desktop keyboard/mouse
  only, per `README.md`/UI copy).

## Rejected ideas

None recorded — no rejected proposals found in the repository (no design
docs, no comments describing an abandoned approach).
