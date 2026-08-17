@AGENTS.md

# CLAUDE.md — BuildStrike Arena Operating Manual

This is the primary operating manual for any AI agent (or human) working in
this repository. Read this file first, then `PROJECT_STATE.md`, then
`TASKS.md`, before making any change. This file is part of a permanent
in-repo documentation system — see the full index in `HANDOFF.md`.

Every fact below was verified directly against the repository on
**2026-08-06** (see `PROJECT_STATE.md` for the exact audit record), with
git state, deploy liveness, and secret-scanning re-verified on
**2026-08-07** in a doc-only checkpoint pass (no application code
changed that pass). Where a fact could not be verified, it is labeled
`Unknown` or `Inferred`.

**[Verified 2026-08-17]** Git state, deploy liveness, and the "Current
status" section below were re-verified again on this date (another
doc-only pass, no application code changed) and found meaningfully
stale — the repo had moved on considerably since 2026-08-07. See
`PROJECT_STATE.md` → Git state for the corrected snapshot. Short
version: this project is on a local branch `chore/polish` (1 commit
ahead of `main`, not yet pushed), `main` itself gained 10 more commits
since the 2026-08-07 checkpoint (an 8-weapon roster expansion, redeem
codes, keybind rebinding, a theme picker, quests/achievements, an emote
system, a new `thinking-orbs` UI dependency, and a merged
`fix/motion-a11y` branch adding reduced-motion/ARIA support), and both
live deploys (Vercel app + Cloudflare Worker) still answer `200`. The
"Current status"/"Known issues" sections immediately below were **not**
rewritten to cover that new work — they still describe the 2026-08-06/07
snapshot (Bot Duel + Online 1v1 bug-fix pass) — see `FEATURES.md` and
`ROADMAP.md`'s own staleness notes and `git log`/`CHANGELOG.md` for what
has actually shipped since.

## Project identity

- **Name:** BuildStrike Arena
- **One-sentence description:** A browser-based 3D 1v1 "build-and-shoot"
  duel game (Fortnite-1v1-inspired, fully original assets/branding) built
  with Next.js, React Three Fiber, and Rapier physics.
- **Detailed summary:** Two players (one may be an AI bot) spawn on
  opposite ends of a small symmetrical arena and fight to five round wins.
  Combat uses two hitscan weapons (rifle, shotgun), a three-piece building
  system (wall/floor/ramp) for cover, and two healing items (shield potion,
  medkit). There are two modes: **Bot Duel** (fully client-side, works with
  no backend) and **Online 1v1** (peer vs peer over a small
  server-authoritative realtime relay on Cloudflare Workers).
- **Target audience:** Casual browser-game players; no account system, no
  matchmaking, no persistence between sessions.
- **Current development stage:** Feature-complete first pass / **late
  prototype — not yet production-hardened**. All 7 originally-scoped
  phases (movement, combat, building, items/UI, bots, multiplayer, polish)
  have working code and pass typecheck/lint/build. It has **not** been
  through iterative playtesting, has **no automated tests**, and has
  several documented correctness gaps (see `TASKS.md` → Bugs). Treat it as
  "built and smoke-tested once," not "hardened."
