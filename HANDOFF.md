# HANDOFF.md

Short, high-signal onboarding for a new Claude account (or any new
contributor) picking up this project cold, with zero access to prior
chat history. Everything here is backed by the other documentation
files, verified against the repository on 2026-08-06 (most recently
after a session that actually ran and fixed real bugs in Online 1v1 —
see `SESSION_LOG.md`'s latest entry), with a 2026-08-07 doc-only
checkpoint pass on top (git state, deploy liveness, secret scan — see
`PROJECT_STATE.md`'s "2026-08-07 checkpoint findings"). **Note:** the
numbered "What was the previous agent doing" history below stops at the
2026-08-06 `T-010` session and predates the "Lobby Update" (v0.2.0)
expansion — progression/cosmetics/daily-rewards/Training-Arena, a git
repo + GitHub remote, the first live deploy, and at least one further
commit since (a character-model visual fix). See `CHANGELOG.md` and
`SESSION_LOG.md` for that later history; this section wasn't rewritten
to keep the checkpoint pass scoped, but don't assume it's the full
story.

## Is this deployed anywhere?

**Yes, as of 2026-08-06.** App: https://buildstrike-arena.vercel.app.
Realtime backend: `buildstrike-arena-realtime.chamber-seven.workers.dev`.
See `DEPLOYMENT.md` for the full setup and one-command redeploy
instructions for each (project already linked/authenticated).

## What is this project?

**BuildStrike Arena** — a browser-based 3D 1v1 "build-and-shoot" duel
game (Next.js + React Three Fiber + Rapier physics), inspired by
Fortnite's 1v1 creative mode but with fully original branding, models
(procedural geometry), and sounds (synthesized, zero audio files). Two
modes: **Bot Duel** (offline, fight an AI) and **Online 1v1** (peer
match over a small server-authoritative realtime backend on Cloudflare
Workers). First to 5 round wins takes the match.

## What should I read first?

In this order:

1. **`CLAUDE.md`** — the operating manual. Read this fully before
   touching any code.
2. **`PROJECT_STATE.md`** — the exact current stopping point.
3. **`TASKS.md`** — what to work on next, in priority order.
4. Whichever of `ARCHITECTURE.md` / `FEATURES.md` / `API_REFERENCE.md` /
   `DATABASE.md` / `SECURITY.md` / `UI_SYSTEM.md` / `DECISIONS.md` is
   relevant to the specific area you're about to touch.
5. `README.md` — the human-facing setup/deploy doc (overlaps
   `DEPLOYMENT.md`/`TESTING.md` by design; keep both in sync if either
   changes).

## What is the current task?

**None in progress.** `TASKS.md` `T-001` through `T-010` are all
complete — the entire priority-ordered queue from the original
documentation audit has been worked through. What's left is
`TASKS.md`'s "Low priority"/"Technical debt" sections (a shared
WebSocket schema validator is the most substantive remaining item) and
the still-open `BUG-010` (narrow-scope). None of the remaining open
items are believed to block basic play.

## What was the previous agent doing?

Five sessions of history exist (see `SESSION_LOG.md` for full detail):

1. **2026-08-05→06 overnight:** Built the entire game from scratch
   across 7 phases, verified via typecheck/lint/build/Worker-bundle and
   one live browser smoke test of Bot Duel. Found and fixed a real
   crash (React Strict Mode + Rapier interaction — see `DECISIONS.md`
   D-004). Left Online 1v1 untested with real clients and made no git
   commit.
2. **2026-08-06 09:46 UTC (documentation pass):** Audited the whole
   repository and created this documentation system. No product code
   changed.
3. **2026-08-06 10:21 UTC (account-switch checkpoint):** Re-verified
   static checks still pass; recovered two pieces of context that had
   only ever existed in conversation history — see `DECISIONS.md` D-011
   (pointer-lock fix rationale) and D-012 (three deliberate
   interpretations of ambiguous points in the original product brief).
   No product code changed.
4. **2026-08-06 (later same day):** Actually executed `T-001` — a live
   two-client Online 1v1 test. Found and fixed four real bugs:
   `BUG-006` (both players spawned facing *away* from each other — the
   root cause of the whole test initially appearing broken), `BUG-007`
   (stale score display after rematch), `BUG-008` (a client reconnecting
   mid-match got permanently stuck on the pre-match lobby, unable to
   rejoin — the most serious of the four), and `BUG-009` (the BUG-007
   fix itself was too broad and reset score after every round, not just
   on rematch — caught and fixed in the same session). Also confirmed
   `DECISIONS.md` D-011's pointer-lock finding as a real, reproducible
   headless-browser limitation rather than a one-off. See `DECISIONS.md`
   D-013 through D-016 for the full technical detail on each fix.
5. **2026-08-06 (later same day, second half of session):** Worked
   through the entire remaining `TASKS.md` queue, `T-002` through
   `T-010` — fixed `BUG-001` (production env-var fail-fast, D-017),
   `BUG-004` (removed the redundant post-match Reset Arena button),
   `BUG-003` (server phase guard on `resetRequest`, verified live via a
   raw WebSocket script that bypasses the 3D client), `BUG-002`
   (de-duplicated bot-difficulty values), `BUG-005` (server build health
   now reads from config), `BUG-003b` (wired up `reactionTime`/
   `aggression`/`viewDistance` into real bot behavior, D-018), added a
   `buildRejected` UI toast, and cleaned up dead protocol fields/leftover
   assets/dead config fields (`T-008`/`T-009`/`T-010`, D-019). Live Bot
   Duel smoke test confirmed the bot-AI rewiring works (bot won round 1
   cleanly, zero console errors). See `DECISIONS.md` D-017 through D-019.

## What works right now?

- **Online 1v1, live, two clients:** room create/join by code, ready-up
  sync, synced match start, synced combat with server-authoritative
  damage, round elimination with correct winner/score, a full 5-round
  match with score correctly accumulating, match-end, rematch with
  correctly-reset score, opponent-disconnected banner, and mid-match
  reconnection (resuming directly into the ongoing match) — **all
  confirmed working end-to-end** this session. Building and healing
  sync specifically were not separately exercised (same proven pattern,
  just not watched directly — see `PROJECT_STATE.md`).
- Bot Duel mode: movement, camera, combat (rifle/shotgun), building
  (wall/floor/ramp), healing, bot AI (3 difficulty tiers), match flow
  (countdown/rounds/scoring/results) — verified working in a live
  browser session with zero console errors (earlier session; not
  re-run after this session's spawn-facing fix, though that fix should
  only help).
- Settings (persisted to localStorage), audio (procedural), visual
  effects (pooled tracers/impacts/damage numbers) — verified via code
  review + partial live confirmation.
- All static verification passes cleanly: `npx tsc --noEmit -p
  tsconfig.json`, `npx tsc -p party/tsconfig.json`, `npx eslint .`,
  `npm run build`, `npx wrangler deploy --dry-run`.

## What is broken?

Nothing is confirmed *broken* in the sense of "doesn't run." `BUG-001`
through `BUG-005` and `BUG-003b` were all fixed this session — see
`TASKS.md`'s Bugs table. Only one item remains open:

- `BUG-010` (found in the `T-001` session, deliberately not fixed): a
  client reconnecting during the brief round-end/match-end window
  resumes without the winner shown (the `matchResume` message doesn't
  carry one — narrow timing window, low severity).

Two things are fixed but **not independently live-repro'd** (verified by
code review + type-check + a raw-WebSocket protocol test instead — see
`PROJECT_STATE.md` for why the obvious scripted-browser approach didn't
work): `T-007`'s buildRejected UI toast, and `T-002`'s production
env-var fail-fast (no real non-localhost deploy exists to test against).

