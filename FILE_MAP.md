# FILE_MAP.md

Practical map of the repository, prioritizing files a future agent is
likely to read or modify. Trivial generated files (`next-env.d.ts`,
`tsconfig.tsbuildinfo`, `.next/`, `.wrangler/`) are omitted.

## Where to make common changes

| I want to… | Edit this |
|---|---|
| Change navigation / add a menu screen | `stores/gameStore.ts` (add to `GameScreen` union) + `app/page.tsx` (add the render branch) + a new file in `components/ui/` |
| Add a new online-only page/screen | There is only one route (`/`) — add a new `gameStore.screen` value instead; this app does not use Next.js file-based routing beyond the single root page |
| Rebalance a weapon | `game/config/weapons.ts` only — read by both client and `party/server.ts` |
| Rebalance movement (speed, jump, gravity) | `game/config/movement.ts` — **note:** `groundFriction` and `turnSmoothing` are defined but unused (see `TASKS.md`); don't assume editing them does anything |
| Rebalance a build type (health/size) | `game/config/builds.ts` (`BUILD_TYPES`) and/or `BUILD_CONFIG` (grid size, cooldown, per-player cap) |
| Rebalance healing items | `game/config/healing.ts` |
| Change bot difficulty behavior | `game/config/bots.ts` **AND** `components/game/BotPlayer.tsx`'s `aimAccuracyFor()`/`brainSpeedMultiplier()` — these are currently duplicated, not derived from the config (see `TASKS.md` `BUG-002`). Also see `game/bots/fsm.ts` for the actual state-machine transition logic. |
| Change match rules (rounds to win, countdown length) | `game/config/match.ts` (`MATCH_CONFIG`) — read by both client (`matchStore.ts`) and server (`party/server.ts`) |
| Change the arena layout / add scenery | `game/config/arena.ts` (`ARENA`, `ARENA_DECOR`) + `components/game/Arena.tsx` (actual meshes/colliders) |
| Add a new weapon | `game/config/weapons.ts` (add to `WEAPONS` + `WEAPON_ORDER`), `components/game/WeaponView.tsx` (visual model — currently only branches on `weapon === "shotgun"`, needs a real branch), HUD item-cycling logic in `components/game/LocalPlayer.tsx` (`ITEM_ORDER` array) |
| Add a new build type | `game/config/builds.ts` (`BuildKind` union + `BUILD_TYPES`), `components/game/BuildGhost.tsx` + `BuildInstance.tsx` (geometry), `LocalPlayer.tsx`'s `BUILD_KEYS` map, `party/server.ts`'s `BuildRecord.kind` type |
| Add a new healing item | `game/config/healing.ts` (`HEALING` + `HealingItemId`), wire into `LocalPlayer.tsx`'s healing logic, `BotPlayer.tsx`'s bot healing logic, `party/server.ts`'s `handleHeal()` |
| Change the design theme/colors | `app/globals.css` (`@theme inline` tokens + `.glass-panel`/`.btn-*` classes) — **no** `tailwind.config.js` exists (Tailwind v4 CSS-based config) |
| Add an environment variable | `.env.example` (documented placeholder) + `CLAUDE.md`'s Environment setup table + read it via `process.env.NEXT_PUBLIC_*` (must be prefixed for client use) or plain `process.env.*` if server/Worker-only |
| Change deployment settings | `wrangler.jsonc` (Worker) — no Vercel config file exists (relies on zero-config auto-detection) |
| Modify authentication | N/A — none exists |
| Modify the database schema | N/A — no database exists |
| Change the wire protocol (multiplayer messages) | `game/networking/types.ts` — **must** update both `party/server.ts`'s handling AND the relevant client code (`onlineAdapter.ts`, `OnlineDuelScene.tsx`) together; this is a two-deployable coordinated change, see `CLAUDE.md` |
| Change multiplayer room/session logic | `party/server.ts` (server side) + `game/networking/client.ts` (client connection/token logic) |
| Change scoring / round-end logic | `stores/matchStore.ts` (client-authoritative for bot mode) + `party/server.ts`'s `endRound()`/`applyDamage()` (server-authoritative for online mode) — **keep both in sync conceptually**, they are two independent implementations of the same rules, not shared code |
| Change permissions/ownership of builds | `game/building/grid.ts`'s `validatePlacement()` (shared pure logic) + call sites in `LocalPlayer.tsx`, `BotPlayer.tsx`, `party/server.ts`'s `handleBuildPlace()` |
| Add sound effects | `game/audio/soundManager.ts` — all synthesis is procedural (Web Audio oscillators/noise), no audio files; add a new case to the `SoundId` union and the `play()` switch |
| Add a visual effect | `game/effects/effectsBus.ts` (add an `EffectEvent` variant) + `components/game/EffectsLayer.tsx` (the pooled renderer that consumes it) |