- **Production status:** **Live.** Deployed on Vercel
  (https://buildstrike-arena.vercel.app) plus a Cloudflare Worker
  (`buildstrike-arena-realtime.chamber-seven.workers.dev`) since
  2026-08-06 — both re-verified reachable (`curl` → `200`) again as of
  **2026-08-17** (previously also re-verified 2026-08-07). A dedicated
  git repository with a GitHub remote
  (`github.com/Gariyuuu/buildstrike-arena`) also exists as of
  2026-08-06 — see `PROJECT_STATE.md` → Git state for the current exact
  commit/branch state; do not assume the older "no git repo, not
  deployed" framing that may still linger in historical `SESSION_LOG.md`
  entries below this date. **Note:** both deploys are CLI-deployed
  (`vercel --prod` / `wrangler deploy`), not Git-integration-deployed —
  a `200` on the live URL is not proof the deployed build matches the
  current git `HEAD`; re-deploy explicitly if you need that guarantee.
- **Repository type:** Single Next.js app (App Router) with one embedded
  secondary deployable: a Cloudflare Worker at `party/server.ts` for the
  realtime multiplayer backend. Not a monorepo (no workspaces/turborepo),
  but effectively "two deployables, one repo, two tsconfigs."

## Current status

See `PROJECT_STATE.md` for the full, precise snapshot. Summary:

- **Latest completed milestone:** Full game loop working end-to-end in
  **both** modes — Bot Duel (verified in an earlier session) and Online
  1v1 (verified 2026-08-06 with a live two-client test: room create/
  join, ready sync, combat with server-authoritative damage, round
  elimination, a full 5-round match, rematch, disconnect banner, and
  mid-match reconnection all confirmed working end-to-end). Four real
  bugs were found and fixed during that test — see `DECISIONS.md`
  D-013–D-016 and `TASKS.md` `BUG-006`–`BUG-009`.
- **Current active task:** None in progress. `TASKS.md` `T-001` through
  `T-010` are all done — every item from the original documentation
  audit's priority queue has been executed (not just planned) and
  verified. See `DECISIONS.md` D-013 through D-019 and `TASKS.md`'s Bugs
  table (`BUG-001` through `BUG-009` all fixed; only `BUG-010` remains
  open, narrow-scope).
- **Exact stopping point (as of the 2026-08-06 T-010 session):** All 7
  phases implemented, both modes live-verified, and the full known-bug
  backlog from the initial audit worked through; `README.md` written.
  **Since then** (still 2026-08-06): a git repo + GitHub remote was
  initialized, the "Lobby Update" expansion (progression, cosmetics,
  daily rewards, Training Arena — see `CHANGELOG.md` v0.2.0) shipped,
  and both the app (Vercel) and realtime backend (Cloudflare Worker)
  were deployed live for the first time. As of a 2026-08-07 doc
  checkpoint, both remain live and the repo has continued to receive
  commits (a character-model visual fix, `27e328e`) — this is an
  actively-iterated project, not a frozen prototype; check `git log`
  fresh rather than trusting this line for long.
  **[Verified 2026-08-17]** That check was done again: `main` is now at
  `4faae82` (10 commits past `27e328e`, incl. `fix/motion-a11y` merged
  in), both deploys still answer `200`, and the checked-out branch is a
  local, unpushed `chore/polish` (1 commit ahead of `main`, no upstream
  set) at `23993ae` — working tree clean, nothing uncommitted. See
  `PROJECT_STATE.md` → Git state for the full detail.
- **Current blockers:** None for local development or production use.
  `NEXT_PUBLIC_PARTY_HOST` is configured in Vercel's Production
  environment (pointing at the live Worker host) — see `DEPLOYMENT.md`.
  As of `T-002` (2026-08-06) the client also fails loudly with a clear
  message if it's ever unset in a non-localhost environment, instead of
  silently falling back to `localhost:8787`.
- **Highest-priority next task:** A real (non-scripted) two-human-browser
  Online 1v1 session — see `PROJECT_STATE.md` → "Recommended next three
  actions" for why this is now the top gap.

## Technology stack

Versions below are the **exact installed versions** (`npm ls --depth=0`),
not just the semver ranges in `package.json`. Do not assume a newer/older
version is installed without re-checking.

| Layer | Technology | Installed version |
|---|---|---|
| Language | TypeScript | 5.9.3 |
| Framework | Next.js (App Router, Turbopack) | 16.3.0 |
| UI runtime | React / React DOM | 19.2.8 |
| Package manager | npm | 11.16.0 (repo has `package-lock.json`; no yarn/pnpm lockfile present) |
| Runtime (dev machine, verified) | Node.js | v26.3.0 — **not pinned in any config file**; no `.nvmrc`/`engines` field found |
| 3D rendering | three.js | 0.185.1 |
| React 3D binding | @react-three/fiber | 9.7.0 |
| 3D helpers | @react-three/drei | 10.7.8 |
| Physics | @react-three/rapier | 2.2.0 (wraps `@dimforge/rapier3d-compat`, transitive dep) |
| State management | zustand | 5.0.14 |
| Styling | Tailwind CSS | 4.3.3 (CSS-based `@theme`/`@import`, no `tailwind.config.js`) |
| Realtime server framework | partyserver | 0.5.10 (Durable Objects wrapper) |
| Realtime client | partysocket | 1.3.0 |
| ID generation | nanoid | 6.0.1 |
| Cloudflare deploy tool | wrangler | 4.119.0 |
| Cloudflare types | @cloudflare/workers-types | 5.20260804.1 |
| Linter | eslint | 9.39.5, config: `eslint-config-next` 16.3.0 (flat config, `eslint.config.mjs`) |
| Database | **None.** No ORM, no DB client, no schema files anywhere in the repo. |
| Auth provider | **None.** No login/accounts/sessions of any kind. |
| Storage provider | **None.** No file/blob storage. |
| Hosting provider | **Live since 2026-08-06.** Vercel (app, `.vercel/` present, CLI-deployed) + Cloudflare Workers (realtime backend, deployed via `wrangler deploy`). See `DEPLOYMENT.md`. |
| Analytics | **None.** |
| Payments | **None.** |
| Email | **None.** |
| Testing libraries | **None installed.** No Jest/Vitest/Playwright/Cypress in `package.json`. Zero `*.test.*`/`*.spec.*` files exist in the repo. |
| Audio | **No library** — sound is synthesized at runtime with the native Web Audio API in `game/audio/soundManager.ts`. Zero audio files in the repo. |

## Essential commands

All commands run from the repository root (`~/Projects/buildstrike-arena`)
— there is no monorepo/workspace split.

```bash
# Install
npm install

# Next.js app (the game client) — http://localhost:3000
npm run dev            # dev server (Turbopack)
npm run build           # production build (also runs Next's TypeScript check)
npm start                # serve the production build (run `build` first)

# Quality gates (all verified to pass cleanly as of 2026-08-06)
npx eslint .                          # or: npm run lint
npx tsc --noEmit -p tsconfig.json     # app typecheck (no npm script wraps this — use directly)

# Realtime multiplayer backend (Cloudflare Worker) — http://localhost:8787
npm run party:dev         # wrangler dev, local Worker + simulated Durable Object
npm run party:deploy      # wrangler deploy — publishes to a *.workers.dev subdomain (real deploy, costs nothing on free tier but IS a real deploy)
npm run party:typecheck   # tsc -p party/tsconfig.json (party/ is EXCLUDED from the main tsconfig — see Repository structure)

# Dry-run the Worker bundle without deploying (safe, verified working)
npx wrangler deploy --dry-run
```

There is **no** test command, no database migration/seed command, no
type-generation command, and no "reset local data" command — none of
those systems exist in this project.

## Repository structure

```
app/                  Next.js App Router root. app/page.tsx is the ONLY route — a
                       client-side screen switcher over gameStore.screen (menu /
                       instructions / settings / playing). app/layout.tsx holds
                       <html>/<body> + all metadata (SEO/OG/favicon). app/globals.css
                       is the entire design system (Tailwind v4 @theme tokens, .glass-panel/
                       .btn-* utility classes, animation keyframes).
components/game/       React Three Fiber components — everything that renders INSIDE
                       <Canvas>. This is where Rapier RigidBody/useFrame imperative code
                       lives. See ARCHITECTURE.md for the full render tree.
components/ui/         Plain DOM/Tailwind overlay components — everything OUTSIDE
                       <Canvas> (menus, HUD, modals). These read Zustand stores reactively;
                       they do not touch Three.js/Rapier directly.
game/config/            The ONLY place gameplay numbers should be tuned: weapons.ts,
                       movement.ts, builds.ts, healing.ts, bots.ts, match.ts, arena.ts.
                       Imported by BOTH the Next.js client and party/server.ts (server
                       imports via relative paths, not the @/ alias — see note below).
game/physics/           Rapier character-controller wrapper (useCharacterMover.ts),
                       world raycasting (raycast.ts), and the client-side hit-registration
                       registry (damageable.tsx — a React Context, .tsx not .ts on purpose).
game/building/          Grid snapping + placement validation (grid.ts) — a PURE function
                       module with no React/DOM dependency, imported by both the client
                       and party/server.ts for symmetric validation logic.
game/weapons/           Hitscan raycast resolution (hitscan.ts) — pellet spread, closest-hit.
game/bots/fsm.ts        The bot AI: a hand-written finite-state machine class (BotBrain).
                       Pure logic, no rendering. Consumed by components/game/BotPlayer.tsx.
game/networking/        Wire protocol (types.ts, dependency-free — imported by both app and
                       Worker), PartySocket client wrapper (client.ts), the GameAdapter
                       interface (adapter.ts) and its two implementations: localAdapter.ts
                       (bot mode — synchronous local commits) and onlineAdapter.ts (online
                       mode — sends network messages). activeClient.ts is a tiny singleton
                       so DOM-level UI outside the Canvas tree (pause menu, results screen)
                       can reach the live network client for Rematch/Reset/Leave buttons.
game/audio/soundManager.ts   Procedural Web Audio SFX synthesis. No audio files exist.
game/effects/effectsBus.ts   Tiny pub/sub so gameplay code can trigger tracers/impacts/
                       damage numbers without importing the rendering layer directly.
game/state/positionTracker.ts   Plain mutable (non-React) singleton holding the local
                       player's and opponent's/bot's live position, read every frame by
                       bot AI and the online adapter's getOpponentPosition() — deliberately
                       NOT a Zustand store, to avoid re-renders on a 60fps-updated value.
game/shared/side.ts     A single dependency-free type (EntitySide). Exists ONLY so
                       game/building/types.ts doesn't have to import the React-based
                       game/physics/damageable.tsx just to get a type — keeps party/server.ts's
                       import graph free of DOM/React code. Do not "simplify" this away.
hooks/                 Pointer lock, keyboard, and mouse-button input hooks. Ref-based
                       (not React state) so 60fps input reads don't cause re-renders.
stores/                 Zustand stores: gameStore (screen/mode/pause), matchStore
                       (round/score/phase — the FSM for match flow), playerStore (HUD state:
                       health/shield/ammo/inventory), networkStore (connection/room/ready
                       state), buildsStore (list of placed builds, shared by all three
                       render sources: local/bot/network), settingsStore (persisted to
                       localStorage via zustand/middleware persist).
party/server.ts         The entire realtime multiplayer backend: one PartyServer
                       (Durable Object) class, GameRoom, handling room membership,
                       server-authoritative health/score/fire-rate/build-validation. See
                       ARCHITECTURE.md and API_REFERENCE.md.
party/tsconfig.json      SEPARATE tsconfig for the Worker (no DOM lib, includes
                       @cloudflare/workers-types). party/ is excluded from the root
                       tsconfig.json's "include". This is why every file the Worker imports
                       from game/ uses RELATIVE imports, not the @/ alias — @/ is only
                       configured in the root tsconfig and is NOT resolved by wrangler's
                       esbuild bundler. If you add a new game/ file that party/server.ts
                       needs (directly or transitively), it MUST use relative imports.
wrangler.jsonc            Cloudflare Worker deploy config: Durable Object binding
                       "GameRoom", SQLite storage class migration declared (see Known
                       Issues — this storage is declared but never actually used;
                       all room state is in-memory JS fields, not persisted).
public/                 Static assets. Contains ONE real project asset (logo.svg) plus
                       FIVE unused leftover default create-next-app SVGs (file.svg,
                       globe.svg, next.svg, vercel.svg, window.svg) and an EMPTY
                       public/sounds/ directory (scaffolded early, never used — audio is
                       fully procedural). Safe to delete all six; not yet done. See TASKS.md.
README.md                 User-facing setup/deploy/testing docs. Overlaps with this file
                       and DEPLOYMENT.md/TESTING.md by design (README is for a human
                       cloning the repo; the docs here are for an AI agent's working
                       memory) — keep both in sync when either changes.
```

## Architecture summary

See `ARCHITECTURE.md` for full diagrams. Short version:

- **Rendering strategy:** 100% client-side. `app/page.tsx` is a client
  component (`"use client"`); `GameCanvas` is loaded via `next/dynamic`
  with `ssr: false` because React Three Fiber/Rapier cannot run
  server-side. There is no server rendering of any gameplay content —
  Next.js here is essentially a static SPA shell plus asset bundling.
- **Server/client boundary:** Almost the entire app is client-side. The
  only "server" in this project is `party/server.ts`, a *separate*
  Cloudflare Worker deployable — not a Next.js API route, not a Next.js
  Server Action, not Next.js middleware. Next.js has zero server-side
  logic in this project (no `app/api/`, no `middleware.ts`).
- **State management:** Zustand stores (see Repository structure) for
  anything the DOM/UI needs reactively. High-frequency per-frame data
  (positions, input) deliberately bypasses React state via refs and the
  `positionTracker` singleton — mixing these two systems correctly is the
  most important pattern to preserve in this codebase.
- **Game loop:** One `useFrame` callback per active entity
  (`LocalPlayer`, `BotPlayer`, `RemotePlayer`) inside R3F's render loop,
  each independently reading Rapier's kinematic character controller,
  input, and Zustand `getState()` snapshots.
- **Multiplayer architecture:** Client-side hit detection + server-side
  damage/rate/placement authority. Each client raycasts locally against
  its own view of the opponent and *reports a claim*; the Durable Object
  (one per room, keyed by room code) recomputes damage from the shared
  weapon config, enforces fire-rate, and is the single source of truth for
  health/score/build state, which it broadcasts back to both clients. See
  `ARCHITECTURE.md` and `SECURITY.md` for the exact trust boundary.
- **Persistence:** None, anywhere. Settings persist to `localStorage`
  only (`buildstrike-settings` key). Match/room state is in-memory only,
  in both the browser tab and the Durable Object — closing the tab or the
  Worker evicting the Durable Object loses everything.

## Coding conventions

All **Verified** (observed consistently across the codebase, not
aspirational):

- **Files:** One React component per file, PascalCase filename matching
  the exported component (`components/game/LocalPlayer.tsx` exports `LocalPlayer`).
  Non-component modules are camelCase (`game/weapons/hitscan.ts`, `game/effects/effectsBus.ts`).
- **Imports:** `@/*` path alias (maps to repo root) used everywhere
  **except** files reachable from `party/server.ts`, which use relative
  imports (see Repository structure note above — this is load-bearing,
  not a style inconsistency).
- **"use client":** Every file that touches React hooks, Zustand, or
  R3F/DOM APIs has an explicit `"use client"` directive at the top, even
  though the whole app is effectively client-rendered — kept for
  Next.js App Router correctness/clarity.
- **Config-driven tuning:** Gameplay constants live in `game/config/*.ts`
  as `as const` objects, never as magic numbers inline in components —
  **except** the specific violations documented in `TASKS.md`
  (`components/game/BotPlayer.tsx` duplicates two `BOT_DIFFICULTY` values as local hardcoded
  functions instead of reading the config; several `BOT_DIFFICULTY` and
  `MOVEMENT`/`BUILD_CONFIG` fields are defined but never read anywhere —
  see `DECISIONS.md` D-010 and `TASKS.md` bugs `BUG-002`/`BUG-003`).
- **Per-frame imperative code:** Inside `useFrame`, code mutates
  `THREE.Object3D`/`camera`/ref values directly and reads Zustand via
  `store.getState()` (not the reactive hook) to avoid subscribing a
  60fps-changing value to React re-renders. Reactive hook subscriptions
  (`useStore((s) => s.x)`) are reserved for values actually rendered in
  JSX. **This split is intentional and load-bearing — do not "clean up"
  `getState()` calls into hook subscriptions inside `useFrame` bodies.**
- **Networking abstraction:** Gameplay code (`components/game/LocalPlayer.tsx`) never
  branches on `mode === "online"` for game logic beyond a handful of
  documented spots (damage application, heal application) — it calls a
  `GameAdapter` interface (`game/networking/adapter.ts`) implemented once
  per mode (`game/networking/localAdapter.ts` / `game/networking/onlineAdapter.ts`). Preserve this
  abstraction when adding new player actions.
- **Effect cleanup discipline:** `game/physics/useCharacterMover.ts` deliberately does
  **not** clean up its Rapier character controller on unmount — see the
  comment in that file and `DECISIONS.md` D-004 (React Strict Mode +
  Rapier double-invoke corruption bug found and fixed during the build).
- **ESLint overrides are intentional:** `eslint.config.mjs` disables four
  React Compiler hook rules (`purity`/`immutability`/`refs`/
  `set-state-in-effect`) specifically for `components/game/**`,
  `game/**`, `hooks/**` because they misfire on react-three-fiber's
  `useFrame` pattern. Do not re-enable them without understanding why
  they were disabled (see `DECISIONS.md` D-005) — and do not use this as
  a precedent to silence *other* legitimate lint findings.
- **Comments:** Sparse. Used only for non-obvious "why" (e.g., the
  StrictMode/Rapier note above), not restating what code does.
- **No test conventions exist** — there is no test suite to follow a
  pattern from. See `TESTING.md`.

## UI and design system

Full detail in `UI_SYSTEM.md`. Key facts:

- **Theme:** Single fixed dark theme ("dark navy / electric cyan / orange
  accent"). **There is no light mode and no theme toggle** — despite the
  Artifact/design tooling convention of supporting both, this specific
  product deliberately ships one dark theme only (it's a game HUD, not a
  content app). Tokens defined in `app/globals.css` via Tailwind v4
  `@theme inline` (`--color-bs-navy-950`, `--color-bs-cyan`,
  `--color-bs-orange`, etc.) plus hand-written CSS classes
  `.glass-panel`, `.btn-primary`, `.btn-secondary`, `.btn-orange` and
  keyframe animations (`bs-flash-in`, `bs-hitmarker`, `bs-pulse`,
  `bs-pop-in`).
- **No component library** (no shadcn/Radix/MUI). All UI is hand-built
  Tailwind + a handful of shared className strings.
- **Responsive:** Tailwind responsive utilities used in menu layouts; the
  UI explicitly tells the user "keyboard and mouse recommended" (see
  `MainMenu.tsx`) — there is no touch/mobile control scheme.
- **Icons:** None from an icon library — the only graphical asset is
  `public/logo.svg` (also used as the design source for `app/icon.svg`,
  the favicon).

## Environment setup

**Exactly one** environment variable exists in this project.

| Variable | Purpose | Required? | Where used | Client/Server | Format | Safe example | Sensitive? |
|---|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_PARTY_HOST` | Host (no protocol, no path) of the deployed realtime Worker, used by the client to build the `wss://`/`ws://` PartySocket URL for Online 1v1 | Optional — Bot Duel needs nothing; Online 1v1 silently breaks without it in production (see Known Issues) | `game/networking/client.ts` (`getPartyHost()`) | **Client** (`NEXT_PUBLIC_` prefix — bundled into client JS, not secret) | hostname[:port], no scheme, no trailing slash | `localhost:8787` (dev) / `buildstrike-arena-realtime.<subdomain>.workers.dev` (prod) | No — it's a public hostname, not a credential |

`.env.example` exists and is accurate (mirrors the table above). Copy it
to `.env.local` for local dev if you want to test Online 1v1 against a
locally-running `npm run party:dev`. **No secrets exist in this project
at all** — no API keys, no database URL, no auth secret. `wrangler login`
(interactive, one-time, browser OAuth) is the only credential-adjacent
step, and it's stored by Wrangler outside the repo.

## Database summary

**There is no database.** No ORM, no schema file, no migrations, no seed
data, no `DATABASE_URL`-shaped env var, nothing. See `DATABASE.md` for the
full explanation of what *does* hold state (in-memory only) and why.

## Authentication and authorization

**There is no authentication or authorization system.** No login, no
signup, no sessions, no accounts, no roles, no protected routes. The
closest thing to "identity" is:
- A per-tab, per-room `sessionStorage` token (`game/networking/client.ts`)
  used purely so a reconnecting client can be matched back to its
  existing room slot within a 25-second grace window — not an auth
  credential, not verified against anything beyond "does this token match
  what this Durable Object instance already has in memory."
- Server-side "authorization" is limited to: room capacity (max 2
  connections), and per-slot ownership checks for build placement /
  damage targeting. There are no user accounts to authorize *against*.

## API and integrations

**Zero external APIs, SDKs, or third-party service integrations of any
kind.** The only network endpoint in the entire project is the
self-hosted realtime Worker (`party/server.ts`), documented in full in
`API_REFERENCE.md`. No webhooks, no payment provider, no email provider,
no analytics SDK, no CDN-hosted assets.

## Testing and verification

**No automated tests exist.** No test framework is installed. See
`TESTING.md` for the manual smoke-test checklist and what was actually
verified: typecheck, lint, production build, Worker dry-run bundle,
scripted Playwright passes through Bot Duel (including a re-run after
this session's bot-AI rewiring, `T-005`/`T-006`), and a scripted
two-client Playwright pass through Online 1v1 covering room create/join,
ready sync, combat, round/match end, rematch, and disconnect/reconnect
(`T-001`, `DECISIONS.md` D-013–D-016). This session also introduced a
**second testing technique** for anything that needs pointer-lock-driven
aim (which headless Chromium can't provide — D-011): a raw WebSocket
script that speaks the party server's protocol directly, bypassing the
3D client entirely — used to verify `T-004`/`T-005b` live when the
scripted-browser approach didn't work. A real (non-scripted)
two-human-browser session still hasn't been done.

## Deployment

**Live as of 2026-08-06:** app at https://buildstrike-arena.vercel.app
(Vercel, deployed via CLI — no Git integration), realtime backend at
`buildstrike-arena-realtime.chamber-seven.workers.dev` (Cloudflare
Workers), wired together via `NEXT_PUBLIC_PARTY_HOST` in Vercel's
Production environment. Full instructions (verified against actual
config files and this real deploy) are in `DEPLOYMENT.md` and
`README.md`.

## DO NOT CHANGE WITHOUT REVIEW

- **`next.config.ts` (`reactStrictMode: false`)** — required, not
  optional. Re-enabling it reproduces a real, reproduced-and-fixed crash:
  React Strict Mode's dev-only double-invoke of `useMemo` corrupts
  Rapier's `KinematicCharacterController` (`computeColliderMovement`
  throws on undefined internals) because `world.createCharacterController()`
  gets called twice against the same world. See `DECISIONS.md` D-004.
- **`game/physics/useCharacterMover.ts`** — the missing controller
  cleanup-on-unmount is intentional (see comment in the file and D-004),
  not an oversight. Don't "fix" it by adding back a `world.removeCharacterController`
  effect cleanup without re-testing against Strict Mode carefully.
- **`eslint.config.mjs` rule overrides** — the four disabled
  `react-hooks/*` rules are scoped narrowly and intentionally (D-005).
  Don't broaden the scope or re-enable without understanding why they
  misfire on `useFrame` code.
- **`game/networking/types.ts` message shapes** — this file is the wire
  protocol contract between the Next.js client and `party/server.ts`
  (a *separately deployed* Worker). Changing a message shape without
  redeploying the Worker (or vice versa) breaks Online 1v1 silently
  (no version negotiation exists). Treat changes here as a coordinated
  two-deployable change.
- **`party/tsconfig.json` / `party/**` relative-import convention** — see
  Repository structure. Introducing a `@/` alias import anywhere in the
  import graph reachable from `party/server.ts` will typecheck fine under
  the root `tsconfig.json` (if accidentally checked there) but will
  **fail to bundle under wrangler/esbuild**, which does not resolve that
  alias. Always verify with `npm run party:typecheck` AND
  `npx wrangler deploy --dry-run` after touching anything under `game/`
  that the server imports (directly or transitively).
- **`game/config/*.ts` values** — these ARE meant to be tuned (that's
  their purpose), but changing them can silently desync from the
  duplicated hardcoded copies in `components/game/BotPlayer.tsx`
  (`aimAccuracyFor`, `brainSpeedMultiplier`) — see `TASKS.md` `BUG-002`.
  Either fix that duplication first, or update both places together.
- **`wrangler.jsonc` Durable Object binding/migration block** — the
  `durable_objects.bindings` name (`GameRoom`) and the `migrations` array
  are Cloudflare's versioned schema-evolution mechanism for Durable
  Objects. Renaming the class or removing a migration entry after a real
  deploy has happened requires a new migration tag, not an edit to the
  existing one — Cloudflare will reject a mismatched migration history
  once something has actually been deployed. (Nothing has been deployed
  yet in this project, so this is currently low-risk, but will not be
  once `party:deploy` is run for the first time.)
- **Server-authoritative fields in `party/server.ts`** (`health`,
  `shield`, `score`, build `health`) — never trust or accept a
  client-supplied value for these; the entire security model
  (`SECURITY.md`) depends on the server recomputing them from
  `game/config/*` rather than accepting what a client sends.

## Known issues

See `TASKS.md` (Bugs section) for the full, structured list with IDs.
Highlights an agent should know before touching related code:

1. **~~`NEXT_PUBLIC_PARTY_HOST` unset → silent localhost fallback~~ —
   FIXED 2026-08-06 (`BUG-001`, `T-002`).** `getPartyHost()` now throws a
   clear `PartyHostUnconfiguredError` when unset outside `localhost`,
   surfaced as a visible error in `components/ui/OnlineLobbyOverlay.tsx`. See
   `DECISIONS.md` D-017.
2. **~~"Reset Arena" inconsistent between two screens~~ — FIXED
   2026-08-06 (`BUG-004`, `T-003`).** The non-syncing button on
   `components/ui/MatchResults.tsx` was removed entirely (decision: it never did
   anything meaningful post-match). `components/ui/PauseMenu.tsx`'s version (the one
   that matters, mid-match) is unchanged.
3. **~~Server doesn't phase-guard `resetRequest`~~ — FIXED 2026-08-06
   (`BUG-003`, `T-004`).** `resetRequest` is now rejected unless
   `this.phase === "combat"` — verified live via a raw WebSocket script.
4. **~~Duplicated bot-difficulty values~~ — FIXED 2026-08-06 (`BUG-002`,
   `T-005`).** `components/game/BotPlayer.tsx` now reads `BOT_DIFFICULTY[difficulty]`
   directly; the two hardcoded local functions are deleted.
5. **~~Dead/unused `BOT_DIFFICULTY` fields~~ — FIXED 2026-08-06
   (`BUG-003b`, `T-006`).** `reactionTime`/`aggression`/`viewDistance`
   are now wired into real FSM/perception behavior — see `DECISIONS.md`
   D-018. `MOVEMENT.turnSmoothing`/`BUILD_CONFIG.destructionEffectDuration`
   were also wired up (`T-010`, D-019); `MOVEMENT.groundFriction` was
   deleted (no natural call site — see D-019 for why).
6. **~~Dead protocol fields~~ — FIXED 2026-08-06 (`T-008`).**
   `HelloMsg` and `StateMsg.seq` (and `components/game/LocalPlayer.tsx`'s unused
   `stateSeq` ref) have been removed from the wire protocol entirely.
7. **~~Unused leftover assets~~ — FIXED 2026-08-06 (`T-009`).** The six
   unreferenced `public/` files/directory are deleted.
8. **~~Server hardcodes build health~~ — FIXED 2026-08-06 (`BUG-005`,
   `T-005b`).** `handleBuildPlace()` now reads
   `BUILD_TYPES[msg.kind].health` — verified live via a raw WebSocket
   script (`buildConfirmed` correctly returned `health: 150`).
9. **~~Online 1v1 has never been tested with two live clients~~ — FIXED
   2026-08-06.** It has now been live-tested end-to-end (`TASKS.md`
   `T-001`) and works. This surfaced and fixed four real bugs
   (`BUG-006`–`BUG-009`, see `DECISIONS.md` D-013–D-016) — kept here as
   a reminder that clean typecheck/lint/build is **not** sufficient
   evidence a networked feature works; none of the four were caught by
   static verification, only by actually running it.
10. **Reconnecting during round-end/match-end shows no winner**
    (`BUG-010`, found alongside the T-001 fixes, deliberately not
    fixed) — the `matchResume` message (see D-015) doesn't carry a
    round/match winner, so a client that reconnects in that brief
    window resumes without the winner banner. Narrow timing window, low
    severity. **Still open.**
11. **Camera/aim yaw convention is easy to get backwards** — see
    `DECISIONS.md` D-013 (`BUG-006`): at pitch 0, yaw `0` faces **-Z**
    and yaw `π` faces **+Z** (`forward = (-sin(yaw), 0, -cos(yaw))`,
    from `components/game/LocalPlayer.tsx`'s aim quaternion). This bit
    the project once already (backwards `PLAYER_SPAWNS`) — double-check
    this convention explicitly if you ever add a new spawn point, a new
    facing-dependent spawn rule, or otherwise compute a yaw from a
    desired world-space direction.
12. **Scripting build-placement or other aim-dependent actions in
    headless Chromium doesn't work reliably** (confirms/extends D-011):
    since Pointer Lock never engages, a scripted client's camera
    `forward` vector never rotates from its initial spawn direction, so
    computed build-ghost positions can land somewhere invalid every
    time, and the client blocks the placement before ever contacting the
    server. Found while trying to verify `T-005b`/`T-007` live. Workaround
    proven this session: bypass the 3D client and speak the party
    server's WebSocket protocol directly with a small raw script (see
    `PROJECT_STATE.md` and the scratch `raw-ws-test.mjs` technique) —
    works for anything server-side, but can't exercise client-side-only
    logic (like `T-007`'s UI toast).

## AI working instructions

1. Read `CLAUDE.md` (this file).
2. Read `PROJECT_STATE.md`.
3. Read `TASKS.md`.
4. Read whichever of `ARCHITECTURE.md` / `FEATURES.md` / `API_REFERENCE.md`
   / `DATABASE.md` / `SECURITY.md` is relevant to the area you're about
   to touch.
5. Inspect the affected code before changing it — do not assume this
   document is still accurate months later; verify.
6. Check `git status` before modifying files. A dedicated git repository
   (with a GitHub remote) exists for this project as of 2026-08-06 — but
   this repo has shown very active, fast-moving commit/deploy activity
   (see `PROJECT_STATE.md` → Git state), so re-confirm current branch/
   commit/clean-tree state fresh each session rather than trusting any
   snapshot in these docs for long.
7. Avoid overwriting unrelated work.
8. Make small, reviewable changes.
9. Run relevant verification after changes: `npx tsc --noEmit -p
   tsconfig.json`, `npx eslint .`, `npm run build`, and — if you touched
   anything under `game/` that `party/server.ts` imports —
   `npm run party:typecheck` and `npx wrangler deploy --dry-run`.
10. Update documentation after meaningful changes (see the permanent
    rules below).
11. Never claim something works without verification — this project's
    prior audit found real, previously-unverified gaps (see Known
    issues); don't repeat that pattern.
12. Never expose secrets. (None exist today — keep it that way; don't
    hardcode a future API key/token directly in source.)
13. Never modify production data without explicit permission. (N/A today
    — no production deployment exists — but this rule applies the moment
    one does.)
14. Never perform destructive database operations without explicit
    permission. (N/A — no database — keep this rule active for whenever
    one is added.)
15. Never silently replace an existing architectural pattern (the
    `GameAdapter` abstraction, the ref-vs-Zustand split, the
    server-authoritative trust boundary) with a new one without recording
    the decision in `DECISIONS.md`.
16. Never remove a dependency without checking all usages
    (`grep -rn "from \"<pkg>\"" --include=*.ts --include=*.tsx`).
17. Never change the wire protocol (`game/networking/types.ts`), the
    Durable Object binding/migrations (`wrangler.jsonc`), deployment
    config, or the (currently nonexistent) security model casually — see
    "DO NOT CHANGE WITHOUT REVIEW" above.
18. Record unresolved uncertainty rather than guessing — use the
    `Unknown` / `Needs confirmation` labels this documentation system
    established.

### Permanent rules: before every task

1. Read `CLAUDE.md`.
2. Read `PROJECT_STATE.md`.
3. Read `TASKS.md`.
4. Read the relevant technical documentation file(s).
5. Inspect `git status`.
6. Inspect the files you're about to change.
7. Confirm the requested work isn't already done (check `TASKS.md` →
   Recently completed, and `FEATURES.md` status).
8. Preserve unrelated work.
9. Identify risks before modifying anything listed under "DO NOT CHANGE
   WITHOUT REVIEW."

### Permanent rules: after every meaningful task

1. Update `PROJECT_STATE.md` with the new exact stopping point.
2. Update `TASKS.md` (move items between sections, add new ones found).
3. Append an entry to `SESSION_LOG.md` (do not overwrite prior entries).
4. Update whichever of `FEATURES.md` / `ARCHITECTURE.md` /
   `API_REFERENCE.md` / `DATABASE.md` / `TESTING.md` / `DEPLOYMENT.md` /
   `SECURITY.md` is affected.
5. Remove or correct stale information you find, even if unrelated to
   your task — leave a note in `CHANGELOG.md`.
6. Record meaningful architectural decisions in `DECISIONS.md`.
7. Run the relevant verification commands (see item 9 above) and report
   actual results, not assumptions.
8. Clearly record anything not verified.
9. Keep this repository — not chat history — as the permanent source of
   project memory.
