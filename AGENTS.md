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

### Routing

- The merchant dashboard route is `/merchant-dashboard/:uuid` (e.g. `/merchant-dashboard/a0000001-0001-0001-0001-000000000001`).
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

### Optional integrations

The contact form currently logs submissions to stdout; a database-backed admin UI is planned.
