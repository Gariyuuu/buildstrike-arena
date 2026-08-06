# SECURITY.md

Defensive security review of BuildStrike Arena as of 2026-08-06. This is
a low-stakes casual game with no accounts, no payments, and no personal
data — the threat model is narrow (cheating/griefing in a 1v1 match, not
data breach), and the review below is scoped accordingly. No destructive
testing was performed; no unauthorized systems were accessed.

## Authentication boundaries

None exist. There is no login, no session, no user identity beyond a
per-tab, per-room reconnection token (see `DATABASE.md`). This is a
correct match for the product's scope (no accounts requested or needed),
not a gap to "fix."

## Authorization boundaries

- **Room capacity:** Enforced server-side (`party/server.ts`'s
  `onConnect` — 3rd distinct connection to a room is rejected). Sound.
- **Slot/side ownership:** A connection can only act as the side (`a`/
  `b`) it was assigned; there's no way for a client to spoof acting as
  the opponent's slot since `slotByConnection()` looks up by the
  server's own `connection.id`, not anything client-supplied.
- **Build ownership:** `handleBuildPlace()` always assigns
  `owner: slot.side` from the server's own record of who sent the
  message — a client cannot place a build "as" the opponent.
- **No admin/privileged role exists** — both sides have symmetric
  capabilities.

## Protected routes

N/A — no routes require protection (no auth system, no user-specific
data).

## Secret handling

**No secrets exist in this project.** No API keys, no database
credentials, no signing secrets, nothing beyond `wrangler login`'s
OAuth session (stored by Wrangler outside the repo, not project-managed).
Verified via repo-wide search for common secret patterns — none found.

## Environment variables

Exactly one, `NEXT_PUBLIC_PARTY_HOST` (see `CLAUDE.md`). It is
intentionally `NEXT_PUBLIC_`-prefixed (bundled into client JS) because
it's a public hostname, not a credential — correct choice, not a leak.

## Client-exposed variables

Same one variable — by design, and appropriately so (it must be known to
the browser to open the WebSocket).

## Input validation

| Input | Client-side check | Server-side check | Gap |
|---|---|---|---|
| Player display name | 16-char max via `maxLength` attribute (`MainMenu.tsx`) | Truncated to 16 chars server-side too (`.slice(0, 16)` in `onConnect`) | No content filtering (profanity, HTML-looking strings) either side — see XSS note below |
| Room code (join) | Uppercased, ≥4 chars required to enable Join button | Server just uses whatever string is in the URL path as the Durable Object instance name — no format/charset validation server-side | Low risk (worst case: a malformed code just creates/joins a "room" that no one else can reach) |
| Weapon fire messages | N/A (always sent from internal game logic, not raw user text) | Fire-rate enforced; damage recomputed from config, never trusted from the client | See "Hit detection trust" below — the *rate* is validated, the *claim* is not re-simulated |
| Build placement | Client validates via `validatePlacement()` before showing a green preview | Server re-runs the same `validatePlacement()` as the actual authority | Sound — this is the one input surface with real, matching double validation |
| Movement/position | N/A | Speed-delta sanity check (`MAX_SPEED`) | No check for teleportation *through* geometry (a position that implies valid speed but passes through a wall between two samples wouldn't be caught) |
| Heal charge count | Client checks `hasCharges` before starting | **Not independently validated server-side** — server just applies the restore and clamps to max health/shield on any `healComplete` message | A modified client could send unlimited `healComplete` messages; each one is individually clamped to max health/shield, so the *damage* isn't that a player exceeds 100 HP, it's that they could heal instantly/infinitely bypassing the real item's duration and charge limit |

## Output encoding / XSS risk

The player display `name` field is rendered as React children/text
content throughout the UI (never via `dangerouslySetInnerHTML` —
verified, no occurrences found anywhere in the codebase), so React's
default JSX text escaping applies. **No XSS vector found** despite the
lack of explicit content validation on the name field, specifically
because nothing ever injects it as raw HTML.

## SQL injection risk

N/A — no database, no SQL, anywhere.

## CSRF protections

N/A in the traditional sense — there are no state-changing HTTP
endpoints (cookie-authenticated or otherwise) to CSRF. The WebSocket
connection is the only stateful surface, and WebSocket connections are
not vulnerable to classic CSRF (an attacker page can't silently open a
cross-origin WebSocket and have it "count" as the victim's authenticated
session, since there's no session/cookie auth here to hijack in the
first place).

## File upload risks

N/A — no file upload feature exists anywhere.

## Webhook verification

N/A — no webhooks (incoming or outgoing) exist anywhere in this project.

## Rate limiting

- **Fire rate:** Enforced server-side per weapon per slot (`party/server.ts`'s
  `handleFire`, 80% of the weapon's theoretical minimum interval as
  tolerance).
- **Everything else is unrated:** No general per-connection message-rate
  limit exists. A malicious/buggy client could flood `state`, `buildPlace`,
  `ping`, or heal messages far faster than gameplay would ever produce
  them. Build placement has an *indirect* rate limit via the client-side
  `BUILD_CONFIG.placementCooldown` (250ms) and the per-owner active-build
  cap (12), but **neither is enforced against message frequency
  server-side** — only the resulting placement's validity is checked, so
  a client could spam `buildPlace` messages (each individually valid or
  rejected on its own merits, but with no throttle on how often it can
  try).
- **No IP-based or connection-count-based abuse protection** beyond
  Cloudflare's platform-level DDoS protection (out of this project's
  control/scope).

## Admin access

N/A — no admin role/interface exists.

## Database policies

N/A — no database (see `DATABASE.md`).

## Logging of sensitive data

No structured logging exists at all (see `ARCHITECTURE.md`). Nothing
sensitive to accidentally log, since nothing sensitive is collected.

## Dependency concerns

Not audited via `npm audit` as part of this review (out of scope for a
documentation-only pass; running it would be a reasonable follow-up — it
doesn't modify anything and is safe to run). Dependency versions are
recorded exactly in `CLAUDE.md`'s Technology stack table for future
reference/comparison.

## Production security gaps (recommended fixes, not yet implemented)

Ranked by how much they matter for this specific low-stakes game:

1. **Heal-charge validation** — add a server-side charge counter per
   slot (mirroring `PlayerSlot.health`/`.shield`) so `healComplete`
   can't be spammed past the intended 3/1 charge limits. Currently the
   worst outcome is "infinite healing," which does undermine the core
   game balance more than most gaps here.
2. **General message-rate limiting** — a simple per-connection token
   bucket in `GameRoom` would close the build-spam and general-flood
   gaps cheaply.
3. ~~**`NEXT_PUBLIC_PARTY_HOST` production fallback**~~ — fixed
   2026-08-06 (`BUG-001`, `TASKS.md` `T-002`, `DECISIONS.md` D-017): the
   client now fails loudly with a clear message instead of silently
   falling back to `localhost:8787` in production.
4. **Hit-detection re-simulation** — explicitly out of scope per the
   documented trade-off (`DECISIONS.md` D-006); listed here for
   completeness, not as a recommended near-term fix, since doing it
   properly would require shipping real physics/geometry to the Worker
   — a disproportionate amount of work for a casual free-tier 1v1 game.

## Explicitly not a concern for this project

- Payment/billing security (no payments exist).
- PII protection (no PII is collected).
- Multi-tenant data isolation beyond room-code separation (no persistent
  tenant data exists to isolate).
