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

Do NOT use `pnpm run dev` directly (it uses `nodemon` which invokes `node`, not `tsx`). If you need file watching, use `nodemon --exec tsx ./bin/www`.

**Important**: Never leave compiled `.js` files next to `.ts` files in `src/shared/`. Vite will serve the `.js` files (CJS format) instead of transforming the `.ts` files (ESM), causing the frontend to break silently (merchant page stuck on spinner).

### PostgreSQL setup

- Database: `eggrollpos`, user: `postgres`, no password, host: `127.0.0.1`
- Config: `db/knexfile.js`
- Start PostgreSQL: `sudo pg_ctlcluster 16 main start`
- Auth must be set to `trust` in `pg_hba.conf` (the knexfile uses empty password)
- Run migrations: `npx knex migrate:latest --knexfile db/knexfile.js`
- Run seeds: `npx knex seed:run --knexfile db/knexfile.js`

### Routing

- The merchant dashboard route is `/merchant` (exact match, not `/merchant/:id`). The component hardcodes `merchant_id = 3`.
- The `pnpm run type-check` has pre-existing TypeScript errors in the client code; the project compiles and runs fine via Vite regardless.

### pnpm build scripts

`esbuild` needs its postinstall script to run. The `pnpm.onlyBuiltDependencies` field in `package.json` allowlists it. If it's missing, add `"pnpm": {"onlyBuiltDependencies": ["esbuild"]}` to `package.json`.

### Optional integrations

Airtable and Zomato are optional. The app starts and runs fine without their env vars set. If `AIRTABLE_API_KEY` is missing, the lead-capture form silently no-ops.