## What should I do next?

`TASKS.md` `T-001` through `T-010` are all done. Pick from the remaining
"Low priority"/"Technical debt" sections, or address `BUG-010`. A real
(non-scripted) two-human-browser Online 1v1 session is the single
highest-value thing left — it would give `T-007`'s toast its first live
repro, confirm building/healing sync, and let bot-difficulty tiers
actually be felt — see `PROJECT_STATE.md` → "Recommended next three
actions."

## Which files are most important?

- `components/game/LocalPlayer.tsx` — the largest, most central file
  (input/movement/camera/combat/building/healing/network-sync).
- `party/server.ts` — the entire multiplayer backend.
- `game/networking/types.ts` — the wire protocol contract between them.
- `game/config/*.ts` — where to tune any gameplay number.
- Full map in `FILE_MAP.md`.

## Which areas are dangerous to modify?

See `CLAUDE.md`'s "DO NOT CHANGE WITHOUT REVIEW" section in full. Short
version: `next.config.ts`'s `reactStrictMode: false`,
`game/physics/useCharacterMover.ts`'s missing cleanup, the
`eslint.config.mjs` rule overrides, the wire protocol shapes, the
`party/` relative-import convention, and `wrangler.jsonc`'s Durable
Object migration block — **a real `wrangler deploy` has now happened**
(live since 2026-08-06), so per `CLAUDE.md`'s own note, renaming the
`GameRoom` class or removing a migration entry now requires a new
migration tag, not an edit to the existing one; this is no longer a
low-risk hypothetical.