## Core files (high change-frequency, high risk)

| Path | Purpose | Imported by | Imports | Edit when… | Risk |
|---|---|---|---|---|---|
| `components/game/LocalPlayer.tsx` (495 lines) | Local player: input, movement, camera, shooting, building, healing, network-state sync. The single largest/most complex file in the project. | `BotDuelScene.tsx`, `OnlineDuelScene.tsx` | `game/config/*`, `game/physics/*`, `game/weapons/hitscan.ts`, `game/building/grid.ts`, `game/effects/effectsBus.ts`, `game/state/positionTracker.ts`, `game/audio/soundManager.ts`, `hooks/*`, `stores/*`, `game/networking/adapter.ts`, `CharacterModel.tsx`, `WeaponView.tsx`, `BuildGhost.tsx` | Adding any new player action/input | High — touches nearly every system; changes here are the most likely to introduce regressions across combat/building/movement simultaneously |
| `party/server.ts` (421 lines) | Entire multiplayer backend: room membership, match flow, damage/fire-rate/build authority | Deployed standalone via `wrangler` | `game/config/*` (relative imports only — see `CLAUDE.md`), `game/building/grid.ts`, `game/networking/types.ts` | Any online-mode rule change | High — a mismatch with the client wire protocol breaks Online 1v1 silently |
| `game/networking/types.ts` (204 lines) | The wire protocol contract (`ClientMessage`/`ServerMessage` unions) | `party/server.ts`, `game/networking/client.ts`, `onlineAdapter.ts`, `OnlineDuelScene.tsx`, `stores/networkStore.ts` | `game/config/weapons.ts`, `builds.ts`, `healing.ts` | Adding/changing any network message | High — both deployables must agree; no schema versioning exists |
| `components/game/BotPlayer.tsx` (289 lines) | Bot execution: movement, shooting, building, healing, driven by `BotBrain` | `BotDuelScene.tsx` | `game/bots/fsm.ts`, same physics/weapon/building/effects/audio modules as `LocalPlayer.tsx` | Changing bot behavior | Medium — contains the duplicated-config issue (`BUG-002`); verify `game/config/bots.ts` and this file's local functions stay in sync |
| `game/bots/fsm.ts` (180 lines) | `BotBrain` class — the actual AI state machine (idle/search/chase/attack/build-defense/retreat/heal) | `BotPlayer.tsx` | `game/config/bots.ts`, `game/config/builds.ts`, `game/config/healing.ts` | Changing bot decision-making | Medium — pure logic, easy to reason about/test in isolation, no rendering side effects |
| `game/building/grid.ts` (97 lines) | Grid snapping + placement validation — pure functions, no side effects | `LocalPlayer.tsx`, `BotPlayer.tsx`, `party/server.ts` | `game/config/builds.ts`, `game/config/movement.ts`, `game/building/types.ts` | Changing build placement rules | High — shared by client preview AND server authority; must stay behaviorally symmetric or client ghost preview will lie about what the server accepts |
| `stores/matchStore.ts` (87 lines) | Round/score/phase state machine for the UI | `BotDuelScene.tsx`, `OnlineDuelScene.tsx`, `LocalPlayer.tsx`, `BotPlayer.tsx`, `components/ui/Scoreboard.tsx`, `MatchResults.tsx`, `HUD.tsx`, `PauseMenu.tsx` | `game/config/match.ts` | Changing match-flow rules | Medium — has two parallel code paths: client-computed (`endRound`, bot mode) vs. server-applied (`applyServer*`, online mode); don't conflate them |
| `game/physics/useCharacterMover.ts` (49 lines) | Rapier `KinematicCharacterController` wrapper shared by all three moving entities | `LocalPlayer.tsx`, `BotPlayer.tsx` | `@react-three/rapier` | Changing movement/collision feel | **High** — see `CLAUDE.md`'s "DO NOT CHANGE WITHOUT REVIEW"; the missing unmount cleanup is intentional (Strict Mode/Rapier bug, `DECISIONS.md` D-004) |
| `next.config.ts` | `reactStrictMode: false` | Next.js build/dev | — | Almost never | **High** — re-enabling reproduces a real crash, see D-004 |

