# SESSION_LOG.md

Chronological log for AI working sessions on this project. **Append new
entries — do not overwrite or delete prior ones.** Newest entry at the
bottom (chronological order), unlike `CHANGELOG.md` which is
newest-first.

---

### Session: 2026-08-05 → 2026-08-06 (overnight) — Initial build

- **Account/agent:** Unknown (not recorded at the time; this project's
  documentation system did not exist yet)
- **Goal:** Build BuildStrike Arena, a browser-based 3D 1v1
  build-and-shoot duel game, per a detailed product specification
  (Fortnite-1v1-inspired, fully original assets, Bot Duel + Online 1v1
  modes), across 7 defined phases.
- **Files inspected:** N/A (greenfield build — nothing pre-existed
  beyond the create-next-app scaffold).
- **Files changed:** The entire project — see `FILE_MAP.md` for the full
  current-state map. ~68 source files, ~5,166 lines (measured this audit
  session via `wc -l`).
- **Commands run (reconstructed from evidence, not a literal log):**
  `create-next-app`, multiple `npm install` passes (R3F/drei/rapier,
  zustand, partysocket/partyserver/wrangler, `@cloudflare/workers-types`),
  `npx tsc --noEmit`, `npx eslint .`, `npm run build`,
  `npx wrangler deploy --dry-run`, a Playwright-based browser smoke test
  (installed ad hoc, not a project dependency).
- **Tests run:** No automated test suite (none exists). One scripted
  browser session verifying Bot Duel end-to-end with zero console
  errors, plus the static verification commands above.
- **Results:** All static verification passed. Bot Duel confirmed
  working live. Online 1v1 was code-complete and typechecked/bundled
  cleanly but was **not** tested with two live clients.
- **Decisions made:** See `DECISIONS.md` D-001 through D-010 — notably
  disabling React Strict Mode (D-004) after reproducing a real Rapier
  character-controller corruption crash live in the browser, and scoping
  four ESLint React-Compiler hook rules off for game-engine code (D-005)
  after they misfired on correct react-three-fiber patterns.
- **Problems found:** The Strict Mode/Rapier crash (found and fixed
  within this same session — not left open). No other problems were
  documented at the time (this project had no `TASKS.md`/`CLAUDE.md`
  system yet to record them in).
- **Work completed:** All 7 phases of the original product spec have
  working, verified (to the extent described above) code.
- **Work remaining:** Live Online 1v1 verification; no git commit or
  real deployment had been done.
- **Recommended next action (as of the end of this session):** Not
  explicitly recorded — inferred from the state left behind to be "test
  Online 1v1, then deploy."

---

### Session: 2026-08-06 — Documentation & handoff audit (this session)

- **Account/agent:** Claude Code session, invoked specifically to
  prepare this repository for handoff to a brand-new account with zero
  access to prior conversation history.
- **Goal:** Full repository audit + creation of a permanent, in-repo
  documentation/memory system (17 files) so a new session can resume
  work with minimal rediscovery. Explicitly **not** a product-feature
  task — no new gameplay code was to be written.
- **Files inspected (read in full or substantially, this session):**
  `package.json`, `package-lock.json` (via `npm ls`), `tsconfig.json`,
  `party/tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`,
  `next.config.ts`, `.gitignore`, `.env.example`, `wrangler.jsonc`,
  `CLAUDE.md` (prior one-line version), `AGENTS.md`, `README.md`,
  `components/game/LocalPlayer.tsx`, `components/game/BotPlayer.tsx`,
  `components/game/OnlineDuelScene.tsx`, `components/game/BotDuelScene.tsx`, `components/game/RemotePlayer.tsx`,
  `components/game/GameCanvas.tsx`, `party/server.ts`, `game/networking/types.ts`,
  `game/networking/onlineAdapter.ts`, all `game/config/*.ts`, `game/building/grid.ts`,
  `game/physics/damageable.tsx`, `stores/playerStore.ts`,
  `stores/matchStore.ts`, `stores/settingsStore.ts`, `stores/networkStore.ts`,
  `app/page.tsx`, `app/layout.tsx`, plus a full repository file tree and
  targeted `grep` sweeps for `TODO`/`FIXME`/`console.log`/
  `eslint-disable`/`as any`/`localhost`/dead-config usage across the
  entire `app/`, `components/`, `game/`, `hooks/`, `stores/`, `party/`
  trees.
- **Files changed:**
  - Rewrote: `CLAUDE.md` (from a 1-line `@AGENTS.md` import to the full
    operating manual)
  - Created: `PROJECT_STATE.md`, `ARCHITECTURE.md`, `FILE_MAP.md`,
    `FEATURES.md`, `TASKS.md`, `ROADMAP.md`, `DECISIONS.md`,
    `DATABASE.md`, `API_REFERENCE.md`, `UI_SYSTEM.md`, `SECURITY.md`,
    `TESTING.md`, `DEPLOYMENT.md`, `CHANGELOG.md`, `SESSION_LOG.md`
    (this file), `HANDOFF.md`
  - **No product/game source code was modified.**
- **Commands run:**
  - `git status`, `git rev-parse --is-inside-work-tree`,
    `git rev-parse --show-toplevel` — established there is no commit
    history and this project isn't its own git repo.
  - `find . ... -type f | sort` — full file tree (excluding
    node_modules/.next/.wrangler/.git).
  - `grep -rn` sweeps for TODO/FIXME/HACK/WIP, placeholder/mock/dummy/
    stub, `console.log`, `eslint-disable`, `@ts-ignore`/`as any`,
    `localhost`, `disabled`/`deprecated`, and specific dead-config-field
    usages (`groundFriction`, `turnSmoothing`,
    `destructionEffectDuration`, `reactionTime`, `.aggression`,
    `viewDistance`, `"hello"` message type).
  - `node -v`, `npm -v`, `npm ls --depth=0` — exact runtime/dependency
    versions.
  - `wc -l` across all source files — line-count inventory.
  - `npx tsc --noEmit -p tsconfig.json` → exit 0
  - `npx tsc -p party/tsconfig.json` → exit 0
  - `npx eslint . --ext .ts,.tsx` → exit 0 (2 pre-existing warnings)
  - `rm -rf .next && npm run build` → succeeded
  - `npx wrangler deploy --dry-run --outdir /tmp/wrangler-dryrun-2` →
    succeeded
