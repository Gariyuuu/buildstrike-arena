# BuildStrike Arena

**Live: https://buildstrike-arena.vercel.app**

A fast, browser-based **1v1 build-and-shoot** duel game. Fight a bot or a
friend in a small original arena — shoot, throw up cover, heal, and win
five rounds first. Built with Next.js, React Three Fiber, and Rapier
physics. No download, no account, no copyrighted assets: every model is
procedural geometry and every sound is synthesized in the browser.

- **Bot Duel** works completely offline / with no backend.
- **Online 1v1** needs one small realtime backend (a Cloudflare Worker —
  see [Multiplayer backend setup](#multiplayer-backend-setup)).
- A **Battle Royale** mode (three maps) and a no-stakes **Training
  Arena** have also shipped since this README section was last written
  (see `CHANGELOG.md` v0.2.0) — not yet described in detail below;
  flagged 2026-08-07, not filled in as part of that pass.

## Table of contents

- [Tech stack](#tech-stack)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Multiplayer backend setup](#multiplayer-backend-setup)
- [Deploying the web app (Vercel)](#deploying-the-web-app-vercel)
- [Alternative deployment (persistent server)](#alternative-deployment-persistent-server)
- [Project structure](#project-structure)
- [Controls](#controls)
- [Third-party assets & licenses](#third-party-assets--licenses)
- [Testing checklist](#testing-checklist)
- [Known limitations](#known-limitations)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| 3D rendering | React Three Fiber + Three.js + @react-three/drei |
| Physics | Rapier (`@react-three/rapier`) — kinematic character controller for movement, fixed colliders for the arena and builds |
| State | Zustand (settings, game/match/player/network/builds stores) |
| Realtime multiplayer | PartyServer (Durable Objects) on Cloudflare Workers, client via `partysocket` |
| Audio | Procedurally synthesized with the Web Audio API — zero audio files |
| Styling | Tailwind CSS v4 |

## Local setup

Requirements: Node.js 20+, npm.

```bash
npm install
cp .env.example .env.local   # only needed for Online 1v1, see below
npm run dev
```

Open http://localhost:3000. **Play vs Bot works immediately with no
further setup** — it never talks to a server.

To also test **Online 1v1** locally, run the realtime backend in a second
terminal (see next section) before opening two browser tabs/windows.

## Environment variables

Only one variable, and only used by the client to find the realtime
server for Online 1v1:

```bash
# .env.local
NEXT_PUBLIC_PARTY_HOST=localhost:8787
```

See `.env.example`. Bot Duel ignores this entirely.

## Multiplayer backend setup

**Why a separate backend at all?** Online 1v1 needs a persistent
WebSocket connection to relay positions/shots/builds and to referee the
match (health, fire-rate, build placement, room membership). Standard
Vercel serverless functions are request/response and don't hold a
WebSocket connection open, so this project ships a small, free-tier-
friendly realtime server built with [PartyServer](https://github.com/threepointone/partyserver)
on **Cloudflare Workers + Durable Objects** instead — one Durable Object
instance per room, addressed by the room code.

The server source lives at `party/server.ts`, config at `wrangler.jsonc`.

### Run it locally

```bash
npm run party:dev
# Wrangler dev server listening on http://localhost:8787
```

Leave that running alongside `npm run dev` (port 3000). With the default
`.env.local` (`NEXT_PUBLIC_PARTY_HOST=localhost:8787`), the Next.js app
will connect to it automatically.

### Deploy it (free tier)

1. `npx wrangler login` (one-time, opens a browser to authorize).
2. `npm run party:deploy`

This deploys to a `*.workers.dev` subdomain — Wrangler prints the URL,
e.g. `buildstrike-arena-realtime.<your-subdomain>.workers.dev`. Cloudflare's
free plan covers Workers + Durable Objects for this use case (low request
volume, small per-room state).

3. Set `NEXT_PUBLIC_PARTY_HOST` in your Vercel project (or `.env.local`
   for local prod testing) to that host, **without** a protocol or
   trailing slash, e.g.:

   ```
   NEXT_PUBLIC_PARTY_HOST=buildstrike-arena-realtime.your-subdomain.workers.dev
   ```

The client automatically uses `wss://` in production and `ws://` for a
`localhost` host.

### Room model

- Creating a room generates a short 5-character code client-side; joining
  connects to `wss://<party-host>/parties/game-room/<CODE>`.
- The Durable Object is the room: first connection becomes side `a`,
  second becomes side `b`, a third is rejected (room full).
- The server is authoritative for health/shield, round/score state, fire
  rate, and build placement validation — it never trusts a client-sent
  damage number. See [Networking and security](#known-limitations) notes
  below for the exact trust boundary.
- A disconnected player's slot is held for ~25s to allow reconnection
  (e.g. an accidental tab reload) before the slot is freed.

## Deploying the web app (Vercel)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import it in Vercel — framework preset "Next.js" is auto-detected, no
   config needed.
3. Add the `NEXT_PUBLIC_PARTY_HOST` environment variable (see above) if
   you want Online 1v1 to work in production. Skip it and Bot Duel still
   works fine; Online 1v1 will just fail to connect.
4. Deploy.

Bot Duel needs nothing beyond the static/serverless Next.js deployment
itself — it's fully client-side.

## Alternative deployment (persistent server)

If you'd rather not use Cloudflare Workers for the realtime piece, any
host that can keep a WebSocket process alive works, since `party/server.ts`
is a small, mostly self-contained TypeScript module. Two straightforward
options:

- **Any Node host that supports WebSockets** (Fly.io, Render, Railway,
  a VPS): swap `partyserver`'s Cloudflare `Server` base class for a plain
  `ws` WebSocket server, re-implementing the small amount of room/session
  bookkeeping (`onConnect`/`onMessage`/`onClose`) — the message protocol
  in `game/networking/types.ts` and the game-logic helpers it calls
  (`game/config/*`, `game/building/grid.ts`) are framework-agnostic and
  can be reused as-is.
- **PartyKit's own hosted platform** — an alternative to raw Wrangler
  deploys if you'd rather not manage a `wrangler.jsonc` yourself.

Whichever backend you choose, only `NEXT_PUBLIC_PARTY_HOST` (plus,
if you switch protocols/libraries, the client in
`game/networking/client.ts`) needs to change — the game logic, UI, and
Bot Duel mode are unaffected.

## Project structure

```
app/                      Next.js routes, layout, metadata, global styles
components/game/          R3F scene components (Arena, players, bots, HUD-adjacent 3D)
components/ui/            DOM overlay UI (menus, HUD, settings, modals)
game/config/               Central tuning: weapons, movement, builds, healing, bots, match rules
game/physics/              Rapier character controller + raycasting + hit registry
game/building/             Grid snapping & placement validation (shared by client + server)
game/weapons/               Hitscan resolution
game/bots/                  Bot finite-state-machine (fsm.ts)
game/networking/            Client/server message protocol, PartySocket client, adapters
game/audio/                 Procedural Web Audio sound manager
game/effects/                Pooled visual effects bus (tracers, impacts, damage numbers)
hooks/                     Pointer lock, keyboard, mouse input hooks
stores/                    Zustand stores (settings, game, match, player, network, builds)
party/server.ts             PartyServer/Durable Object room (Cloudflare Worker)
wrangler.jsonc              Worker deployment config
```

## Controls

Shown in-app before your first match (Instructions screen), also
available any time from the main menu:

| Key | Action |
|---|---|
| WASD | Move |
| Mouse | Look |
| Left Click | Shoot / place build / use selected item |
| Right Click | Aim (zoom + tighter spread) |
| Space | Jump |
| Shift | Sprint |
| R | Reload |
| Q | Enter/exit build mode |
| 1 / 2 / 3 | Rifle / Shotgun / Shield Potion |
| Scroll wheel | Cycle weapons & items |
| Z / X / C | Wall / Floor / Ramp |
| F | Rotate build (build mode) |
| Esc | Pause menu |

## Third-party assets & licenses

**None.** Every visual is built from primitive Three.js geometry
(capsules, boxes, cones) with original materials/colors, and every sound
effect is synthesized at runtime with the Web Audio API (oscillators +
filtered noise) in `game/audio/soundManager.ts` — there are no image,
model, or audio files anywhere in `public/` beyond a small original SVG
logo/favicon. There is nothing to attribute and nothing borrowed from
Fortnite or any other game.

## Testing checklist

Manual QA pass to run before considering a change shippable:

- [ ] Main menu loads, Instructions and Settings screens open/close correctly
- [ ] Bot Duel: countdown → combat → can move/jump/sprint without clipping through the floor, boundary walls, ramps, or the center platform
- [ ] Third-person camera doesn't clip through geometry when backed against a wall
- [ ] Rifle: automatic fire, reload blocks firing, ammo counter updates, muzzle flash + tracer + impact effects show
- [ ] Shotgun: pellet spread, slower fire rate, correct magazine size
- [ ] Taking damage flashes the screen and updates the health/shield bars; shield absorbs before health
- [ ] Shield Potion / Medkit: progress ring shows, cancels on shoot/build/switch, respects starting charge counts and max-health/shield caps
- [ ] Build mode: preview turns green/red correctly, snaps to grid, Wall/Floor/Ramp all place, rotate (F) works, can't place inside the other player or outside the arena, per-player build cap enforced, cooldown enforced
- [ ] Ramps are climbable at a walk; builds block bullets and can be destroyed (health bar + destruction effect)
- [ ] Elimination ends the round, shows the round banner, resets builds/positions/ammo, and starts the next countdown
- [ ] Match ends at 5 rounds and shows the correct winner + score
- [ ] Rematch / Return to Menu / Reset Arena buttons all behave correctly from both the pause menu and match-results screen
- [ ] Bot difficulty (Easy/Normal/Hard) visibly changes aim accuracy and aggression
- [ ] Bot builds a wall/ramp under fire and retreats/heals at low health
- [ ] Online: create a room, join with the code from a second browser/profile, both sides ready up, match starts and stays in sync (position, shooting, builds, health, healing)
- [ ] Online: disconnect one client — the other sees the "opponent disconnected" banner; reconnecting within ~25s resumes the same slot
- [ ] Online: firing faster than the weapon's fire rate is rejected server-side (no double-damage from a modified client)
- [ ] Settings persist across a page reload (localStorage)
- [ ] Low graphics preset visibly reduces shadow/effect quality; shadow toggle works
- [ ] Production build (`npm run build`) and lint (`npx eslint .`) are clean
- [ ] `npx wrangler deploy --dry-run` bundles the realtime server without errors

## Known limitations

- **Hit registration is client-authoritative for detection, server-authoritative for damage.** Each client raycasts locally against its view of the opponent and reports a hit claim (weapon + headshot + pellet count); the server recomputes the damage from the shared weapon config and enforces fire-rate limits, but it does not re-run the 3D raycast itself (that would require shipping a full physics/geometry simulation to the Worker). This is a deliberate, documented simplification appropriate for a casual 1v1 game on a free-tier relay — it is not resistant to a determined cheater running a modified client, only to naive damage/rate tampering.
- **No matchmaking.** Only private rooms via a shared code, by design (per spec).
- **No spectator mode, no more than 2 players per room.**
- **Bot AI is a hand-tuned finite-state machine**, not a trained model — it's competent and difficulty-adjustable, not unbeatable or perfectly human-like.
- **Reconnection window is ~25 seconds**; after that the slot is freed and rejoining starts a fresh room membership.
- **Mobile/touch is not a supported input method** — the game is playable at a reduced usability on touch screens (UI is responsive) but there's no on-screen joystick/fire button; keyboard and mouse are required, and the UI says so.
- **A11y**: this is a fast-paced 3D shooter with a hard requirement on precise mouse aim; no reduced-motion or colorblind-specific modes are implemented yet beyond the general graphics/crosshair settings.
