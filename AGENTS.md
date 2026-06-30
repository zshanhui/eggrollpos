# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**eggroll-pos** is a self-hosted Restaurant POS and Online Ordering System with:
- **Express.js** backend (port 3000) in `src/server/` (plain JS, CommonJS)
- **React 16** frontend (port 3001 via Vite) in `src/client/` (TypeScript)
- **PostgreSQL** database via Knex.js (`db/` directory)
- Shared TypeScript modules in `src/shared/` used by both client and server

### Running the dev environment

See `README.md` for standard commands. Key scripts: `pnpm run dev`, `pnpm run build`, `pnpm test`, `pnpm run type-check`.

**Critical caveat**: The server-side JS uses `require()` to import TypeScript files from `src/shared/` (e.g., `require('../../shared/orders')`). Node.js cannot resolve `.ts` extensions for CJS require calls. You must run the Express server with `tsx` instead of `node`:

```bash
# Start servers separately:
NODE_ENV=development npx tsx ./bin/www   # Express on :3000
npx vite                                  # Vite on :3001
```

`pnpm run dev` uses `concurrently` to run both Vite and `nodemon --exec tsx`, which works correctly. You can also start servers separately as shown above.

**Important**: Never leave compiled `.js` files next to `.ts` files in `src/shared/`. Vite will serve the `.js` files (CJS format) instead of transforming the `.ts` files (ESM), causing the frontend to break silently (merchant page stuck on spinner).

### PostgreSQL setup

Two database options — set via `DB_CLIENT` env var:

- **PostgreSQL** (default): `docker compose up -d` then set `DB_PASSWORD=postgres`. Or use `./dev.sh`.
- **SQLite**: `DB_CLIENT=sqlite3` — creates `db/eggrollpos.db`, no Docker needed. Or use `./dev.sh --sqlite`.

Both use the same migrations/seeds: `npx knex migrate:latest --knexfile db/knexfile.js`. Config: `db/knexfile.js`.

**Seed file order** is alphabetical by filename. Categories must run after merchants — use `02z_menu_categories.js` (after `02_merchants.js`, before `03_menu_items.js`).

### Routing

- The merchant dashboard route is `/md/:hashId` (e.g. `/md/mc_n1c0ffee`). `/merchant-dashboard/:hashId` is an alias. UUIDs are not accepted in URLs.
- The online ordering route is `/online-ordering/:slug` (e.g. `/online-ordering/instep-cafe-new-york-10001-lunch-menu`).
- The `pnpm run type-check` has pre-existing TypeScript errors in the client code; the project compiles and runs fine via Vite regardless.

### pnpm build scripts

`esbuild` needs its postinstall script to run. The `pnpm.onlyBuiltDependencies` field in `package.json` allowlists it. If it's missing, add `"pnpm": {"onlyBuiltDependencies": ["esbuild"]}` to `package.json`.

### Merchant creation

Merchant accounts are **only** creatable via the admin script — not via UI or API:

```bash
pnpm run create-merchant "Business Name" [--address "addr"] [--postal-code 94105] [--description "desc"] [--type cafe]
```

### Seed data for testing

When using SQLite mode (`DB_CLIENT=sqlite3`), seed merchants have these UUIDs (see `README.md` for full list):
- Merchant 1 (INSTEP Cafe): UUID `a0000001-0001-0001-0001-000000000001`
- Merchant 2: UUID `a0000002-0002-0002-0002-000000000002`
- Published menu slug: `instep-cafe-new-york-10001-lunch-menu`

### WhatsApp Cloud API (platform wiring)

Webhook endpoint (mounted when `WHATSAPP_VERIFY_TOKEN` or `WHATSAPP_ENABLED` is set):

- `GET /api/webhooks/whatsapp` — Meta subscription verification (`hub.verify_token` must match `WHATSAPP_VERIFY_TOKEN`)
- `POST /api/webhooks/whatsapp` — Ingest events when `WHATSAPP_ENABLED=true` and `WHATSAPP_APP_SECRET` is set; verifies `X-Hub-Signature-256`, returns 200 immediately, persists to `whatsapp_message_log`
- TypeScript: `src/server/routes/whatsapp_webhook.ts`, `src/server/services/whatsapp/`, `src/server/models/whatsapp_message_log.ts`, `src/shared/whatsapp.ts`

Copy `.env.example` for variable names. Local testing requires an HTTPS tunnel (ngrok, Cloudflare) pointing at port 3000. See `docs/whatsapp-integration.md`.

### Post-deploy smoke test (Railway staging)

Before pushing a new build to `staging`, bump the deploy version:

```bash
pnpm run version:bump
```

This increments `package.json` version by **0.1.0** (e.g. `0.1.0` → `0.2.0`). The version appears in the home page footer. Commit the bump, push to `staging`, then run smoke tests after deploy:

```bash
pnpm run smoke:staging
```

This waits **120 seconds** for Railway to finish deploying before running checks. Skip the wait when re-testing an already-live deploy:

```bash
SMOKE_WAIT_SECONDS=0 pnpm run smoke:staging
```

Optional env for full route coverage (see `.env.staging.example`):

```bash
STAGING_MERCHANT_KEY=mc_... STAGING_MENU_SLUG=... pnpm run smoke:staging
```

The script checks `/health`, SPA pages (`/`, `/about`), Vite JS bundle MIME types, and (when env is set) merchant dashboard, online ordering, and receipt routes. Do not mark a deploy complete if smoke tests fail.

- Script: `scripts/smoke-test-deploy.js`
- Cursor skill: `.cursor/skills/post-deploy-smoke-test/SKILL.md`
- Cursor rule: `.cursor/rules/post-deploy-smoke-test.mdc`

Staging uses the same auto-seed on first deploy as Railway. After seeding, demo routes work:

- Merchant: `mc_n1c0ffee` or `a0000001-0001-0001-0001-000000000001` (INSTEP Cafe)
- Menu slug: `instep-cafe-new-york-10001-lunch-menu`

Set `STAGING_MERCHANT_KEY` and `STAGING_MENU_SLUG` in `.env.staging.example` for full smoke test coverage.

### Pull request merge policy (Cloud Agent)

**Auto-merge only PRs from the current session** — the branch you just created for the task at hand.

- New pull requests should target `staging` by default. Use another base branch only when the user explicitly asks.
- When the user asks to merge/deploy, merge **that PR only** (`gh pr ready <n> && gh pr merge <n> --merge --delete-branch`).
- **Do not** batch-merge other open/stale PRs unless the user explicitly lists them by number.
- If a PR has merge conflicts, stop and report — do not force-merge or revert other work to land it.
- After merge to `staging`, push is enough for Railway auto-deploy; run `pnpm run smoke:staging` when the user asks to redeploy.
- If the user says to abort previous merges, revert only the commits they mean — confirm which PR numbers if unclear.

### Git commit author policy

All commits on this project must be attributed **only** to Cursor Agent.

**Git identity** (per repository):

```bash
git config user.name "Cursor Agent"
git config user.email "cursor-agent@local"
```

**Commit message footer** — every commit must end with this exact line:

```
Authored by Cursor Agent
```

Do not add `Co-authored-by:` or any other author names. Optional commit template: `.gitmessage` (`git config commit.template .gitmessage`).

Enable the repo hook (strips injected co-author trailers, appends footer if missing):

```bash
git config core.hooksPath .githooks
```

Cursor rule: `.cursor/rules/git-commit-author.mdc`

### Optional integrations

The contact form currently logs submissions to stdout; a database-backed admin UI is planned.