- **Tests run:** No automated tests exist to run. The verification
  commands above are the full extent of this session's checks — no
  manual/live browser testing was performed in this session (the prior
  session's Playwright verification was reviewed as historical evidence,
  not re-run).
- **Results:** Every verification command passed cleanly, confirming the
  project's state as left by the prior session is accurately
  reproducible. No regressions found.
- **Decisions made:** None architectural — this was a documentation-only
  session. Editorial decisions made: assigned bug IDs `BUG-001` through
  `BUG-005` and task IDs `T-001` through `T-010`/`T-005b` to organize
  findings; chose to document the `party/server.ts` build-health
  hardcoding as `BUG-005` (found during this audit, not previously
  tracked anywhere).
- **Problems found (newly discovered this session, not present in any
  prior documentation since none existed):** See `TASKS.md` → Bugs for
  the full list (`BUG-001` through `BUG-005`) and → Technical debt for
  the dead-code findings. Full detail also cross-referenced in
  `CLAUDE.md` → Known issues, `DATABASE.md`, `SECURITY.md`.
- **Work completed:** The full 17-file documentation/memory system
  (16 new files + 1 rewritten `CLAUDE.md`), cross-checked for internal
  consistency (see the verification pass note below).
- **Work remaining:** All product-development work remains exactly as it
  was at the end of the prior session — see `PROJECT_STATE.md` →
  "Recommended next three actions." This session did not advance product
  development by design.
- **Recommended next action:** Run `TASKS.md` `T-001` (live two-client
  Online 1v1 test) — see `HANDOFF.md` for the ready-to-use prompt.

---

### Session: 2026-08-06 10:21 UTC — Account-switch checkpoint (this session)

- **Account/agent:** Claude Code session, explicitly invoked as a
  "final account-switch checkpoint" ahead of handing the project to a
  different Claude Code account with access to the same local repo and
  Git history but no conversation history.
- **Goal:** Verify the repository's current state, refresh the
  documentation system to reflect it exactly, recover any
  decisions/context that existed only in conversation history and were
  not yet written into the repo, and confirm the project is genuinely
  ready for a cold handoff. Explicitly **not** a feature-implementation
  task — instructed not to implement anything new, and not to discard,
  reset, commit, push, deploy, or change application behavior.
- **Files inspected:** `git status`, `git branch --show-current`,
  `git log` (all re-run to confirm no change since the prior audit);
  `find` for files modified since the prior audit's timestamp (none
  found); `hooks/usePointerLock.ts` (re-read to confirm the exact
  wording of its existing code comment before deciding what additional
  context needed recording); grep sweeps across `DECISIONS.md`/
  `CLAUDE.md`/`TASKS.md`/`PROJECT_STATE.md` for `WrongDocumentError`/
  `pointer lock`/`rotate.*key`/`BUILD_KEYS`/`configurable key` to
  confirm two specific pieces of conversation-only context were in fact
  not yet documented anywhere in the repo.
- **Files changed:**
  - `DECISIONS.md` — appended D-011 (pointer-lock promise-rejection
    handling, including the unresolved question of whether its trigger
    was a real condition or a test-harness artifact) and D-012 (three
    deliberate resolutions of ambiguous points in the original,
    out-of-repo product brief: build-rotate key, healing-item wheel
    scope, right-click "aim" behavior).
  - `PROJECT_STATE.md` — new audit timestamp/record, git state
    re-confirmed, "what changed since prior audit" section added,
    verification results refreshed, new assumption noted (D-012).
  - `TASKS.md` — `T-001` restructured into the fully self-contained
    format requested (exact objective / completed / remaining /
    relevant files / known errors / blockers / acceptance criteria /
    verification steps); "Recently completed" appended.
  - `HANDOFF.md` — header timestamp, "current task" and "previous
    agent" sections updated to include this session and the new
    `DECISIONS.md` entries.
  - `CLAUDE.md` — see below.
  - This file (`SESSION_LOG.md`) — this entry appended.
  - **No product/game source code was modified.**
- **Commands run:**
  - `git branch --show-current`, `git status`, `git rev-parse
    --show-toplevel`, `git log --oneline -20` (fails — "no commits yet,"
    as expected and unchanged from the prior audit)
  - `find . ... -newermt "2026-08-06 09:50:00" -print` — confirmed zero
    files changed between the prior audit and the start of this session
  - `npx tsc --noEmit -p tsconfig.json` → exit 0
  - `npx tsc -p party/tsconfig.json` → exit 0
  - `npx eslint . --ext .ts,.tsx` → exit 0 (same 2 pre-existing warnings)
  - `rm -rf .next && npm run build` → succeeded
  - (`wrangler deploy --dry-run` was **not** re-run this session — no
    file it depends on changed since it last passed; noted explicitly in
    `PROJECT_STATE.md` rather than silently assumed)
  - `grep -rniE "sk-|api[_-]?key|secret|password|AKIA[0-9A-Z]{16}|token\s*="`
    across every `.md` file in the repo root — zero matches (no secrets
    present)
- **Tests run:** No automated tests exist. No manual/live browser
  testing was performed this session (nothing changed that would need
  it; the prior session's live verification stands as the most recent
  live evidence).
- **Results:** Repository state confirmed identical to the prior audit
  in every material respect (no commits, no file changes, all static
  checks still pass). Two pieces of previously-undocumented context were
  successfully recovered from conversation history and written into
  `DECISIONS.md`.
- **Decisions made:** None architectural. Assigned decision IDs D-011
  and D-012 to organize the newly-recovered context, consistent with the
  existing D-001…D-010 scheme.
- **Problems found:** No new bugs. Confirmed the existing `BUG-001`
  through `BUG-005` / `T-001`…`T-010` inventory in `TASKS.md` is still
  accurate and complete as of this session — no additions or removals
  were needed there beyond the `T-001` restructuring.