## Config layer (`game/config/*`) — low risk, high edit-frequency by design

All `as const` objects, no logic. Safe to tune values; **not** safe to
rename exported identifiers without grepping every usage first (several
are imported by `party/server.ts` via relative paths — a rename there
must be updated in both places since there's no shared barrel export).

| Path | Exports | Read by |
|---|---|---|
| `game/config/weapons.ts` | `WeaponId`, `WeaponConfig`, `WEAPONS`, `WEAPON_ORDER` | Client (fire logic, HUD), server (damage/fire-rate) |
| `game/config/movement.ts` | `MOVEMENT`, `ARENA_BOUNDS` | Client movement/camera, `game/building/grid.ts` bounds check, `party/server.ts` speed-cap |
| `game/config/builds.ts` | `BuildKind`, `BuildTypeConfig`, `BUILD_TYPES`, `BUILD_CONFIG` | Client build UI/placement, server placement validation |
| `game/config/healing.ts` | `HEALING`, `HealingItemId` | Client heal logic, server `handleHeal()`, `BotPlayer.tsx` |
| `game/config/bots.ts` | `BotDifficulty`, `BotDifficultyConfig`, `BOT_DIFFICULTY` | `game/bots/fsm.ts` (partially — see dead-field note), `MainMenu.tsx`/`SettingsPanel.tsx` (difficulty picker UI) |
| `game/config/match.ts` | `MATCH_CONFIG`, `PLAYER_SPAWNS` | Client match stores/scenes, server round logic |
| `game/config/arena.ts` | `ARENA`, `DecorProp`, `ARENA_DECOR` | `components/game/Arena.tsx` only |

## Physics/networking utility layer

| Path | Purpose | Risk to edit |
|---|---|---|
| `game/physics/damageable.tsx` | Hit-registration React Context (`DamageableProvider`), raycast-against-registry helper | Medium — every damageable entity depends on this contract |
| `game/physics/raycast.ts` | Single `castWorldRay()` helper wrapping Rapier's `castRayAndGetNormal` | Low — small, isolated |
| `game/weapons/hitscan.ts` | `fireWeapon()` (pellet spread + registry raycast), `computeDamage()` (headshot multiplier) | Medium — shared by `LocalPlayer` and `BotPlayer` |
| `game/networking/adapter.ts` | `GameAdapter` interface — the abstraction that makes `LocalPlayer.tsx` mode-agnostic | High to change the *shape* of, low to leave alone |
| `game/networking/localAdapter.ts` | Bot-mode `GameAdapter` impl — direct local state commits | Low — small, self-contained |
| `game/networking/onlineAdapter.ts` | Online-mode `GameAdapter` impl — sends WS messages | Medium — must match `types.ts` exactly |
| `game/networking/client.ts` | `GameNetworkClient` — PartySocket wrapper, room-code generation, reconnect token, ping loop | Medium — `getPartyHost()` here is the source of `BUG-001` |
| `game/networking/activeClient.ts` | Singleton so DOM UI outside `<Canvas>` can reach the live network client | Low |
| `game/state/positionTracker.ts` | Non-React mutable singleton for per-frame position sharing | Low — but easy to misuse (don't turn this into a Zustand store; that's the whole point of it existing) |
| `game/effects/effectsBus.ts` | Pub/sub for visual effect events | Low |
| `game/audio/soundManager.ts` (175 lines) | Procedural Web Audio synthesis for every SFX | Low risk, but every sound is hand-tuned oscillator/filter math — changing one can be fiddly to get sounding right |

## UI layer (`components/ui/*`)

Mostly low-risk, self-contained, reactive-only (no physics/game-loop
code). `HUD.tsx` is the composition root; everything else is a leaf.
`SettingsPanel.tsx` accepts an optional `onBack` prop specifically so
`PauseMenu.tsx` can embed it without navigating away from an active match
— preserve that pattern if you touch either file.

## Public assets

| Path | Status |
|---|---|
| `public/logo.svg` | **Real, used** — MainMenu/LoadingScreen logo, source for `app/icon.svg` favicon |
| `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | **Dead** — default create-next-app template assets, never referenced anywhere. Safe to delete. |
| `public/sounds/` | **Dead, empty directory** — scaffolded early in development, audio ended up fully procedural. Safe to delete. |
