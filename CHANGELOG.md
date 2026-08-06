# CHANGELOG.md

Git history exists as of 2026-08-06 (see `PROJECT_STATE.md`) — entries
before that point were reconstructed from file modification timestamps
and direct knowledge of what was built, since this file didn't exist yet
during the initial build. Entries from this point on correspond to real
commits.

## [Unreleased]

### v0.2.0 — Lobby Update (2026-08-06)

Large expansion pass turning the game from a bare Bot Duel/Online 1v1
prototype into a live-service-style hub, per a detailed product spec.
Full detail in `SESSION_LOG.md`; see also the in-game Patch Notes
(`game/config/patchNotes.ts`).

- **New character rig** (`components/game/CharacterModel.tsx`): replaced
  the single-capsule silhouette with a jointed pelvis/spine/shoulder/
  elbow/hip/knee rig (still procedural geometry, no GLTF), driven by a
  new declarative animation system (`game/animation/pose.ts`) covering
  idle/walk/sprint/jump/fall/land locomotion and rifle/shotgun/pistol/
  reload/heal/shield/build arm poses, plus fire-recoil and hit-flinch
  one-shots and an eliminated/victory override. Wired into the local
  player, bots, and remote players.
- **New Lobby hub** (`components/ui/Lobby.tsx`) replacing the old
  `MainMenu`: Play/Locker/Shop/Quests/Profile tabs, an idle-animated 3D
  character preview reflecting the equipped skin, a level/XP bar, coin
  balance, a daily-reward button with a claimable-today badge, a news
  panel, and a patch notes viewer.
- **Player progression** (`stores/profileStore.ts`,
  `game/config/levels.ts`): 50 levels with an increasing XP curve, XP
  awarded for completing/winning matches, eliminations, every 500
  damage dealt, and first win of the day; coins awarded for playing and
  winning; full match/win/loss/elimination/damage/streak stats tracked
  and shown in the new Profile tab. Wired into real match outcomes via
  `MatchResults.tsx`, which now shows an XP/coins/level-up summary.
- **Daily login rewards** (`game/config/dailyRewards.ts`): a 7-day coin/
  cosmetic cycle, one claim per calendar day, shown as a popup on lobby
  entry when available.
- **Cosmetic system** (`stores/inventoryStore.ts`,
  `game/config/cosmetics.ts`): 8 original starter skins (Street Runner,
  Vanguard-9, Neon Circuit, Dune Wanderer, Frostline, Casual Comp,
  Nightfall, 8-Bit Brawler) plus the default, each with a name, rarity,
  description, and distinct colors — purchasable in a real (if not yet
  daily-rotating) Shop tab using only earned Arena Coins, equippable in
  a real Locker tab. No cosmetic affects gameplay stats.
- **Training Arena** — a new third game mode: spawn alone, shoot
  respawning target dummies, build freely, no score or matchmaking,
  reuses the existing pause-menu "Reset Arena" for instant resets.
- Six new synthesized UI sounds (level up, coin gain, purchase, equip)
  and a `damageDealt` counter on `matchStore` for match-end stat
  tracking.
- Initialized a git repository for this project (previously untracked,
  zero commits anywhere) and began committing checkpoints per phase.

### 2026-08-06 (later same day, third part) — First real deployment

- **Deployed for the first time**, both halves:
  - App: https://buildstrike-arena.vercel.app (Vercel)
  - Realtime backend: `buildstrike-arena-realtime.chamber-seven.workers.dev`
    (Cloudflare Workers)
  - `NEXT_PUBLIC_PARTY_HOST` wired together in Vercel's Production
    environment; live connectivity between the two confirmed.
- Replaced the stale default `create-next-app` scaffold `favicon.ico`
  with the project's already-existing custom `icon.svg` (deleted the
  former so the latter is the sole, consistent app icon).
- No git commits were made anywhere in this project — deployed directly
  via the Vercel/Wrangler CLIs from the local directory.

### 2026-08-06 (later same day, second half) — T-002 through T-010: fixed BUG-001–BUG-005 and BUG-003b

- Worked through the entire remaining `TASKS.md` priority queue left
  over from the original documentation audit.
