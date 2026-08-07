# PROJECT_STATE.md

**This file describes the exact state of the repository at the moment of
the last audit/handoff. Update it after every meaningful task — it should
always let a new session resume from the exact stopping point without
re-deriving anything.**

---

## Audit record

- **Timestamp of latest audit:** 2026-08-07 — a documentation-only
  "final transfer checkpoint" pass (doc-vs-reality cross-check, secret
  scan, git-state correction). No application code was changed this
  pass. See the bottom of this section for what it found.
- **Previous audit:** 2026-08-06 (later same day, second half of the
  session that ran `T-001`) — see below for that session's detail.
- **What happened in the 2026-08-06 session:** Worked through the entire
  remaining `TASKS.md` priority queue, `T-002` through `T-010` — nine
  tasks covering `BUG-001` through `BUG-005` and `BUG-003b`, plus three
  additive/cleanup tasks (build-rejected UI feedback, dead protocol
  fields, dead config fields). See `SESSION_LOG.md`'s latest entry and
  `TASKS.md`/`DECISIONS.md` (D-017 through D-019) for full detail. **This
  was a product-development session — real application code changed.**

### 2026-08-07 checkpoint findings

- Found one already-committed application change (`27e328e`, a
  `CharacterModel.tsx` face/hair visual fix) that had landed since the
  last doc update — verified it passes `tsc`/`eslint`/`build` and looks
  correct in local screenshots (`shots-live/`, gitignored). No doc update
  was needed for it beyond this note since it isn't part of a documented
  feature area with detailed claims.
- Corrected the stale "no git repo / no commits" framing that had been
  echoed in this file, `DEPLOYMENT.md`, and `CLAUDE.md` — a dedicated git
  repo (with a GitHub remote) has existed since 2026-08-06; see `Git
  state` below.
- Re-confirmed both live deploys directly (not just repeating the prior
  claim): `curl` to `https://buildstrike-arena.vercel.app` → `200`;
  `curl` to `https://buildstrike-arena-realtime.chamber-seven.workers.dev`
  → `200` with the expected server banner text. Also observed via
  `vercel ls` that new production deployments were landing minutes apart
  during this audit — this project is under active, ongoing iteration,
  possibly by a concurrent session.
- Secret scan across all tracked files and all 17 docs found no real
  secrets committed. `.env.local` (untracked, correctly gitignored)
  contains a short-lived Vercel CLI OIDC token — not a concern, never
  committed.

## Git state

**Corrected 2026-08-07 — the "no git repo" framing below and elsewhere in
this doc set is stale.** A dedicated git repository was initialized for
this project on 2026-08-06 (see `CHANGELOG.md`'s v0.2.0 entry) and has
since accumulated real commit history, including a GitHub remote.

- **Repository root (per `git rev-parse --show-toplevel`):**
  `/Users/gariyuu/Projects/buildstrike-arena` — its own repo, **not** a
  subfolder of the parent `~/Projects` repo.
- **Remote:** `origin` → `https://github.com/Gariyuuu/buildstrike-arena.git`
  (fetch+push). Branch `main` tracks `origin/main` and was up to date
  with it as of this audit.
- **Current branch:** `main`
- **Latest commit hash (as of this audit):** `27e328e` — "Fix head
  rendering as all-black-and-white with no visible skin tone" (character
  model face/hair visual fix — see `CharacterModel.tsx`).
- **Working tree clean?** Yes, as of this audit — no staged or unstaged
  changes, no untracked tracked-worthy files (`shots-live/` is a
  gitignored local debug-screenshot folder, not source).
- **Note for future sessions:** this repo has been under very active,
  fast iteration — during this same audit, new Vercel production
  deployments were observed landing minutes apart. Re-run `git status`/
  `git log` fresh at the start of any session rather than trusting this
  snapshot for long.

## Active development objective

None currently in progress. `T-001` through `T-010` are all complete.
The remaining queue is the "Low priority"/"Technical debt"/deferred
sections of `TASKS.md` — nothing there is believed to block basic play
or a first real deployment.

## Last completed task

**`T-002` through `T-010`** — the entire remaining `TASKS.md` queue from
the prior session's checkpoint:

1. **`T-002` (`BUG-001`)** — `NEXT_PUBLIC_PARTY_HOST` unset now throws a
   clear `PartyHostUnconfiguredError` in production instead of silently
   falling back to `localhost:8787`; surfaced as a visible message in
   `OnlineLobbyOverlay.tsx`. See D-017.
2. **`T-003` (`BUG-004`)** — Removed the redundant "Reset Arena" button
   from the post-match `MatchResults.tsx` screen (decision: delete, not
   sync — it never did anything meaningful post-match).