- **Work completed:** Documentation-consistency checkpoint across all 17
  files plus `README.md`; cross-checked current-task description for
  consistency across `CLAUDE.md`/`PROJECT_STATE.md`/`TASKS.md`/
  `HANDOFF.md`; confirmed no secrets/real environment values exist in
  any documentation file.
- **Work remaining:** Identical to the prior session — see
  `PROJECT_STATE.md` → "Recommended next three actions." This session
  did not advance product development, by explicit instruction.
- **Recommended next action:** Run `TASKS.md` `T-001` (live two-client
  Online 1v1 test) — the task entry now contains everything needed to
  start it without further discovery.

---

### Session: 2026-08-06 (later same day) — Executed T-001, found and fixed 4 real bugs

- **Account/agent:** Claude Code session, continuing directly from the
  prior checkpoint session per user instruction ("continue building the
  app from where it left off in the memory").
- **Goal:** Pick up `TASKS.md`'s designated next task, `T-001` (live
  two-client Online 1v1 test), and actually execute it — not just plan
  it. Fix whatever it revealed, per the task's own stated scope.
- **Files inspected:** `TASKS.md`/`PROJECT_STATE.md`/`HANDOFF.md` (to
  resume correctly), then extensive back-and-forth reading of
  `game/config/match.ts`, `components/game/LocalPlayer.tsx`,
  `party/server.ts`, `game/networking/types.ts`,
  `components/game/OnlineDuelScene.tsx`, `stores/matchStore.ts`,
  `components/ui/Lobby.tsx` (renamed/refactored from a prior `components/ui/Lobby.tsx`, per session-log history)/`components/ui/OnlineLobbyOverlay.tsx` (for test
  selector purposes), `hooks/usePointerLock.ts`.
- **Files changed:**
  - `game/config/match.ts` — fixed `PLAYER_SPAWNS` yaw (`BUG-006`)
  - `stores/matchStore.ts` — `applyServerCountdown` now takes
    `isNewMatch`; new `applyServerResume` action (`BUG-007`/`BUG-008`/
    `BUG-009`)
  - `game/networking/types.ts` — `MatchStartMsg.isNewMatch`; new
    `MatchResumeMsg` (`BUG-008`/`BUG-009`)
  - `party/server.ts` — sends `matchResume` on mid-match reconnect;
    `rematchRequest` no longer double-broadcasts `matchStart`; sets
    `isNewMatch` correctly in both `matchStart` broadcast sites
    (`BUG-008`/`BUG-009`); temporary debug `console.log` statements
    added during diagnosis and removed before finishing
  - `components/game/LocalPlayer.tsx` — temporary debug `console.log`
    added during diagnosis and removed before finishing
  - `components/game/OnlineDuelScene.tsx` — handles `matchResume`;
    passes `isNewMatch` through
  - `eslint.config.mjs` — added `.wrangler/**` to ignores (this
    session's `wrangler dev` usage generated temp bundle files that
    ESLint started flagging; harmless generated output, now excluded
    like `.next/**` already was)
  - Documentation: `TASKS.md`, `DECISIONS.md` (D-011 updated with
    confirmation; D-013–D-016 added), `PROJECT_STATE.md`, `FEATURES.md`,
    `HANDOFF.md`, `CLAUDE.md`, `API_REFERENCE.md`, this file
