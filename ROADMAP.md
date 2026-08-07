# ROADMAP.md

No time estimates are given anywhere in this file — none exist in the
repository to draw from, and the task instructions this file was created
under explicitly say not to invent them.

**STALE — flagged 2026-08-07, not rewritten (out of scope for that
checkpoint pass; see `PROJECT_STATE.md`).** This entire file predates a
large amount of shipped work confirmed in `git log`/`CHANGELOG.md`: the
"Lobby Update" (progression/cosmetics/daily-rewards/Training-Arena — see
`CHANGELOG.md` v0.2.0), a full **Battle Royale mode** with three maps
(`game/br/`, `components/game/BattleRoyaleScene.tsx`,
`components/ui/BRResults.tsx` all exist and are wired up —
**contradicting this file's own "Out-of-scope" section below, which
still lists Battle Royale as excluded**), a theme picker, and the first
live deployment + git repo. `FEATURES.md`, `TASKS.md`, `ARCHITECTURE.md`,
`FILE_MAP.md`, and `README.md` are similarly behind on this same
material — none of them document the Lobby hub, cosmetics, Battle
Royale, or Training Arena either. Treat `CHANGELOG.md` and `git log` as
the actual source of truth for what's shipped until someone does a full
pass to bring these files current. The two specific items below are
corrected since they're actively misleading (not just incomplete):

## Current milestone: Verify Online 1v1 end-to-end

**Corrected status: this milestone is DONE, not "Not started"** — see
`TASKS.md` `T-001` (executed and verified live, per its own Outcome
notes) and `SESSION_LOG.md`'s "Executed T-001" session entry. Original
text preserved below for history:

- **Objective:** Confirm the multiplayer path actually works with two
  live clients (see `TASKS.md` `T-001`).
- **Priority:** Highest
- **Status:** ~~Not started~~ **Done** (2026-08-06) — two-client live
  test passed, four real bugs found and fixed (`BUG-006`–`BUG-009`).
- **Dependencies:** None — all code is in place
- **Difficulty:** Low-Medium (no new code required, just running it and
  fixing whatever it surfaces)
- **Risk:** Unknown until run — this is precisely why it's the current
  milestone
- **Definition of done:** All acceptance criteria in `TASKS.md` `T-001`
  pass with two real browser clients.

## Next milestone: Harden the known gaps

- **Objective:** Resolve `BUG-001` through `BUG-004` (see `TASKS.md`).
- **Priority:** High
- **Status:** Not started
- **Dependencies:** Ideally after the current milestone, so any new bugs
  found live get triaged alongside the already-known ones.
- **Difficulty:** Low individually; each is a small, isolated fix.
- **Risk:** Low — all four are well-understood, narrowly-scoped issues.
- **Definition of done:** Each bug's acceptance criteria (in `TASKS.md`)
  met, and `FEATURES.md` statuses updated to reflect the fixes.

## MVP completion

**Everything required for a functioning MVP per the original product
scope already has working code** (movement, combat, building, healing,
bot AI with difficulty levels, online 1v1, match flow, settings, audio,
effects, all required UI screens). The gap between "code complete" and
"MVP done" is verification, not missing features:

- [ ] Live online multiplayer test passes (current milestone)
- [ ] Known bugs resolved or explicitly accepted as-is
- [ ] At least one real deployment exists (Vercel + Cloudflare Worker) and
      has been smoke-tested in production
- [ ] `NEXT_PUBLIC_PARTY_HOST` production behavior decided and implemented
      (`BUG-001`)

## Post-MVP

Ideas that would meaningfully extend the product but are not required
for the originally-scoped MVP. None of these have any code or design
work started; they are inferred as reasonable next steps from the
current architecture, not requirements found in the repository.

- **Persistent Durable Object storage** — currently all multiplayer state
  is in-memory only (see `DATABASE.md`); if match continuity across
  Worker restarts/hibernation matters, this would need real
  storage-layer work (the SQLite migration is already declared in
  `wrangler.jsonc` but unused).
- **Server-side runtime schema validation** of incoming WebSocket
  messages (see `TASKS.md` → Technical debt) — would harden both
  deployables against malformed/malicious input beyond what TypeScript's
  compile-time types provide.
- **Automated test suite** — no framework is installed today; `game/building/grid.ts`
  and `game/bots/fsm.ts` are pure-logic modules that would be
  straightforward first targets (see `TESTING.md`).
- **CI pipeline** (GitHub Actions or similar) running typecheck/lint/build
  on every push — none exists today (no `.github/workflows/` in this
  project).

## Long-term ideas

Speculative, not validated against any product requirement found in the
repository:

- Reduced-motion / accessibility modes beyond the existing
  graphics-quality and crosshair settings.
- A lightweight touch/mobile control scheme (currently explicitly
  unsupported — see `README.md`/`MainMenu.tsx` copy).
- Additional weapons or build types (the config-driven architecture in
  `game/config/*` was specifically designed to make this straightforward
  — see `FILE_MAP.md`'s "Where to make common changes").

## Optional improvements

- Delete the six dead/unused files under `public/` (`TASKS.md` T-009).
- Resolve the dead-config/dead-protocol-field cleanup items (`TASKS.md`
  T-006, T-008, T-010).

## Out-of-scope features

Explicitly excluded per the original product requirements (as documented
in `README.md`, which reflects the scope the game was actually built
against):

- Public matchmaking (private room codes only, by design).
- ~~Battle royale / open world / large lobbies.~~ **No longer accurate
  — a Battle Royale mode with three maps has since been built (see
  staleness note at the top of this file); this exclusion is from the
  original MVP scope and was superseded.**
- Complex inventory/economy systems. **Partially superseded too** — the
  Lobby Update added a real (if simple) cosmetics economy: Arena Coins,
  a Shop, a Locker, 8+ purchasable/equippable skins (see
  `CHANGELOG.md` v0.2.0). Still no real-money economy.
- More than 2 players per room (per-duel-room cap — unclear if this
  still holds for Battle Royale rooms; not verified this pass).
- Spectator mode.