3. **`T-004` (`BUG-003`)** — `resetRequest` is now rejected server-side
   unless `this.phase === "combat"`. **Verified live** via a raw
   WebSocket script (see below).
4. **`T-005` (`BUG-002`)** — `BotPlayer.tsx` now reads
   `BOT_DIFFICULTY[difficulty]` directly instead of two hardcoded
   duplicate local functions.
5. **`T-005b` (`BUG-005`)** — Server now reads build health from
   `BUILD_TYPES[msg.kind].health` instead of a hardcoded `150`.
   **Verified live** via the same raw WebSocket script.
6. **`T-006` (`BUG-003b`)** — Wired up previously-unused
   `reactionTime`/`aggression`/`viewDistance` bot config fields into real
   FSM/perception behavior (decision: wire up, not delete — see D-018).
7. **`T-007`** — Added a `buildRejected` UI handler: a new
   `triggerBuildDenied()` store action, a synthesized `buildDenied`
   sound, and a `BuildDeniedToast` HUD component.
8. **`T-008`** — Removed dead protocol fields: `HelloMsg` (never
   constructed/handled) and `StateMsg.seq` (sent, never read; redundant
   with the existing timestamp-based speed check).
9. **`T-009`** — Deleted six unused leftover `public/` assets
   (create-next-app template SVGs + an empty `sounds/` directory).
10. **`T-010`** — Wired up `turnSmoothing`/`destructionEffectDuration`
    into their obvious call sites (both had a hardcoded duplicate
    nearby); deleted `groundFriction` (no natural call site — see D-019
    for why it wasn't wired up instead).

**A genuine testing obstacle worth knowing about:** the straightforward
approach to verifying `T-004`/`T-005b`/`T-007` — a scripted browser
client placing builds online — didn't work, because headless Chromium's
inability to grant Pointer Lock (`DECISIONS.md` D-011) means a scripted
client's camera `forward` vector never rotates from its initial spawn
direction, so build-ghost placement lands somewhere invalid every time
and the client blocks it before ever contacting the server. This was
worked around by writing a small raw-WebSocket script
(`raw-ws-test.mjs`, scratchpad-only, not part of this repo) that speaks
the party server's wire protocol directly, bypassing the 3D client
entirely — confirmed via this: `T-004`'s phase guard (allowed during
combat, correctly rejected during round-end) and `T-005b`'s build health
(`150`, correctly sourced from config). `T-007`'s toast was **not**
independently live-verified — see `TASKS.md` for why and what residual
risk that leaves.

## Current unfinished task

None in progress. See `TASKS.md`'s "Low priority"/"Technical debt"
sections for what's left — a shared WebSocket message schema validator,
and the still-open `BUG-010` (reconnecting during round-end/match-end
doesn't show the winner).

## What currently works (re-verified this session, after all fixes)

- `npx tsc --noEmit -p tsconfig.json` → **exit 0**
- `npx tsc -p party/tsconfig.json` → **exit 0**
- `npx eslint .` → **exit 0**, 2 pre-existing `<img>` warnings only
- `rm -rf .next && npm run build` → **succeeds**
- `npx wrangler deploy --dry-run` → **succeeds** (50.83 KiB / 13.86 KiB
  gzip)
- **Bot Duel, live:** a full Playwright smoke test (menu → tutorial →
  match → ~20s of live combat) completed with **zero console errors**;
  the bot detected, closed in on, and eliminated the test player within
  round 1 (score OPP 1–YOU 0), confirming the `T-005`/`T-006` bot-AI
  rewiring didn't stall or break bot behavior.
- **Online 1v1 core flow, live, two clients:** room create/join,
  ready-up, connection status, and match start were re-confirmed working
  during this session's test runs (score/round sync, zero console errors
  on either client). Combat/round/rematch/reconnect were not re-run this
  session (already verified in the prior `T-001` session and untouched
  by this session's changes) — no reason to expect regression, but not
  re-observed live either.
- **Server-side build/reset logic, verified directly via raw WebSocket**
  (bypassing the 3D client — see above): `resetRequest` phase guard and
  `buildConfirmed` health-from-config both confirmed correct.

## What currently fails / is unverified

- **`T-007`'s `buildRejected` toast has no live repro** — see
  `TASKS.md` T-007's Outcome for the full explanation (client-side
  pre-validation blocks the only easily-scriptable trigger; a genuine
  repro needs either a tight two-client race or a real human clicking
  fast). Verified by code review + type-check + pattern-match with the
  proven `hitMarker` mechanism only.
- **Bot difficulty tier differences** (easy vs. hard actually feeling
  different after `T-006`) were not A/B-tested live — only Normal was
  exercised in this session's Bot Duel smoke test.
- **Building and healing sync in Online 1v1** (via the real 3D client,
  not the raw-WebSocket bypass) remain unexercised — same gap noted in
  the prior `T-001` session, still open.
