# DEPLOYMENT.md

**Both targets are live as of 2026-08-06:**

- **App:** https://buildstrike-arena.vercel.app (Vercel, CLI-deployed
  directly from this local directory — **not** via a Git integration,
  since this project has no git repo/commits; see `PROJECT_STATE.md`.
  No preview deployments exist for the same reason.)
- **Realtime backend:** `buildstrike-arena-realtime.chamber-seven.workers.dev`
  (Cloudflare Worker, deployed via `npx wrangler deploy`)

`NEXT_PUBLIC_PARTY_HOST` is set in the Vercel project's Production
environment to the Worker's host above. No custom domain, no CI/CD
pipeline. Everything below is accurate setup instructions derived from
the actual config files and this deploy, kept for anyone repeating the
process (e.g. after a fresh `wrangler deploy` changes the Worker's
version, or setting up CI).

## Two independent deploy targets

| | The game client | The realtime backend |
|---|---|---|
| What | Next.js app | Cloudflare Worker (`party/server.ts`) |
| Where | Vercel (recommended — zero-config Next.js support) | Cloudflare Workers |
| Needed for | Everything (menu, Bot Duel, UI) | Online 1v1 only |
| Config file | None project-specific (relies on Vercel's Next.js auto-detection) | `wrangler.jsonc` |
| Deploy command | `vercel --prod` (CLI, no git integration — see note above) | `npm run party:deploy` |

## Hosting platform

- **App:** Vercel (per `README.md`; no alternative is configured, though
  any Next.js-compatible host would work since there's nothing
  Vercel-specific in the code — no `vercel.json`, no Vercel-only APIs
  used).
- **Realtime backend:** Cloudflare Workers + Durable Objects (per
  `wrangler.jsonc`). `README.md`'s "Alternative deployment" section
  documents swapping this for any WebSocket-capable Node host, but no
  code changes toward that exist yet.

## Build command

- App: `next build` (verified working — `npm run build`, exit 0, as of
  this audit; see `PROJECT_STATE.md`).
- Worker: `wrangler deploy` bundles via esbuild internally — no separate
  build step; real `wrangler deploy` (2026-08-06) bundled and published
  cleanly (50.83 KiB / 13.86 KiB gzip).

## Installation command

`npm install` (repo has `package-lock.json`; use `npm ci` in a CI/CD
context once one exists).

## Runtime version

- **Node.js:** Verified installed on the dev machine as v26.3.0. **Not
  pinned anywhere** — no `.nvmrc`, no `engines` field in `package.json`.
  Vercel will use its own default Node runtime unless configured
  otherwise; confirm compatibility (Next.js 16 requires a reasonably
  recent Node — check Vercel's project settings if a build fails on
  Node-version grounds).
- **Cloudflare Workers runtime:** `compatibility_date: "2024-09-23"` in
  `wrangler.jsonc` — this pins the Workers runtime's behavior as of that
  date, independent of Node.

## Output configuration

Default Next.js output (`.next/`) — no custom `output` mode configured
in `next.config.ts` (no `output: "export"` or `"standalone"`), so this
relies on Vercel's normal Next.js build pipeline, not a static export.

## Environment variables (deployment-specific)

Only `NEXT_PUBLIC_PARTY_HOST` — see `CLAUDE.md`. **Set in the Vercel
project's Production environment** (`garywangsmes-8349s-projects/buildstrike-arena`)
to `buildstrike-arena-realtime.chamber-seven.workers.dev`. If this is
ever unset in a deployed environment, `T-002`'s fix means the client now
fails loudly with a clear message instead of the old silent
`localhost:8787` fallback (`BUG-001`).

## Domains

`https://buildstrike-arena.vercel.app` (Vercel's free `*.vercel.app`
subdomain) and `buildstrike-arena-realtime.chamber-seven.workers.dev`
(Cloudflare's free `*.workers.dev` subdomain, under the account's
`chamber-seven` subdomain namespace — shared with the `chamber-seven`
project). No custom domain configured or needed.

## Preview deployments

None — this project was deployed via `vercel --prod` directly from the
local directory (no Git integration, since this project has no git
repo/commits — see `PROJECT_STATE.md`), so there's no branch-based
preview flow. A plain `vercel` (no `--prod`) from this directory would
create a preview deployment on demand if ever needed. Cloudflare Workers
has no equivalent "preview deploy per branch" set up here either
(`wrangler deploy` always targets the one Worker named
`buildstrike-arena-realtime` per `wrangler.jsonc`).

## Production deployments

**Already done once — 2026-08-06.** To redeploy after further changes:

### Deploying the app (Vercel)

1. `cd` into this directory and run `vercel --prod --yes` — the project
   is already linked (`.vercel/project.json` exists) and
   `NEXT_PUBLIC_PARTY_HOST` is already set in Production, so this is a
   one-command redeploy for any future app change.
2. If the Worker is ever redeployed to a **different** host (e.g. a new
   Worker name), update `NEXT_PUBLIC_PARTY_HOST` first: `echo -n
   "<new-host>" | vercel env rm NEXT_PUBLIC_PARTY_HOST production` then
   `vercel env add NEXT_PUBLIC_PARTY_HOST production`, then redeploy.

### Deploying the realtime backend (Cloudflare Workers)

1. Already authenticated (`npx wrangler whoami` confirms this).
2. `npm run party:deploy` (runs `wrangler deploy`) — republishes to the
   same `buildstrike-arena-realtime.chamber-seven.workers.dev` host each
   time (the Worker name in `wrangler.jsonc` doesn't change), so the
   app's `NEXT_PUBLIC_PARTY_HOST` does **not** need updating for a normal
   Worker redeploy.
3. **Caution:** the Durable Object holding all active game rooms is
   in-memory only (see `DATABASE.md`/Runtime limitations below) — a
   Worker redeploy drops any currently-in-progress online matches.

## Database deployment steps

N/A — no database exists (`DATABASE.md`).

## Storage setup

N/A — no storage buckets/providers exist.

## External service setup

None beyond the two deploy targets above (Vercel account, Cloudflare
account — both free-tier-sufficient per `README.md`'s stated design
goal).

## Scheduled jobs / webhooks

None exist — nothing to configure.

## Build failures — what to check

- **App build fails:** Run `npm run build` locally first; it succeeded
  cleanly as of this audit, so a fresh failure likely indicates either
  an uncommitted local change or a Node-version mismatch on the deploy
  platform (see Runtime version above — nothing pins this today).
- **Worker deploy fails:** Run `npx wrangler deploy --dry-run` locally
  first (safe, doesn't publish); it succeeded cleanly as of this audit.
  A real `wrangler deploy` failure beyond that is most likely an auth
  issue (`wrangler login` not completed/expired) or a Cloudflare account
  Durable Objects entitlement issue (verify Durable Objects are enabled
  on the target Cloudflare account/plan).

## Runtime limitations

- **Durable Object state is in-memory only** (see `DATABASE.md`) — a
  Worker redeploy (`wrangler deploy` again, e.g. to ship a protocol
  change) will drop any currently-active rooms' state. There is no
  graceful migration path for in-progress matches across a redeploy.
- **No horizontal scaling concerns for the app** (fully static/client-side,
  Vercel handles this transparently) — the realtime backend's scaling
  characteristics are Cloudflare Durable Objects' standard per-room
  isolation model (see `ARCHITECTURE.md` → Scaling considerations).

## Rollback procedure

- **App (Vercel):** Standard Vercel deployment rollback (redeploy a
  previous build from the dashboard) — not tested in this project since
  nothing has been deployed yet, but this is Vercel's standard
  zero-extra-config behavior for any Next.js project.
- **Worker:** `wrangler deploy` has no built-in "rollback to previous
  version" command exposed via this project's npm scripts; the fallback
  is to `git checkout` the previous version of `party/server.ts` and
  `wrangler.jsonc` and redeploy. **Caution:** per `CLAUDE.md`'s "DO NOT
  CHANGE WITHOUT REVIEW," changing the Durable Object class name or
  removing a migration entry after a real deploy requires a new
  migration tag, not an edit — a naive rollback that also reverts
  `wrangler.jsonc`'s migrations array incorrectly could be rejected by
  Cloudflare once something has actually been deployed.

## Health checks

None configured (no custom health-check endpoint; the Worker's
fallback `fetch` handler response — see `API_REFERENCE.md` — could serve
as a trivial manual liveness check by curling the Worker's base URL, but
this isn't wired into any monitoring).

## Post-deployment verification checklist

1. Load the deployed app URL — confirm the main menu renders with no
   console errors. **Done 2026-08-06** — verified via a scripted
   Playwright pass against `https://buildstrike-arena.vercel.app`, zero
   console errors, correct custom icon/branding rendering.
2. Play a full Bot Duel match — confirm it works with zero backend
   dependency. **Not yet re-verified against the live URL** specifically
   (verified extensively against local dev this session — see
   `SESSION_LOG.md` — but not against the deployed app).
3. If the Worker is also deployed: confirm `NEXT_PUBLIC_PARTY_HOST`
   matches the deployed Worker's actual `*.workers.dev` host, then run
   through the Online 1v1 manual checklist in `TESTING.md` with two
   real browser sessions against the live URLs. **Partially done** — a
   single scripted client against the live app confirmed it connects to
   the deployed Worker (room created, status left "Connecting…" for
   "Waiting for opponent to join…"). A full two-client live-URL pass
   (create/join/combat/round/match/reconnect) has **not** been done yet.
4. Confirm `npx wrangler deploy --dry-run` still succeeds after any
   future change to `party/server.ts` or files it imports, **before**
   running a real `wrangler deploy`.