- **Commands run:**
  - `cp .env.example .env.local`
  - `nohup npm run party:dev` (background, port 8787) and `npm run dev`
    (background, port 3000 initially)
  - A scratch Playwright setup (`npm install playwright` in the
    session's scratchpad directory, **not** this repo) driving two
    independent browser contexts through: create room → capture room
    code from the DOM → join with that code in the second context →
    both click Ready → wait for combat → fire/jump to exercise
    hit-detection (see note below on why) → read HUD text/screenshot to
    observe results. Iterated this script many times while diagnosing.
  - `npx tsc --noEmit -p tsconfig.json`, `npx tsc -p party/tsconfig.json`,
    `npx eslint . --ext .ts,.tsx`, `rm -rf .next && npm run build`,
    `npx wrangler deploy --dry-run` — all re-run multiple times across
    the session, clean (exit 0) at every checkpoint and at the end.
  - Mid-session: the original `npm run dev` background process was
    found to have died (no crash logged, most likely reaped by the
    sandboxed environment across a very long multi-hour session), and
    port 3000 had been independently claimed by an unrelated project
    (`~/Projects/anime-sim`, confirmed via `ps`/`lsof` before touching
    anything). **That other project's process was left completely
    untouched.** Restarted this project's dev server on port 3100
    instead (`npx next dev -p 3100`).
- **Tests run:** No automated tests exist. All verification was the
  scripted-Playwright two-client sessions described above (not
  committed to this repo — this was ad hoc verification tooling, not a
  project deliverable) plus the standard static verification suite.
- **Results / decisions made / problems found:** See `DECISIONS.md`
  D-013 (`BUG-006` — spawn yaw backwards, found because a stationary
  scripted shot never landed and the geometry traced back to both
  players facing away from each other/the arena center), D-011's update
  (confirmed headless Chromium never grants Pointer Lock in this
  environment — `document.pointerLockElement` verified via
  `page.evaluate` to stay `null` through every attempt; this is why the
  live test needed a "grounded shooter + repeatedly-jumping target"
  workaround instead of realistic mouse aim to land hits during
  scripted testing), D-014/D-016 (`BUG-007` then `BUG-009` — rematch
  score not resetting, then the fix for that resetting score on *every*
  round instead of just rematches, both found live by actually playing
  through multiple rounds and a rematch), D-015 (`BUG-008` — mid-match
  reconnect permanently stuck on the lobby screen, the most severe
  finding, found by using `page.reload()` on the *same* Playwright page/
  tab to correctly simulate a same-session reconnect — an earlier
  attempt using `page.close()` + a fresh `Page` in the same
  `BrowserContext` did **not** reproduce it, because `sessionStorage` is
  scoped per top-level browsing context/tab and isn't shared between
  distinct `Page` objects even in the same context, a useful
  methodology note preserved in D-015 for future reconnection testing).
- **Work completed:** `T-001` fully executed and passed (all 8
  acceptance criteria); four real bugs found and fixed; temporary debug
  logging cleaned up; full verification suite re-confirmed clean;
  documentation system updated throughout (see file list above).
- **Work remaining:** `TASKS.md` `T-002` onward (`BUG-001` and the other
  pre-existing lower-severity items, none new this session except the
  narrow, deliberately-deferred `BUG-010`). Bot Duel wasn't re-run after
  the `BUG-006` spawn fix (low risk, quick to check). Building/healing
  sync in Online 1v1 and a real non-scripted two-human-browser session
  remain unexercised. See `PROJECT_STATE.md` → "Recommended next three
  actions" for the prioritized list.
- **Recommended next action:** `TASKS.md` `T-002` (`BUG-001` —
  `NEXT_PUBLIC_PARTY_HOST` production fallback behavior) before any real
  deployment is attempted.

---

### Session: 2026-08-06 (later same day, second half) — Worked through T-002–T-010, fixed BUG-001–BUG-005 and BUG-003b

- **Account/agent:** Claude Code session, direct continuation of the
  same session that ran `T-001` (user said "ok continue with the rest"
  after the `T-001` wrap-up report).
- **Goal:** Work through the rest of `TASKS.md`'s priority-ordered queue
  left over from the original documentation audit — `T-002` through
  `T-010`, covering `BUG-001` through `BUG-005`, `BUG-003b`, and three
  cleanup/additive tasks.
- **Files inspected:** `TASKS.md` in full (to plan the remaining queue),
  then per-task: `game/networking/client.ts`, `stores/networkStore.ts`,
  `components/ui/ConnectionStatus.tsx`, `components/ui/OnlineLobbyOverlay.tsx`,
  `components/game/OnlineDuelScene.tsx`, `components/ui/PauseMenu.tsx`,
  `components/ui/MatchResults.tsx`, `party/server.ts` (`resetRound`,
  `handleBuildPlace`, `handleState`), `game/config/bots.ts`,
  `components/game/BotPlayer.tsx`, `game/bots/fsm.ts`,
  `game/building/grid.ts`, `hooks/useMouseButtons.ts`,
  `stores/playerStore.ts`, `game/audio/soundManager.ts`,
  `components/ui/CombatHud.tsx`, `game/networking/types.ts`,
  `game/networking/onlineAdapter.ts`, `components/game/LocalPlayer.tsx`,
  `game/config/movement.ts`, `components/game/RemotePlayer.tsx`,
  `components/game/EffectsLayer.tsx`, `public/` directory listing.
- **Files changed:**
  - `game/networking/client.ts` — new `PartyHostUnconfiguredError`;
    `getPartyHost()` throws instead of falling back (`T-002`)
  - `components/game/OnlineDuelScene.tsx` — try/catch around
    `client.connect()` (`T-002`); new `case "buildRejected"` handler
    (`T-007`)
  - `components/ui/MatchResults.tsx` — removed the non-syncing "Reset
    Arena" button and its handler (`T-003`)
  - `party/server.ts` — `resetRequest` case now phase-guarded (`T-004`,
    temporary debug `console.log` added during verification then
    removed); `handleBuildPlace` reads `BUILD_TYPES[msg.kind].health`
    instead of a literal `150` (`T-005b`, same temporary debug log)
  - `components/game/BotPlayer.tsx` — reads `BOT_DIFFICULTY[difficulty]`
    directly, deleted `aimAccuracyFor`/`brainSpeedMultiplier` (`T-005`);
    `canSee` now also checks `viewDistance` (`T-006`); `turnSmoothing`
    wired into the body-rotation damp call (`T-010`)
  - `game/bots/fsm.ts` — `continuousSightTime`/`hasReacted` gate on the
    attack transition (`reactionTime`); periodic `pushDecision` roll in
    the attack state (`aggression`) (`T-006`)
  - `stores/playerStore.ts` — new `buildDenied` trigger +
    `triggerBuildDenied()` action (`T-007`)
  - `game/audio/soundManager.ts` — new `buildDenied` synthesized sound
    (`T-007`)
  - `components/ui/CombatHud.tsx` — new `BuildDeniedToast` component
    (`T-007`)
  - `game/networking/types.ts` — removed `HelloMsg`, removed
    `StateMsg.seq` (`T-008`)
  - `game/networking/onlineAdapter.ts` — removed the `seq` counter
    (`T-008`)
  - `components/game/LocalPlayer.tsx` — removed the dead `stateSeq` ref
    (`T-008`)
  - `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`,
    `window.svg`, `public/sounds/` — deleted (`T-009`)
  - `components/game/RemotePlayer.tsx` — `turnSmoothing` wired into its
    body-rotation damp call (`T-010`)
  - `components/game/EffectsLayer.tsx` — imports and uses
    `BUILD_CONFIG.destructionEffectDuration` instead of a local
    duplicate constant (`T-010`)
  - `game/config/movement.ts` — deleted unused `groundFriction` (`T-010`)
  - Documentation: `TASKS.md`, `DECISIONS.md` (D-017–D-019 added),
    `PROJECT_STATE.md`, `FEATURES.md`, `HANDOFF.md`, `CLAUDE.md`,
    `API_REFERENCE.md`, `DATABASE.md`, `SECURITY.md`, this file,
    `CHANGELOG.md`
- **Commands run:**
  - `npx tsc --noEmit -p tsconfig.json`, `npx tsc -p party/tsconfig.json`,
    `npx eslint . --ext .ts,.tsx`, `rm -rf .next && npm run build`,
    `npx wrangler deploy --dry-run` — run multiple times across the
    session (after the full T-002–T-010 pass, and again after removing
    temporary debug logging), all clean every time.
  - Restarted `npm run party:dev` and `npx next dev -p 3100` several
    times — background dev processes in this sandboxed environment
    proved unreliable to keep alive across tool-call boundaries this
    session (multiple unprompted deaths with no corresponding command
    issued against them); switched to using the harness's background-
    task mechanism instead of shell `nohup`/`disown`, which worked more
    reliably but still wasn't perfectly stable.
  - A scratch Playwright Bot Duel smoke test (menu → tutorial →
    countdown → ~20s of combat, including simulated player movement to
    get the bot into view) — used to verify `T-005`/`T-006`'s bot-AI
    rewiring didn't break or stall bot behavior.
  - A scratch two-client Playwright Online 1v1 test — confirmed core
    connection/ready/match-start flow still works after this session's
    changes; **did not** succeed in triggering a live `buildPlace` from
    the scripted client (see Problems found).
  - A new scratch technique: a raw WebSocket script (`raw-ws-test.mjs`,
    native `WebSocket`, no browser) that speaks the party server's wire
    protocol directly — connect, ready, matchStart, roundStart,
    `buildPlace`, `resetRequest` (both allowed and rejected cases,
    forcing the rejected case by eliminating a player via scripted
    `fire` messages to reach `round-end` phase). Queried `wrangler
    dev`'s local observability API
    (`/cdn-cgi/local/explorer/api/local/observability/query`) to confirm
    a `buildPlace` sent by the scripted browser client never actually
    reached the server (zero matching log rows), diagnosing why the
    browser-based approach wasn't working.
- **Tests run:** No automated tests exist. All verification was the
  scripted/raw-protocol sessions above (none committed to this repo)
  plus the standard static verification suite.
- **Results / decisions made:** See `DECISIONS.md` D-017 (`T-002`, fail
  loudly on unset party host — chose visible error over failing the
  build), D-018 (`T-006`, wire up bot-difficulty fields rather than
  delete them — they map onto real missing behavior), D-019 (`T-010`,
  wire up `turnSmoothing`/`destructionEffectDuration`, delete
  `groundFriction` — no natural call site without a much larger
  movement-model change). `T-003`'s decision (delete
  `components/ui/MatchResults.tsx`'s Reset Arena button rather than sync it) and
  `T-008`'s decision (delete `seq` rather than wire it up — redundant
  with the existing timestamp-based speed check) are recorded directly
  in `TASKS.md`'s per-task Outcome notes rather than as separate
  `DECISIONS.md` entries, being smaller/more mechanical calls.
