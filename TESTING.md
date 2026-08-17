# TESTING.md

## Current test strategy

**There is no automated test suite.** No test framework is installed
(`package.json` has zero test-related dependencies — no Jest, Vitest,
Playwright, Cypress, Testing Library). Zero `*.test.*`/`*.spec.*` files
exist anywhere in the repository (verified via `find`). "Testing" to
date has consisted of:

1. Static verification: `tsc` (both tsconfigs), `eslint`, `next build`,
   `wrangler deploy --dry-run` — all clean as of this audit (see
   `PROJECT_STATE.md` for exact commands/output).
2. One scripted browser session (Playwright, installed ad hoc into a
   scratch directory **outside** this repo, not a project dependency)
   that drove Bot Duel through menu → match → movement → shooting →
   build-mode-toggle, confirming zero console errors and correct visual
   rendering via screenshots. This was a one-off verification, not a
   repeatable/committed test.
3. **Online 1v1 has never been tested at all**, automated or manual, with
   two real connected clients. This is the single largest testing gap in
   the project — see `TASKS.md` `T-001`.

## Test directory structure

None exists.

## Unit tests

None exist. Best candidates if a framework is introduced (pure logic,
no React/DOM/network dependency, easy to test in isolation):

- `game/building/grid.ts` — `snapToGrid`, `footprintHalfExtents`,
  `aabbOverlap`, `isWithinArenaBounds`, `overlapsAnyPlayer`,
  `validatePlacement`. Deterministic pure functions; ideal first target.
- `game/bots/fsm.ts` — `BotBrain.update()`. Deterministic given a fixed
  `BotPerception` input and controlled `Math.random` (would need to
  mock/seed randomness for the probabilistic transitions like
  build-defense triggering).
- `game/weapons/hitscan.ts` — `computeDamage()` is pure; `fireWeapon()`
  involves `THREE.Raycaster` against a registry, more of an integration
  test.
- `game/config/*.ts` — no logic to test, but a "config values are
  internally consistent" smoke test (e.g., asserting `components/game/BotPlayer.tsx`'s
  hardcoded difficulty values match `BOT_DIFFICULTY`, closing the loop on
  `TASKS.md` `BUG-002` regressions) would be cheap and high-value.

## Integration tests

None exist. Would need either a headless browser (for the R3F/Rapier
client) or a lightweight harness around `party/server.ts`'s `GameRoom`
class (it's a plain class with `onConnect`/`onMessage`/`onClose` methods
— could plausibly be unit-tested with mock `Connection` objects without
needing a real Cloudflare Workers runtime, though this hasn't been
attempted).

## End-to-end tests

None exist, none automated. See "Manual smoke-test checklist" below for
the closest equivalent, and `TASKS.md` `T-001` for the highest-priority
gap.

## Manual testing steps

This is the actual, currently-relied-upon verification method. Checklist
below is the full pre-release/pre-merge pass (carried over and expanded
from `README.md`'s original checklist, now the canonical copy — keep
`README.md` and this file in sync if either changes).

### Pre-flight (run every time before manual testing)

```bash
npx tsc --noEmit -p tsconfig.json     # must exit 0
npx tsc -p party/tsconfig.json          # must exit 0
npx eslint .                              # must exit 0 (2 pre-existing img-element warnings OK)
npm run build                              # must succeed
npx wrangler deploy --dry-run              # must succeed, safe (does not actually deploy)
```

### Manual smoke-test checklist

**Menu & navigation**
- [ ] Main menu loads with no console errors
- [ ] Instructions screen opens/closes correctly (from menu, and as the
      forced first-match flow)
- [ ] Settings screen opens/closes; changes persist across a page reload
      (verify via `localStorage.buildstrike-settings`)

**Bot Duel**
- [ ] Countdown → combat transition happens at 3→2→1→FIGHT
- [ ] WASD movement, Space jump, Shift sprint all work without clipping
      through the floor, boundary walls, ramps, or center platform