- **A real (non-scripted) two-human-browser test** has still never been
  done — only Playwright-scripted and raw-WebSocket testing.
- `BUG-010` remains open — see `TASKS.md`. Not believed to block basic
  play.

## Errors currently observed

None. All verification commands re-run after the fixes returned exit 0.

## Blockers

None for continuing local development or further deployment.

## Deployment (new as of 2026-08-06)

**The app is now live:**
- App: https://buildstrike-arena.vercel.app (Vercel, `garywangsmes-8349s-projects/buildstrike-arena`, deployed via `vercel --prod` CLI — `vercel project inspect` shows no Git Repository field, so it's still CLI-deployed, not Git-integration-deployed, even though a git repo/GitHub remote now exists for this project; see `Git state` above)
- Realtime backend: `buildstrike-arena-realtime.chamber-seven.workers.dev` (Cloudflare Worker, deployed via `wrangler deploy`)
- `NEXT_PUBLIC_PARTY_HOST` set in Vercel's Production environment to the Worker host above.
- Also replaced the stale default `app/favicon.ico` (from the original `create-next-app` scaffold) — deleted it so the custom `app/icon.svg` (original branded hexagon/reticle design) is the sole, consistent app icon everywhere, including the browser tab on the live deploy.
- **Verified live:** scripted Playwright check against the live URL — main menu and "Loading Arena…" screen render correctly with the new icon, zero console errors, and creating an Online 1v1 room successfully connects to the deployed Worker (confirmed via the lobby UI reaching "Waiting for opponent to join…", not stuck on "Connecting…").
- **Not yet done:** a full two-client live-URL Online 1v1 pass (create/join/combat/round/match/reconnect) and a live Bot Duel pass against the deployed URL specifically — see `DEPLOYMENT.md`'s post-deployment checklist for exact status.
- See `DEPLOYMENT.md` for full redeploy instructions (one command each for app/Worker going forward, project already linked).

## Assumptions currently in effect

- Online 1v1's combat/round/rematch/reconnect flow (proven working in
  the prior `T-001` session) is assumed to still work — none of this
  session's changes touch that code path, but it wasn't re-run live this
  session.
- Building/healing sync in Online 1v1 via the real client is still
  assumed correct based on shared-code-path reasoning, not direct
  observation (same assumption carried over from `T-001`'s session).
- `T-007`'s buildRejected UI is assumed correct based on code review and
  pattern-matching an already-proven mechanism, not a live repro.

## Temporary decisions in effect

- `reactStrictMode: false` — unchanged, still required, see
  `DECISIONS.md` D-004.
- Dev servers in this sandboxed environment have proven **unreliable to
  keep running across tool-call boundaries** — background `next dev`/
  `wrangler dev` processes died unprompted multiple times this session
  (not from any command issued against them) and had to be restarted
  repeatedly. If picking this up fresh, expect to `curl`/`lsof` before
  trusting a "server is up" assumption, and prefer the harness's
  background-task mechanism over shell `nohup`/`disown` tricks, which
  proved less reliable here.

## Recommended next three actions

1. **A real two-human-browser Online 1v1 session against the live URLs**
   — the single highest-value remaining gap, now doubly so since the app
   is actually deployed. Would independently confirm building/healing
   sync, give `T-007`'s buildRejected toast its first live repro, let
   easy-vs-hard bot difficulty actually be felt, and validate the real
   deployment end-to-end (not just a single scripted client's connection
   check).
2. **Pick up the remaining "Low priority"/"Technical debt" items** in
   `TASKS.md` (shared WebSocket schema validation is the most
   substantive one left) or address `BUG-010` if reconnect-during-
   round-end/match-end turns out to matter in practice.
3. **If sharing the live URL more broadly**, be aware the Worker's
   in-memory Durable Object state (see `DATABASE.md`) means any future
   `wrangler deploy` will drop active rooms — fine for casual testing,
   worth knowing before treating this as a stable multiplayer service.

## Verification required before continuing further feature work

- Re-run the full verification suite (`tsc` ×2, `eslint`, `npm run
  build`, `wrangler deploy --dry-run`) after any further change — all
  five passed cleanly as of this session's end.
- If touching anything in `game/networking/types.ts`,
  `party/server.ts`, `stores/matchStore.ts`, or
  `components/game/OnlineDuelScene.tsx`, re-run a live two-client
  session afterward — static verification alone has never caught a real
  bug in this project so far; only actually running the flows has.
- If scripting a build-placement or aim-dependent test again, don't
  rely on a headless-browser client — either drive a real/headed browser
  or use the raw-WebSocket bypass technique proven this session
  (speaks the wire protocol directly, sidesteps Pointer Lock entirely).