- **Problems found:** Verifying `T-004`/`T-005b`/`T-007` via a scripted
  browser client didn't work as originally planned — headless Chromium's
  inability to grant Pointer Lock (a known limitation, `DECISIONS.md`
  D-011) means a scripted client's camera `forward` vector never rotates
  away from its initial spawn direction, so computed build-ghost
  positions landed somewhere invalid every time, and `tryPlaceBuild()`
  bailed out client-side before ever sending anything to the server —
  confirmed by querying `wrangler dev`'s local observability log and
  finding zero `buildPlace`-related entries after a full click-to-place
  attempt. Recognized this as a testing-environment limitation, not a
  product bug, and worked around it by writing a raw WebSocket script
  that bypasses the 3D client entirely and speaks the wire protocol
  directly — this successfully verified `T-004` and `T-005b` live.
  `T-007`'s client-side-only UI reaction can't be reached this way
  (it depends on the *client* actually sending an invalid `buildPlace`,
  which the client's own pre-validation prevents in a simple sequential-
  click script) and was left verified by code review + type-check +
  pattern-match with the already-proven `hitMarker` mechanism only —
  documented as a known residual gap rather than claimed as tested.
  Separately, background dev server processes (`next dev`, `wrangler
  dev`) died unprompted multiple times mid-session in this sandboxed
  environment, requiring several restarts; not caused by any command
  issued against them.
- **Work completed:** All of `T-002` through `T-010` implemented and
  verified (to the extent described above); full static verification
  suite clean; documentation system fully updated across all affected
  files.
- **Work remaining:** `BUG-010` (narrow-scope, deliberately deferred);
  the "Low priority"/"Technical debt" items still listed in `TASKS.md`
  (shared WebSocket schema validation is the most substantive); a real
  two-human-browser Online 1v1 session (would give `T-007`'s toast its
  first live repro and independently confirm building/healing sync);
  bot-difficulty-tier A/B comparison (only Normal was exercised live).
- **Recommended next action:** A real two-human-browser Online 1v1
  session — see `PROJECT_STATE.md` → "Recommended next three actions"
  for the full reasoning.

---

### Session: 2026-08-06 (later same day, third pass) — Account-switch checkpoint (this session)

- **Account/agent:** Unknown (checkpoint/audit pass only, delegated to a
  research subagent — no product code touched).
- **Goal:** Final account-switch checkpoint — confirm/refresh the
  existing 17-file documentation system against the actual current repo
  state (not rebuild it), since real time had passed since it was last
  written. Explicitly no new features, no commits/pushes/deploys/resets.
- **Inspected:** `git status`/`git branch`/`git log` (from inside
  `buildstrike-arena/`, which resolves to the parent `~/Projects` repo —
  confirmed once again there is still no dedicated git repo for this
  project, still zero commits anywhere, still nothing staged or tracked
  for it); file mtimes across every `.ts`/`.tsx` source file (none newer
  than the docs' last recorded `06:16` timestamp — confirms no code
  changed since the last audit); `PROJECT_STATE.md`, `TASKS.md`,
  `HANDOFF.md`, `CLAUDE.md` in full; spot-checked the specific code
  claims in `TASKS.md`'s T-002–T-010 outcomes against the actual source
  (`PartyHostUnconfiguredError` in `game/networking/client.ts`, the
  `resetRequest` phase-guard comment in `party/server.ts`, direct
  `BOT_DIFFICULTY[...]` reads in `components/game/BotPlayer.tsx`, the `buildRejected`
  case in `components/game/OnlineDuelScene.tsx`, absence of `HelloMsg` in `game/networking/types.ts`,
  and that `public/` contains only `logo.svg`) — all confirmed present
  and matching the docs exactly; grepped every `.md` file for
  secret-like patterns (api key/secret/password/token/AKIA/sk-/ghp_) and
  manually reviewed every hit — all were legitimate references to the
  documented reconnect-token mechanism or design-system tokens, no real
  secret found; read `.env.local` directly — contains only the
  non-sensitive `localhost:8787` dev value, matching `.env.example`.
