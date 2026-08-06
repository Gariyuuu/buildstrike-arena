# API_REFERENCE.md

There are no Next.js API routes, no Server Actions, and no REST/GraphQL
endpoints anywhere in this project (verified — no `app/api/` directory
exists). The **only** backend surface is the realtime WebSocket protocol
served by the Cloudflare Worker at `party/server.ts`, plus one trivial
HTTP fallback response from that same Worker. All shapes below are taken
directly from `game/networking/types.ts` (the source of truth — shared
by both sides) and cross-checked against `party/server.ts`'s actual
`onMessage` handling.

## HTTP endpoint

### `GET|* /` (any request not matched by PartyServer's WS routing)

- **Source file:** `party/server.ts`, default export `fetch` handler
- **Purpose:** Trivial identification response; not a real API.
- **Auth:** None
- **Request:** Any HTTP request to the Worker's root that isn't a
  WebSocket upgrade to `/parties/game-room/<code>`
- **Response:** `200 OK`, plain text: `"BuildStrike Arena realtime
  server. Connect via /parties/game-room/<room-code>."`
- **Errors:** None explicit (falls through to this response for
  anything `routePartykitRequest` doesn't handle)

## WebSocket endpoint

### `WSS /parties/game-room/<ROOM_CODE>?token=<token>&name=<name>`

- **Source file:** `party/server.ts` (class `GameRoom`), connection
  routing via `routePartykitRequest` (from the `partyserver` library)
- **Purpose:** The entire Online 1v1 realtime channel — room membership,
  match flow, position sync, combat, building, healing.
- **Auth:** None (no accounts). `token` is a client-generated nanoid
  (from `sessionStorage`, see `DATABASE.md`) used only to re-match a
  reconnecting client to its existing room slot within a 25-second grace
  window — not a credential, not verified against anything external.
- **Client identity assignment:** First connection to a given room code
  becomes side `"a"`, second becomes `"b"`. A third distinct connection
  (different token) is rejected: server sends `{type:"error", message:
  "Room is full."}` then closes the WebSocket with code `4001`.
- **Rate limits:** Fire-rate limiting only (see `handleFire` below) — no
  general message-rate limiting exists.

## Client → Server messages (`ClientMessage` union)

All are JSON objects with a `type` discriminant, sent via
`GameNetworkClient.send()` (`game/networking/client.ts`).

| Type | Shape (fields beyond `type`) | Handled by | Notes |
|---|---|---|---|
| `ready` | *(none)* | `case "ready"` — sets `slot.ready = true`, broadcasts room status, calls `maybeStartMatch()` | Sent by `OnlineLobbyOverlay.tsx`'s Ready button |
| `state` | `{ position: [x,y,z], rotationY: number, isBuildMode: boolean, buildKind: "wall"\|"floor"\|"ramp", weapon: "rifle"\|"shotgun", timestamp: number }` | `case "state"` → `handleState()` | Sent every ~55ms while in combat, from `LocalPlayer.tsx`. Server validates implied speed from position delta / elapsed time; drops (silently, no error sent) updates implying speed above `MOVEMENT.walkSpeed * MOVEMENT.sprintMultiplier * 1.6`. (`HelloMsg`/`type:"hello"` and this message's old `seq` field were both removed 2026-08-06, `T-008` — dead, never read.) |
| `fire` | `{ weapon, origin:[x,y,z], direction:[x,y,z], timestamp, hitPlayer?:{headshot,pellets}, hitBuild?:{buildId,pellets} }` | `case "fire"` → `handleFire()` | Sent on every shot (hit or miss) from `onlineAdapter.ts`'s `reportFire()`. Server enforces fire-rate (drops silently if faster than 80% of the weapon's minimum interval) and recomputes damage from `WEAPONS` config — **never trusts a client-supplied damage number** (there isn't one in the message at all, by design). |
| `buildPlace` | `{ clientId: string, kind, position:[x,y,z], rotationY: number }` | `case "buildPlace"` → `handleBuildPlace()` | Server re-runs `validatePlacement()` (same pure function the client used for its preview) as the actual authority. |
| `healStart` / `healCancel` / `healComplete` | `{ item: "shieldPotion"\|"medkit" }` (same shape, `type` distinguishes the event) | `case "healStart"\|"healCancel"\|"healComplete"` → `handleHeal()` | Only `healComplete` actually mutates health/shield server-side; start/cancel are relayed for the opponent's UI/audio feedback only. Server does **not** independently validate the player had remaining charges (documented trust gap, see `SECURITY.md`). |
| `resetRequest` | *(none)* | `case "resetRequest"` → `resetRound(false)` (only if `this.phase === "combat"`) | Sent by `PauseMenu.tsx`'s "Reset Arena" — the only Reset Arena button left; `MatchResults.tsx`'s redundant, non-syncing copy was removed 2026-08-06 (`BUG-004`, `T-003`). Server now rejects this outside `combat` phase, fixed 2026-08-06 (`BUG-003`, `T-004`) — verified live via a raw WebSocket script. |
| `rematchRequest` | *(none)* | `case "rematchRequest"` | Both sides must send this before a rematch begins; server tracks `rematchRequested` per slot. |
| `ping` | `{ t: number }` | `case "ping"` → replies `{type:"pong", t}` | Sent every 3s by `GameNetworkClient` for RTT measurement. |
| `leave` | *(none)* | `case "leave"` → closes the connection (code 1000) | Triggers the same `onClose` cleanup path as any disconnect. |

## Server → Client messages (`ServerMessage` union)

Broadcast via `GameRoom.broadcastMsg()` (all connections) or sent to one
connection via `GameRoom.send()`.

| Type | Shape (fields beyond `type`) | Sent when | Handled client-side by |
|---|---|---|---|
| `welcome` | `{ side: "a"\|"b", roomCode: string, opponentPresent: boolean }` | Immediately on connect (or reconnect) | `OnlineDuelScene.tsx` → sets `networkStore.mySide`/`status`/`opponentPresent` |
| `roomStatus` | `{ opponentPresent, opponentConnected, opponentReady }` | After any connect/disconnect/ready change | Updates `networkStore` |
| `matchStart` | `{ countdown: number, isNewMatch: boolean }` | Both slots ready from `lobby` phase, a rematch (`isNewMatch: true`), **or** the ordinary countdown before every next round of an in-progress match (`isNewMatch: false`) | `matchStore.applyServerCountdown()`, clears builds/HUD, sets `networkStore.matchStarted = true`. `isNewMatch` gates whether score/round reset to 0/1 — added 2026-08-06 after a live two-client test found the client couldn't otherwise tell a rematch apart from an ordinary round transition (both broadcast this same message type) and was resetting score every round; see `DECISIONS.md` D-016 |
| `roundStart` | `{ round: number }` | 3s after `matchStart` (or after a round reset with a new countdown) | `matchStore.applyServerCombatStart()` |
| `opponentState` | `{ position, rotationY, isBuildMode, buildKind, weapon, timestamp }` | Relay of the other player's `state` message (only if it passed the speed check) | `RemotePlayer.tsx`'s `netStateRef`, interpolated every frame |
| `opponentFired` | `{ weapon, origin, direction }` | Relay of the other player's `fire` message | `RemotePlayer.tsx` — triggers muzzle flash/tracer/audio only, no damage logic client-side |
| `damageApplied` | `{ target: "a"\|"b", health, shield, damage, headshot }` | After `handleFire`/`applyDamage` resolves a `hitPlayer` claim | Both clients: updates `playerStore` (local or opponent depending on `target`), triggers damage flash/sound on the target's own client |
| `buildConfirmed` | `{ clientId, build: {id,kind,owner,position,rotationY,health,maxHealth} }` | Valid `buildPlace` | `buildsStore.add()` on both clients (owner translated `a`/`b` → `local`/`opponent`) |
| `buildRejected` | `{ clientId }` | Invalid `buildPlace` | Fixed 2026-08-06 (`T-007`): `OnlineDuelScene.tsx` now triggers `playerStore.triggerBuildDenied()` and plays a `buildDenied` sound; `CombatHud.tsx`'s `BuildDeniedToast` shows a brief "Placement denied" message. **Not independently live-repro'd** — see `TASKS.md` T-007's Outcome notes for why (client-side pre-validation blocks the only easily-scriptable trigger). |
| `buildDamaged` | `{ buildId, health }` | A `fire` message's `hitBuild` claim reduces a build below full but above 0 | `buildsStore.damage()` |
| `buildDestroyed` | `{ buildId }` | A `hitBuild` claim reduces a build to ≤0 | `buildsStore.remove()` + destruction VFX/SFX |
| `healApplied` | `{ side, item, health, shield, event: "start"\|"cancel"\|"complete" }` | Relay of any heal event | Updates `playerStore`; `"start"` also triggers the opponent's potion/medkit sound on the *other* client |
| `roundEnd` | `{ winner: "a"\|"b", score: {a,b} }` | A player's health reaches 0 | `matchStore.applyServerRoundEnd()` (score translated to `local`/`opponent`) |
| `matchEnd` | `{ winner: "a"\|"b" }` | `score[winner] >= MATCH_CONFIG.roundsToWin` (5) | `matchStore.applyServerMatchEnd()` → shows `MatchResults.tsx` |
| `roundReset` | *(none)* | After a non-final round ends (post-delay) or a manual `resetRequest` | Clears builds, resets HUD |
| `opponentDisconnected` | *(none)* | The other slot's connection closes | Shows the "opponent disconnected" banner (`ConnectionStatus.tsx`) |
| `opponentReconnected` | *(none)* | The other slot reconnects with a matching token within the grace window | Clears the disconnected banner |
| `matchResume` | `{ phase, round, score: {a,b}, yourHealth, yourShield, opponentHealth, opponentShield, builds: [...] }` | Sent to a reconnecting client (token matched an existing slot) **in addition to** `welcome`, only when `phase !== "lobby"` | `matchStore.applyServerResume()` + `playerStore.setLocal`/`setOpponent` + rehydrates `buildsStore` + sets `networkStore.matchStarted = true`. Added 2026-08-06 (`BUG-008`, see `DECISIONS.md` D-015) — without it, a client reconnecting mid-match had no way to know a match was in progress and got stuck on the pre-match lobby overlay forever. **Known gap (`BUG-010`, not fixed):** no winner field, so reconnecting during the round-end/match-end window loses the winner banner. |
| `pong` | `{ t: number }` | Reply to `ping` | `networkStore.setPing(Date.now() - t)` |
| `error` | `{ message: string }` | Room full (only current use) | `networkStore.setError()` → shown in `OnlineLobbyOverlay.tsx` |

## Validation

See `SECURITY.md` for the full trust-boundary discussion. Summary of
what the server actually validates vs. trusts:

| Validated server-side | Trusted from client |
|---|---|
| Fire rate (per weapon, per slot) | The raycast/hit-detection result itself (client claims "this hit," server only checks rate + recomputes damage amount) |
| Movement speed (position delta vs. elapsed time) | Exact position within the speed limit (no server-side collision/geometry re-check) |
| Build placement (grid/bounds/overlap/per-owner cap, via shared `validatePlacement()`) | — |
| Room capacity (max 2) | Reconnect token validity (no cryptographic verification, just string equality against in-memory state) |
| — | Healing charge counts (server clamps the *result* to max health/shield but does not check the player actually had a charge remaining) |

## Example request/response

Fire-and-hit example (rifle, non-headshot, single pellet):

```jsonc
// Client -> Server
{
  "type": "fire",
  "weapon": "rifle",
  "origin": [1.2, 1.8, -3.4],
  "direction": [0.01, -0.02, 0.999],
  "timestamp": 1733500000123,
  "hitPlayer": { "headshot": false, "pellets": 1 }
}

// Server -> both clients
{ "type": "opponentFired", "weapon": "rifle", "origin": [1.2,1.8,-3.4], "direction": [0.01,-0.02,0.999] }
{ "type": "damageApplied", "target": "b", "health": 82, "shield": 0, "damage": 18, "headshot": false }
```

(`18` matches `WEAPONS.rifle.damage` in `game/config/weapons.ts` exactly
— the server computed this from config, not from any value the client
sent, since the `fire` message contains no damage field at all.)

## Known issues affecting this API

- No runtime schema validation of incoming JSON on either side beyond
  the TypeScript compile-time types — a malformed-but-parseable message
  could throw deep in a handler rather than being rejected at the
  boundary (see `TASKS.md` → Technical debt).
- No API versioning of any kind — a client and Worker with mismatched
  `game/networking/types.ts` will fail silently, not with a clear error.
  (This is exactly the class of bug that produced `BUG-009` within a
  single deploy: two code paths broadcasting the same message shape with
  different implied meanings — worth remembering as a cautionary
  example if this protocol grows further without ever adding real
  schema/version checks.)
- `matchResume` doesn't carry a round/match winner (`BUG-010`) — see its
  table entry above.
- **This entire protocol is now live-verified**, not just
  internally-consistent-on-paper (as of 2026-08-06 — see `TASKS.md`
  `T-001`, `DECISIONS.md` D-013–D-016). Every message type in the two
  tables above was observed actually flowing correctly between two real
  clients during `T-001`, **except** `buildRejected`, which was verified
  server-side only via a raw WebSocket script (see `T-007`'s Outcome
  notes) — its client-side UI reaction has not had a live repro.