- **Fixed `BUG-001`:** `NEXT_PUBLIC_PARTY_HOST` unset now fails loudly
  with a clear, user-visible error in production instead of silently
  falling back to `localhost:8787` and hanging forever.
- **Fixed `BUG-004`:** removed the redundant, non-syncing "Reset Arena"
  button from the post-match results screen entirely (it never did
  anything meaningful once the match was already over).
- **Fixed `BUG-003`:** the server now rejects `resetRequest` unless a
  match is actually in `combat` phase, preventing it from clobbering the
  round-end→countdown→combat sequence if triggered at the wrong moment.
- **Fixed `BUG-002`:** `BotPlayer.tsx` no longer duplicates
  aim-accuracy/move-speed values in local hardcoded functions — reads
  `BOT_DIFFICULTY[difficulty]` directly.
- **Fixed `BUG-005`:** the server no longer hardcodes build health as a
  literal `150` — reads it from `BUILD_TYPES[kind].health`.
- **Fixed `BUG-003b`:** `reactionTime`, `aggression`, and `viewDistance`
  — three bot-difficulty config fields that were defined but never
  read — now genuinely affect bot behavior (delayed engagement,
  push-vs-hold decisions, and a real perception range cap,
  respectively).
- Added a `buildRejected` UI reaction (toast + sound) that was
  previously entirely unhandled client-side.