- **Files changed:** Only `SESSION_LOG.md` (this entry). No other
  documentation file needed a correction — `PROJECT_STATE.md`,
  `TASKS.md`, `HANDOFF.md`, and `CLAUDE.md` were all found to already
  and consistently state: no git repo of its own, zero commits, nothing
  pushed, nothing deployed, current task is "none in progress, pick from
  TASKS.md's Low priority/Technical debt sections or address BUG-010."
  No product/application code touched.
- **Tests run:** None — no code changed, so no verification suite was
  re-run this pass (the prior session's clean `tsc`×2/`eslint`/`build`/
  `wrangler --dry-run` results stand, since no source file has been
  modified since).
- **Results / decisions made:** Confirmed the documentation set needs no
  substantive update this pass — it was already accurate and internally
  consistent. Decided not to touch `FEATURES.md`/`ARCHITECTURE.md`/
  `DECISIONS.md`/etc. beyond the spot-check already performed, since
  nothing in the code changed since they were last verified.
- **Problems found:** None. No drift between docs and code, no
  undocumented state, no secrets in any doc file.
- **Work completed:** Full checkpoint verification pass (git state,
  task-consistency cross-check across `CLAUDE.md`/`PROJECT_STATE.md`/
  `TASKS.md`/`HANDOFF.md`, code-vs-doc spot-checks, secret scan).
- **Work remaining:** Unchanged from the prior session — see
  `TASKS.md`'s "Low priority"/"Technical debt" sections and the open
  `BUG-010`. A real two-human-browser Online 1v1 session remains the
  single highest-value next action.
- **Recommended next action:** Same as the prior session — a real
  two-human-browser Online 1v1 test, or pick up `TASKS.md`'s remaining
  Low-priority/Technical-debt queue. A first real deployment (Vercel +
  `wrangler deploy`) is reasonable whenever the user explicitly asks for
  it, per `PROJECT_STATE.md`'s "Recommended next three actions" — still
  not done as of this checkpoint.

---

### Session: 2026-08-06 (later same day, third part) — First real deployment (Vercel + Cloudflare)

- **Account/agent:** Claude Code session, direct continuation. User
  explicitly asked to deploy for real (confirmed via an explicit choice
  between "restart local dev server" and "deploy for real" — chose the
  latter), then separately asked to also add an app icon if missing
  before deploying.
- **Goal:** Add a proper app icon (if not already present) and deploy
  both halves of the project for real — Cloudflare Worker (realtime
  backend) and Next.js app (Vercel).
