# Post-deploy smoke test

Run after every Railway deploy to **staging** (or production) to confirm the app is serving pages and assets correctly.

## Default staging URL

https://eggrollpos-staging.up.railway.app/

## When to run

- After merging to `main` and Railway finishes deploy
- After changing frontend build, EJS shell, Dockerfile, or static asset paths
- After database migrations on staging
- When debugging blank pages or MIME type errors in the browser

## Before deploy

Bump the visible deploy version (home page footer):

```bash
pnpm run version:bump
```

Increments `package.json` by **0.1.0** (e.g. `0.1.0` → `0.2.0`). Commit the change with your deploy.

## Command

```bash
pnpm run smoke:staging
```

Or with explicit env:

```bash
BASE_URL=https://eggrollpos-staging.up.railway.app \
STAGING_MERCHANT_KEY=mc_your_hash \
STAGING_MENU_SLUG=your-published-menu-slug \
node scripts/smoke-test-deploy.js
```

## What it checks

Always (no extra env):

| Check | Expect |
|-------|--------|
| `GET /health` | `200`, `{ "status": "ok" }` |
| `GET /` | `200`, `#app-root`, page title `eggroll pos demo` |
| `GET /about` | `200`, `#app-root` |
| Vite JS bundle | `200`, **not** `text/html` (catches broken asset paths) |

With `STAGING_MERCHANT_KEY` (hash_id **or** UUID):

| Check |
|-------|
| `GET /api/merchants/:key` |
| `/merchant-dashboard/:key` |
| `/merchant-dashboard/:key/menuitems` |
| `/merchant-dashboard/:key/settings` |
| `/merchant-dashboard/:key/online-menus` |

With `STAGING_MENU_SLUG`:

| Check |
|-------|
| `GET /api/menus/:slug` |
| `/online-ordering/:slug` |
| `/online-ordering/:slug/checkout` |

With `STAGING_RECEIPT_UUID`:

| Check |
|-------|
| `/receipts/:uuid` |
| `GET /r/:uuid` |

## Agent workflow after deploy

1. After pushing to `main`, wait **at least 120 seconds** for Railway to fully deploy (built into `pnpm run smoke:staging`).
2. Run `pnpm run smoke:staging` with staging env vars set if available.
3. To skip the wait (e.g. re-checking an already-live deploy): `SMOKE_WAIT_SECONDS=0 pnpm run smoke:staging`
4. If failures mention **HTML MIME type for JS** or **missing #app-root**, inspect `src/server/views/index.ejs` and Vite manifest wiring (`src/server/lib/viteAssets.js`).
5. If merchant routes fail with 404, confirm auto-seed ran (empty DB on first deploy). Demo keys: `mc_n1c0ffee`, menu slug `instep-cafe-new-york-10001-lunch-menu`. If seeds were skipped (`SKIP_SEED=1`) or DB was cleared, use `pnpm run create-merchant` on staging.
6. Report pass/fail summary to the user; do not mark deploy complete if smoke test fails.

## Railway env suggestion

Set on the **staging** service (for smoke tests run from CI or local):

```
STAGING_MERCHANT_KEY=<hash_id from create-merchant>
STAGING_MENU_SLUG=<published menu slug>
```

## Exit codes

- `0` — all executed checks passed
- `1` — one or more checks failed