- [ ] Third-person camera doesn't clip through geometry when backed
      against a wall (occlusion raycast pulls it closer)
- [ ] Rifle: automatic fire while holding left-click, reload (R) blocks
      firing, ammo counter updates, muzzle flash + tracer + impact
      effects render
- [ ] Shotgun: pellet spread visible on a nearby target, correct
      (slower) fire rate, correct (smaller) magazine size
- [ ] Taking bot damage flashes the screen red and updates health/shield
      bars; shield absorbs before health
- [ ] Shield Potion / Medkit: progress ring shows while holding,
      cancels on shoot/build/switch-item, respects starting charge
      counts (3 potions / 1 medkit) and max caps (no heal above 100)
- [ ] Build mode (Q): ghost preview turns green/red correctly, snaps to
      a 4-unit grid, all three kinds (Z/X/C) place, rotate (F) works,
      can't place inside the bot or outside the arena, 12-build
      per-player cap enforced, ~250ms placement cooldown enforced
- [ ] Ramps are climbable at a walk; builds block bullets and show a
      damage-fraction health bar; destroyed builds show a destruction
      effect + sound
- [ ] Bot: moves toward/away appropriately, shoots back with visible
      inaccuracy scaled by difficulty, occasionally jumps, builds a
      wall/ramp under sustained fire, retreats and/or heals at low
      health — repeat at Easy/Normal/Hard and confirm a visible
      difference in aim accuracy and aggression
- [ ] Elimination ends the round, shows the round-winner banner, clears
      builds, resets both players' position/health/ammo, starts the next
      countdown
- [ ] Match ends at 5 round wins, shows the correct winner and final
      score on `MatchResults`
- [ ] Rematch / Return to Menu / Reset Arena all behave correctly from
      both the pause menu (Esc) and the match-results screen

**Online 1v1 — currently UNVERIFIED, see `TASKS.md` T-001**
- [ ] Create a room in one browser/profile, join with the code in a
      second browser/profile
- [ ] Both sides show correct room-status/ready state; match starts
      only after both ready up
- [ ] Position/rotation sync looks smooth (interpolated) on the remote
      player
- [ ] Shooting, hit confirmation, and damage sync correctly on both
      sides
- [ ] Building syncs to both sides; a placement invalid on the server
      (e.g., raced by the opponent) is rejected — note: currently no
      client UI reflects this rejection, see `TASKS.md` T-007
- [ ] Healing syncs (including the opponent hearing/seeing the other's
      heal start)
- [ ] Round/match end syncs correctly on both sides
- [ ] Disconnecting one client shows the "opponent disconnected" banner
      on the other within a few seconds
- [ ] Reconnecting the same client (same tab, so the same
      `sessionStorage` token) within ~25s resumes the same room slot
      without creating a new one
- [ ] Rematch requires both sides to click Rematch before a new match
      starts
- [ ] Fire-rate abuse test: try to fire faster than the weapon allows
      (e.g., via dev tools manually sending rapid `fire` messages) and
      confirm the server drops the excess

**Settings**
- [ ] Low graphics preset visibly reduces shadow/effect quality
      (compare a Low vs. High screenshot)
- [ ] Shadow toggle works independent of the graphics preset
- [ ] Mute silences all sound; individual master/SFX volume sliders work

## Test accounts / fixtures

None needed — no accounts exist.

## Browser/device expectations

Desktop, keyboard + mouse, evergreen Chromium/Firefox/Safari (WebGL2 +
Pointer Lock API + Web Audio API + WebSocket support assumed, none
explicitly version-pinned or tested against). No mobile/touch support
(by design — see `README.md`/`UI_SYSTEM.md`).

## Known flaky tests

N/A — no automated tests exist to be flaky.

## Pre-deployment checks

Run the full "Pre-flight" command block above, then as much of the
manual smoke-test checklist as time allows, with the Online 1v1 section
being the highest-value/highest-risk area to actually exercise before
calling anything "ready" — see `TASKS.md` `T-001`.