- **Files inspected:** `app/icon.svg` (already a custom, original
  branded design — hexagon outline + orange crosshair reticle, not a
  placeholder), `app/favicon.ico` (confirmed via file size/timestamp to
  be the untouched default `create-next-app` scaffold favicon, never
  replaced), `app/layout.tsx` (no explicit icon metadata — relies on
  Next.js App Router's file-convention auto-detection), `wrangler.jsonc`,
  `package.json`.
- **Files changed:**
  - Deleted `app/favicon.ico` — the stale default scaffold icon was
    inconsistent with the custom `icon.svg` already in place; Next.js
    App Router fully supports an SVG-only icon with no `.ico` fallback,
    and all target browsers (including whatever renders the Vercel
    deploy) support SVG favicons. Rebuilt (`npm run build`) to confirm
    this is safe — succeeded cleanly, `icon.svg` is now the sole app
    icon route.
  - `DEPLOYMENT.md`, `PROJECT_STATE.md`, `CLAUDE.md`, `HANDOFF.md`,
    `README.md` — updated from "nothing is deployed" to the real live
    state (see Results below).
- **Commands run:**
  - `npx vercel whoami` / `npx wrangler whoami` — confirmed both CLIs
    already authenticated (no login flow needed).
  - `npx wrangler deploy` (real, not `--dry-run`) — published the
    realtime backend.
  - `vercel link --yes` — created and linked a new Vercel project
    (`garywangsmes-8349s-projects/buildstrike-arena`); this also
    rewrote `.env.local` with a fresh `VERCEL_OIDC_TOKEN` (Vercel CLI's
    own local-dev convenience token, unrelated to `NEXT_PUBLIC_PARTY_HOST`).
  - `vercel env add NEXT_PUBLIC_PARTY_HOST production` (value piped via
    `echo -n`, non-interactive) — set to the deployed Worker's host.
  - `vercel --prod --yes` (real, not a preview) — built and deployed the
    app; Vercel ran its own `next build` in its build environment
    (succeeded, matching local build results) and aliased the
    deployment to the project's default `*.vercel.app` domain.
  - `curl` against the live URL (confirmed 200, real app HTML — no SSO
    wall gating access, unlike the historical Vercel gotcha noted in
    external memory for *new* Vercel projects; this one didn't need
    disabling).
  - A scratch Playwright script against the **live** URL — screenshotted
    the main menu and "Loading Arena…" screen (confirming the new icon
    renders correctly), then drove into the Online 1v1 tab and created a
    room, confirming the deployed app successfully connects to the
    deployed Worker (the Ready button's label progressed from
    "Connecting…" to "Waiting for opponent to join…", meaning
    `status === "connected"`) — zero console errors throughout.
- **Tests run:** No automated tests exist. The Playwright live-URL check
  above is the only "test" — not committed to this repo.
- **Results:** Both deploy targets are live and confirmed working
  together:
  - App: https://buildstrike-arena.vercel.app
  - Realtime backend: `buildstrike-arena-realtime.chamber-seven.workers.dev`
  - `NEXT_PUBLIC_PARTY_HOST` correctly wires them together in Vercel's
    Production environment.
- **Decisions made:** Deleted `app/favicon.ico` rather than attempting
  to regenerate a matching `.ico` from `icon.svg` — no SVG-to-ICO
  conversion tool was available locally (`rsvg-convert`/`imagemagick`/
  `cairosvg` all absent; macOS `sips` doesn't rasterize SVG), and
  Next.js App Router's SVG-only icon convention is fully sufficient and
  avoids adding new tooling dependencies for a one-off asset fix.
  Deployed via the Vercel/Wrangler CLIs directly from the local
  directory rather than setting up Git-based deploys, since this project
  still has zero git commits and setting up a git repo/pushing wasn't
  asked for — consistent with the standing instruction not to
  init/commit/push without explicit request.
- **Problems found:** None — both deploys succeeded on the first
  attempt, and the live connectivity check passed without needing any
  fixes.
- **Work completed:** First real deployment of both halves of this
  project, verified working together; stale default favicon replaced
  with the project's actual custom icon; all affected documentation
  updated to reflect the live state instead of "nothing is deployed."
- **Work remaining:** A full two-client live-URL Online 1v1 pass
  (create/join/combat/round/match/reconnect, not just a single client's
  connection check) and a live Bot Duel pass against the deployed URL
  specifically haven't been done yet — see `DEPLOYMENT.md`'s
  post-deployment checklist. No git commits were made anywhere in this
  project during this session (not asked for).
- **Recommended next action:** A real two-human-browser Online 1v1
  session against the live URLs — see `PROJECT_STATE.md` →
  "Recommended next three actions."

### Session: 2026-08-07 — Final transfer checkpoint (this session)

- **Account/agent:** Unknown (checkpoint/audit pass, delegated to a
  research subagent).
- **Goal:** A "final transfer checkpoint" pass for account-switch
  handoff — re-verify the 17-file doc set against real current repo
  state, resolve cross-file contradictions, scan for secrets, and
  refresh `HANDOFF.md`'s "Prompt for the next Claude Code account".
  Explicitly not a feature-development session.
- **Context found at session start:** unlike every prior session's
  audit note, this project now **does** have its own dedicated git
  repository (confirmed via `git rev-parse --show-toplevel` resolving to
  `~/Projects/buildstrike-arena` itself, not the parent `~/Projects`
  repo) with a GitHub remote (`origin` -> `github.com/Gariyuuu/
  buildstrike-arena.git`) and real commit history — this had already
  happened by the 2026-08-06 "Lobby Update" session per `CHANGELOG.md`,
  but several docs (`PROJECT_STATE.md`, `DEPLOYMENT.md`, `CLAUDE.md`)
  still echoed the older "no git repo, zero commits" framing from
  earlier in that same day. Two uncommitted changes were present at
  session start (`git status`): a modified `components/game/
  CharacterModel.tsx` and an untracked `shots-live/` debug-screenshot
  folder. While inspecting them (reading the diff, running `tsc`/
  `eslint`/`npm run build`, viewing the screenshots to confirm the
  visual fix), a commit (`27e328e`, "Fix head rendering as
  all-black-and-white with no visible skin tone") landed on `main`
  containing exactly that `components/game/CharacterModel.tsx` change plus a
  `.gitignore` entry for `shots-live/` — apparently from a concurrent
  process/session also working in this same directory, since this
  session made no commit itself. `vercel ls` also showed new production
  deployments landing minutes apart during this session, confirming
  active concurrent iteration on this project in real time.
- **Inspected:** `git status`/`git diff`/`git log`/`git fetch origin`;
  `npx tsc --noEmit`, `npm run lint`, `npm run build` (all clean — 0
  errors, 2 pre-existing `<img>` warnings only); `curl` against both
  live URLs (Vercel app and Cloudflare Worker, both `200`); `vercel
  project inspect buildstrike-arena` (confirmed no Git Repository
  connected — still CLI-only deploys); `git grep` across all tracked
  files for secret-like patterns (api keys, tokens, passwords, AWS/
  private-key markers) — no real secret found, one false-positive
  prose match on the word "secret"; read `.env.local` directly —
  contains only the documented `NEXT_PUBLIC_PARTY_HOST` dev value plus
  an untracked, correctly-gitignored, short-lived Vercel CLI OIDC
  token (not a concern, never committed); read all 17 canonical docs
  for cross-file contradictions.
- **Files changed:** `PROJECT_STATE.md` (rewrote the "Git state"
  section to reflect the real repo/remote/commit state; added a
  "2026-08-07 checkpoint findings" subsection under Audit record;
  corrected the Vercel-deploy-reasoning line), `DEPLOYMENT.md`
  (corrected two "no git repo/commits" lines to explain the *actual*
  reason Vercel deploys are CLI-only — no Git integration configured on
  the Vercel project — independent of git-repo existence),
  `CLAUDE.md` (corrected the contradictory "Production status: Not
  deployed anywhere" paragraph, the tech-stack table's "Hosting
  provider: None configured" row, the "Exact stopping point"/"Current
  blockers" bullets, and the AI-working-instructions git-status step —
  all previously contradicted `CLAUDE.md`'s own later "## Deployment"
  section, which was already correct), `HANDOFF.md` (added a header
  note flagging that the numbered history predates the Lobby Update/git-
  init/deploy/character-fix; corrected the `wrangler.jsonc` migration-
  block risk note now that a real deploy has happened; fully rewrote
  the "Prompt for the next Claude Code account" section with accurate
  current state and instructions to re-verify rather than trust any
  snapshot, given this project's fast pace), `SESSION_LOG.md` (this
  entry). No product/application code was touched by this session
  (the one code change present, `27e328e`, was made and committed by
  something else during the session, not by this checkpoint pass).
- **Tests run:** `npx tsc --noEmit` (exit 0), `npm run lint` (exit 0, 2
  pre-existing warnings), `npm run build` (succeeded). Did not re-run
  `npx wrangler deploy --dry-run` or the Playwright smoke tests this
  pass (no server/party code touched; live-URL `curl` checks were
  considered sufficient live-deploy evidence for a doc-only pass).
- **Problems found:** Stale "no git repo" claims in three docs
  (`PROJECT_STATE.md`, `DEPLOYMENT.md`, `CLAUDE.md`), one internal
  self-contradiction in `CLAUDE.md` (its "Project identity" section said
  "Not deployed anywhere" while its own "## Deployment" section, further
  down the same file, correctly said "Live as of 2026-08-06"), and
  `HANDOFF.md`'s stale `wrangler.jsonc` migration-risk note. No secrets
  found in tracked files or docs.
- **Decisions made:** Left `SESSION_LOG.md`'s historical entries
  (2026-08-05 through the deployment session) untouched rather than
  editing them — they're accurate records of what was true *at the
  time*; the correction belongs in the currently-authoritative docs
  (`PROJECT_STATE.md`/`CLAUDE.md`/`DEPLOYMENT.md`) and in this new
  entry, not retroactively rewritten history. Did not commit
  `shots-live/` (already correctly gitignored, confirmed pre-existing
  convention per other doc references to it). Did not attempt to
  reconcile with whatever concurrent process committed `27e328e` beyond
  verifying its content was sound — no conflict occurred since this
  session made no competing commit.
- **Work completed:** Doc-vs-reality audit and correction across all 17
  canonical files; git/deploy state re-verified directly rather than
  repeated from memory; secret scan; refreshed handoff prompt.
- **Work remaining:** Same substantive gaps as before this pass (a real
  two-human-browser Online 1v1 session is still the top gap; `BUG-010`
  still open) — this was a documentation-only pass and didn't address
  product backlog. The "Lobby Update" era's own session log entry is
  still missing (this doc set jumps from the 2026-08-06 deployment
  session straight to this 2026-08-07 checkpoint, with the intervening
  Lobby Update work only visible via `CHANGELOG.md`, not a matching
  `SESSION_LOG.md` entry) — worth backfilling if anyone wants the full
  narrative, not done here to keep this pass scoped to its stated job.
- **Recommended next action:** Same as the prior session's — a real
  two-human-browser Online 1v1 session against the live URLs. If
  picking up product work, first re-confirm `git log`/`git status`
  fresh, since this repo has shown bursts of concurrent/fast-moving
  activity.

### Session: 2026-08-17 — Doc-accuracy checkpoint (onboard-mode sweep)

- **Account/agent:** Unknown (this session, part of a multi-repo
  documentation-memory sweep; no product-work goal, arrived cold with
  only the prior memory note as a pointer).
- **Goal:** Verify the existing 19-file memory system against current
  repo reality (git state, deploy liveness, dependency changes) and
  correct anything stale — a documentation-only accuracy pass, not
  product development.
- **Files inspected:** `git log`/`git branch -a`/`git status`/`git
  diff --stat` (full history plus branch comparison), `package.json`,
  `next.config.ts`, `.vercel/project.json`, `.env.local` (names only,
  no values read into any doc), `node_modules/thinking-orbs`
  (existence check only), and all of `HANDOFF.md`, `CLAUDE.md`,
  `PROJECT_STATE.md`, `TASKS.md`.
- **Files changed:** `CLAUDE.md`, `PROJECT_STATE.md`, `TASKS.md`,
  `HANDOFF.md` (git-state corrections, re-verified deploy liveness,
  new "2026-08-17" verification notes layered on top of the
  2026-08-06/2026-08-07 history — nothing rewritten wholesale),
  `FEATURES.md` and `ROADMAP.md` (staleness notes refreshed to
  acknowledge the gap has widened further, not rewritten), plus this
  entry. No product/application code was touched.
- **Tests run:** No product-code verification commands were re-run this
  pass (no code changed) — deploy liveness was checked via `curl` only
  (`buildstrike-arena.vercel.app` → 200, the Cloudflare Worker → 200).
- **Problems found:**
  - The checked-out branch was `chore/polish` (local only, no upstream,
    1 commit ahead of `main`, working tree clean) — every prior doc
    checkpoint assumed `main` was checked out and named `27e328e` as
    latest; that commit is now 10 commits behind `main`'s tip
    (`4faae82`), which is itself 1 commit behind the actually-checked-out
    `chore/polish` (`23993ae`).
  - A new dependency (`thinking-orbs@0.3.1`) had been added and actually
    installed (not just declared) since the last doc pass, undocumented
    anywhere in the core five.
  - The known scope-drift gap flagged in `FEATURES.md`/`ROADMAP.md` on
    2026-08-07 (Lobby Update, Battle Royale not documented) had grown by
    10 more commits' worth of shipped feature work (weapon-roster
    expansion, redeem codes, keybind rebinding, theme picker, quests/
    achievements, emotes, accessibility/`fix/motion-a11y`) with still no
    matching `TASKS.md` entries or `FEATURES.md`/`ARCHITECTURE.md`
    updates.
  - No secrets found — `.env.local` contains only the two previously
    documented, non-sensitive names.
- **Decisions made:** Did not attempt a full rewrite of
  `FEATURES.md`/`ARCHITECTURE.md`/`ROADMAP.md`/`TASKS.md` to cover the
  10+ commits of undocumented feature work — that would require tracing
  each feature's actual wiring (UI → store → persistence/network → error
  states) to avoid inventing "complete" claims, which is a substantial
  session's worth of work on its own and out of scope for a
  documentation-accuracy checkpoint. Instead, layered `[Verified
  2026-08-17]` corrections onto the existing text and strengthened the
  existing staleness notes so the gap is impossible to miss. Left
  historical `SESSION_LOG.md` entries untouched (same reasoning as the
  2026-08-07 entry above). Did not switch branches, merge, push, or
  redeploy anything.
- **Work completed:** Git-state and deploy-liveness re-verification;
  correction of stale branch/commit claims across the core five; secret
  scan; scope-drift documentation kept current.
- **Work remaining:** The scope-drift gap itself (Battle Royale, Lobby
  hub, cosmetics, quests, weapons expansion, accessibility work — all
  shipped, none reflected in `FEATURES.md`/`ARCHITECTURE.md`/
  `TASKS.md`) is the single largest documentation gap in this repo and
  would be the natural next step for a future documentation session.
  On the product side: the `chore/polish` branch has one unpushed
  commit — decide whether to merge it to `main` and push, or continue
  building on it. The real two-human-browser Online 1v1 test flagged in
  every prior checkpoint is still outstanding.
- **Recommended next action:** Either (a) do a full feature-documentation
  pass across `FEATURES.md`/`ARCHITECTURE.md`/`TASKS.md` to close the
  scope-drift gap (trace each shipped feature's real wiring before
  calling it complete), or (b) resolve `chore/polish`'s unpushed-branch
  state and continue product work from there — confirm current
  `git branch --show-current`/`git status` fresh before doing either,
  since this repo moves fast.