## Which commands should I run first?

```bash
npm install
npx tsc --noEmit -p tsconfig.json    # confirm clean before you start
npx eslint .
npm run dev                            # http://localhost:3000 — Bot Duel needs nothing else
```

**Note:** if port 3000 is already in use by something else (check with
`lsof -i:3000` first — a prior session hit this when its own dev server
died mid-session and an unrelated project's dev server later claimed the
now-free port), just run Next.js on another port instead:
`npx next dev -p 3100` (or any free port) — nothing else in this project
is hardcoded to port 3000. Never kill another project's process without
confirming it's actually safe to do so.

For Online 1v1 work, also in a second terminal:

```bash
cp .env.example .env.local   # if not already present
npm run party:dev              # http://localhost:8787
```

## How do I verify the app still works?

```bash
npx tsc --noEmit -p tsconfig.json && \
npx tsc -p party/tsconfig.json && \
npx eslint . && \
npm run build && \
npx wrangler deploy --dry-run
```

All five should succeed (exit 0 / no errors — 2 pre-existing `<img>`
ESLint *warnings* are expected and fine). Then walk the relevant section
of `TESTING.md`'s manual smoke-test checklist for whatever you changed.

---

## Prompt for the next Claude Code account

Copy-paste this verbatim to start a new session on this project:

```
Read CLAUDE.md, PROJECT_STATE.md, TASKS.md, and HANDOFF.md in this
repository in full before doing anything else. This is BuildStrike
Arena, a browser-based 3D 1v1 build-and-shoot game (Next.js + React
Three Fiber + Rapier), with a separate Cloudflare Worker backend for
online multiplayer.

Ground truth as of the 2026-08-07 doc checkpoint (verify it's still
true — this repo moves fast):
- It IS a real git repo now, with its own commit history and a GitHub
  remote (`origin` -> github.com/Gariyuuu/buildstrike-arena.git, branch
  `main`). This project used to have zero commits — that's no longer
  true; don't trust any older doc text that still says otherwise.
- Both halves are live: the app on Vercel
  (https://buildstrike-arena.vercel.app, CLI-deployed, no Git
  integration) and the realtime backend on Cloudflare Workers
  (buildstrike-arena-realtime.chamber-seven.workers.dev). Both answered
  HTTP 200 as of this checkpoint.
- This project has shown bursts of very active iteration (new commits
  and new Vercel production deployments landing minutes apart during
  the 2026-08-07 checkpoint) — possibly from a concurrent session. Treat
  any "current state" snapshot in these docs, including this one, as
  provisional until you re-check `git log`/`git status`/`vercel ls`
  yourself.

After reading those files:
1. Run `git status`, `git log --oneline -10`, and `git fetch origin` to
   get the true current commit/branch state — do not assume it matches
   what PROJECT_STATE.md says without checking, given the note above.
2. Re-run the verification commands listed in HANDOFF.md
   (`tsc` x2, `eslint`, `npm run build`, `wrangler deploy --dry-run`)
   and confirm they still pass, to check the documentation is still
   accurate.
3. Read whichever of ARCHITECTURE.md / FEATURES.md / API_REFERENCE.md /
   DATABASE.md / SECURITY.md / UI_SYSTEM.md / DECISIONS.md is relevant
   to what you're about to do.
4. Summarize your understanding of the current state back to me in a
   few sentences before making any changes, and flag anything in the
   documentation that looks stale or contradicts what you find in the
   actual code or git history.
5. Continue from TASKS.md's remaining "Low priority"/"Technical debt"
   sections, or whatever the user asks for next — do not redo work
   already marked complete there or in FEATURES.md/CHANGELOG.md.
6. Preserve the existing architecture (the GameAdapter abstraction, the
   ref-vs-Zustand split, the server-authoritative trust boundary, the
   config-driven tuning pattern) unless you find a strong, specific
   reason to change it — and if you do change something architectural,
   record it in DECISIONS.md.
7. After completing any meaningful work: commit it (small, reviewable
   commits, real message — this project does have git now), update
   PROJECT_STATE.md, TASKS.md, CHANGELOG.md, and append to
   SESSION_LOG.md (append — never overwrite prior entries), plus
   whichever other documentation file(s) your change affects. If you
   redeploy (`vercel --prod` and/or `wrangler deploy`), record that in
   DEPLOYMENT.md/PROJECT_STATE.md too.
```