- Removed dead protocol fields (`HelloMsg`, `StateMsg.seq`) and their
  last client-side remnant (`LocalPlayer.tsx`'s unused `stateSeq` ref).
- Deleted six unused leftover `public/` assets from the original
  `create-next-app` scaffold.
- Wired up two more previously-dead config fields
  (`MOVEMENT.turnSmoothing`, `BUILD_CONFIG.destructionEffectDuration`)
  into their obvious call sites; deleted the one that had no natural
  call site (`MOVEMENT.groundFriction`).
- Verified via the full static suite (`tsc` ×2, `eslint`, `npm run
  build`, `wrangler deploy --dry-run`, all clean) plus a live Bot Duel
  smoke test and a raw-WebSocket direct-protocol test — the latter
  written specifically because headless Chromium's inability to grant
  Pointer Lock made scripted browser-based verification of online build
  placement unreliable (see `DECISIONS.md`/`SESSION_LOG.md` for the full
  story).
- **Not fixed, still open:** `BUG-010` (reconnecting during round-end/
  match-end doesn't show the winner — narrow timing window, low
  severity, pre-existing from the `T-001` session).

### 2026-08-06 (later same day) — T-001 executed: Online 1v1 live-tested, 4 bugs fixed

- Ran `TASKS.md`'s `T-001` for real: a live two-client Online 1v1 test
  (scripted via Playwright, ad hoc, not a repo dependency), rather than
  leaving it as a planned-but-unrun item.
- **Fixed `BUG-006`:** `PLAYER_SPAWNS` in `game/config/match.ts` had both
  spawns' `yaw` swapped, so both players faced *away* from each other
  and the arena center — every shot missed regardless of aim. This was
  the root cause that made the test initially look completely broken.
- **Fixed `BUG-007` then `BUG-009`:** score displayed stale values after
  a rematch (`applyServerCountdown` never reset it); the first fix reset
  score on every `matchStart`, which turned out to be broadcast on
  *every* round transition too, so score was wrongly wiped each round.
  Final fix: server now sends an explicit `isNewMatch` flag on
  `matchStart`, and the client only resets score when it's true.
- **Fixed `BUG-008`:** a client reconnecting mid-match got permanently
  stuck on the pre-match lobby screen with no way back into the ongoing
  match — the server had no mechanism to tell a reconnecting client a
  match was already in progress. Added a new `matchResume` server
  message (phase/round/score/health/shield/builds) and a client handler
  that hydrates state directly into the running match.
- Confirmed (not just assumed) that Pointer Lock never engages in
  headless Chromium in this environment — a real, reproducible testing
  limitation, now documented in `DECISIONS.md` D-011.
- Cleaned up temporary debug logging added during diagnosis; re-ran the
  full verification suite (`tsc` ×2, `eslint`, `npm run build`,
  `wrangler deploy --dry-run`) clean after all fixes.
- Updated `.eslintignore`-equivalent (`eslint.config.mjs`) to exclude
  `.wrangler/**` generated files.
- **Not fixed, deliberately deferred:** `BUG-001` through `BUG-005`,
  `BUG-003b` (all pre-existing), and a newly-found `BUG-010` (a client
  reconnecting during the brief round-end/match-end window resumes
  without the winner shown — narrow timing window, low severity). See
  `TASKS.md`.

### 2026-08-06 — Documentation & handoff audit

- Performed a full repository audit (no product code changes) to prepare
  this project for a clean handoff to a new working session with no
  access to prior chat history.
- **Created** the permanent in-repo documentation system: `PROJECT_STATE.md`,
  `ARCHITECTURE.md`, `FILE_MAP.md`, `FEATURES.md`, `TASKS.md`,
  `ROADMAP.md`, `DECISIONS.md`, `DATABASE.md`, `API_REFERENCE.md`,
  `UI_SYSTEM.md`, `SECURITY.md`, `TESTING.md`, `DEPLOYMENT.md`,
  `CHANGELOG.md` (this file), `SESSION_LOG.md`, `HANDOFF.md`.
- **Rewrote** `CLAUDE.md` from a one-line `@AGENTS.md` import into the
  full project operating manual (the `@AGENTS.md` import is preserved at
  the top of the new file).
- **Significant problems discovered** during the audit (all now tracked
  in `TASKS.md`): `NEXT_PUBLIC_PARTY_HOST` silently falls back to
  `localhost:8787` in production if unset (`BUG-001`); bot-difficulty
  values are duplicated between `game/config/bots.ts` and
  `components/game/BotPlayer.tsx` (`BUG-002`); the server's
  `resetRound(false)` doesn't guard against the current match phase
  (`BUG-003`); three `BOT_DIFFICULTY` fields are defined but never read
  by the bot FSM (`BUG-003b`); the "Reset Arena" button behaves
  differently depending on which screen it's clicked from in online mode
  (`BUG-004`); the server hardcodes build health instead of reading it
  from config (`BUG-005`); several dead protocol/config fields exist
  (`HelloMsg`, `StateMsg.seq`, `LocalPlayer.tsx`'s own `stateSeq`,
  `MOVEMENT.groundFriction`/`turnSmoothing`,
  `BUILD_CONFIG.destructionEffectDuration`); six unused/leftover files
  exist under `public/`. None of these were fixed as part of this
  audit — see `TASKS.md` for the full list with acceptance criteria.
- **No product behavior was intentionally changed.** Verification
  commands (`tsc` ×2, `eslint`, `npm run build`,
  `wrangler deploy --dry-run`) were re-run to confirm the project's
  actual current state and all passed cleanly — see `PROJECT_STATE.md`
  for exact output.

### 2026-08-05 → 2026-08-06 (overnight) — Initial build

- Built BuildStrike Arena from scratch across all 7 originally-scoped
  phases: foundation/movement/camera/collision, combat (rifle + shotgun,
  hitscan, health/shield/elimination), building (wall/floor/ramp with
  grid snapping and placement validation), items + UI (healing items,
  HUD, menus, settings), bot AI (finite-state-machine, 3 difficulty
  tiers), online multiplayer (Cloudflare Workers/Durable Objects
  realtime backend, server-authoritative damage/rate/build validation),
  and polish (procedural audio synthesis, pooled visual effects,
  favicon/logo, loading screen).
- Fixed a real crash found via live browser testing: React Strict
  Mode's dev-only double-invoked `useMemo` corrupted Rapier's
  `KinematicCharacterController` — resolved by disabling Strict Mode
  project-wide (`next.config.ts`) and removing an unsafe controller
  cleanup effect (`game/physics/useCharacterMover.ts`). See
  `DECISIONS.md` D-004.
- Verified via `tsc` (both configs), `eslint`, `next build`,
  `wrangler deploy --dry-run`, and one scripted Playwright smoke test of
  Bot Duel mode (menu → match → movement/shooting/build-mode, zero
  console errors, confirmed via screenshots).
- Wrote the initial `README.md` (setup, deployment, testing checklist,
  known limitations, third-party asset licensing statement).
- **Not done in this period:** any git commit, any real deployment, any
  live test of Online 1v1 with two connected clients.
