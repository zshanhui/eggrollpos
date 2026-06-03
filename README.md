# eggroll-pos

A free, self-hosted restaurant POS (Point-of-Sale) and online ordering system. Restaurant margins are slim enough already — eggroll-pos gives you a complete ordering and kitchen management solution without paying a dime to SaaS platforms. Self-host it, own your customer data, and market however you see fit.

## Features

- **Merchant Dashboard** — Accept, prepare, and fulfill incoming orders in real time
- **Online Menu & Ordering** — Customers browse menus and place orders from a web view
- **Receipt System** — Auto-generated receipts with line items, tax, and totals
- **Contact/Lead Form** — Capture beta signup leads

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 16, React Router v5, React Bootstrap |
| Backend | Express.js 4 (Node.js) |
| Database | PostgreSQL or SQLite with Knex.js query builder |
| Build Tool | Vite 7 with TypeScript |
| Dev Tools | tsx, nodemon, concurrently |

## Prerequisites

- **Node.js** >= 22.14.0
- **pnpm** (pinned to 10.17.0 via `packageManager` field)
- **Docker** (optional — needed for PostgreSQL mode)

## Admin: Create Merchant Accounts

Merchant accounts can **only** be created via the admin script — not via UI or API:

```bash
pnpm run create-merchant "Business Name" [--address "123 Main St"] [--postal-code 94105] [--description "desc"] [--type cafe]
```

The script outputs the new merchant's UUID and dashboard URL.

## Quick Start

One command starts everything — database, migrations, seeds, and both dev servers:

```bash
git clone <repo-url>
cd eggroll-pos
pnpm install
./dev.sh              # PostgreSQL via Docker (default)
./dev.sh --sqlite     # SQLite, no Docker required
```

That's it. Open [http://localhost:3001](http://localhost:3001) in your browser.

If Docker is not installed, the script automatically falls back to SQLite.

The script will:
1. Start the database (Docker PostgreSQL or local SQLite file at `db/eggrollpos.db`)
2. Run database migrations and seed data
3. Start the Express API server (port 3000)
4. Start the Vite dev server with HMR (port 3001)

Press `Ctrl+C` to stop the dev servers. If using Docker, PostgreSQL keeps running — stop it with `docker compose down`.

## Manual Setup (without dev.sh)

If you prefer to run things separately:

### 1. Start the database

**Option A — PostgreSQL via Docker:**

```bash
docker compose up -d
```

| Setting | Value |
|---------|-------|
| Host | `127.0.0.1:5432` |
| Database | `eggrollpos` |
| User / Password | `postgres` / `postgres` |

Override with env vars: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

**Option B — SQLite (no Docker):**

```bash
export DB_CLIENT=sqlite3
```

This creates `db/eggrollpos.db` automatically. No separate database server needed.

### 2. Run migrations and seeds

```bash
npx knex migrate:latest --knexfile db/knexfile.js
npx knex seed:run --knexfile db/knexfile.js
```

### 3. Start the dev servers

| Server | Port | Purpose |
|--------|------|---------|
| Express API | 3000 | REST API, SSR views |
| Vite Dev Server | 3001 | React frontend with HMR |

```bash
# Terminal 1: Express backend
NODE_ENV=development npx tsx ./bin/www

# Terminal 2: Vite frontend
npx vite
```

> **Why `tsx`?** The server-side JavaScript uses `require()` to import shared TypeScript modules from `src/shared/`. Plain `node` cannot resolve `.ts` extensions for CJS require calls, so `tsx` is needed to bridge this gap.

Open [http://localhost:3001](http://localhost:3001) in your browser.

### 5. Explore the app

| URL | Page |
|-----|------|
| `/` | Homepage with beta signup form |
| `/about` | About page |
| `/merchant/:uuid` | Merchant POS dashboard (UUID identifies the merchant) |
| `/order-online/:merchantId` | Public ordering menu for a specific merchant |
| `/orders/:orderUuid/menus` | Customer menu ordering view for an existing order |
| `/receipts/:id` | Receipt view |

Seed merchant UUIDs for local development:

| Merchant | UUID | Dashboard URL |
|----------|------|---------------|
| Alice Merchant 1 | `mc000001-0001-0001-0001-000000000001` | `/merchant/mc000001-0001-0001-0001-000000000001` |
| Alice Merchant 2 | `mc000002-0002-0002-0002-000000000002` | `/merchant/mc000002-0002-0002-0002-000000000002` |
| Alice Merchant 3 | `mc000003-0003-0003-0003-000000000003` | `/merchant/mc000003-0003-0003-0003-000000000003` |

## Available Scripts

```bash
pnpm run dev          # Start Vite + Express concurrently
pnpm run build        # Production build (Vite)
pnpm run build:server # Compile server-side TypeScript
pnpm run build:all    # Build both client and server
pnpm run type-check   # TypeScript type checking (has pre-existing errors)
pnpm run preview      # Preview production build locally
pnpm test             # Run mocha tests
```

## Project Structure

```
├── dev.sh                   # One-command dev launcher script
├── docker-compose.yml       # PostgreSQL Docker setup
├── bin/www                  # Express HTTP server entry point
├── index.html               # Vite entry HTML (development)
├── db/
│   ├── knexfile.js          # Database connection config
│   ├── knex.js              # Knex instance
│   ├── migrations/          # Database schema migrations
│   └── seeds/               # Development seed data
├── src/
│   ├── client/              # React frontend (TypeScript)
│   │   ├── js/
│   │   │   ├── index.tsx    # React entry point
│   │   │   ├── App.tsx      # Router and page layout
│   │   │   ├── api/         # API client functions
│   │   │   ├── components/  # Reusable components (ContactForm, Spinner, Lazy)
│   │   │   └── pages/       # Page components (HomeLanding, MerchantRoutes, Menus, Receipts)
│   │   ├── css/             # Stylesheets
│   │   └── assets/          # Static images
│   ├── server/              # Express backend (JavaScript)
│   │   ├── index.js         # Express app setup and routes
│   │   ├── constants.js     # App constants (tax rates, config)
│   │   ├── routes/          # API route handlers
│   │   ├── models/          # Database models (Orders, Customers, Merchants, etc.)
│   │   ├── services/        # Business logic (Actions)
│   │   └── views/           # EJS templates (SSR fallback)
│   ├── shared/              # Shared TypeScript modules (order statuses, payment types)
│   └── types/               # Global TypeScript type definitions
├── specs/                   # Mocha test specs
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config (client)
└── tsconfig.server.json     # TypeScript config (server)
```

## Environment Variables

Create a `.env` file in the project root for optional integrations:

```env
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL (dev defaults work with docker-compose.yml)
DB_HOST=127.0.0.1
DB_NAME=eggrollpos
DB_USER=postgres
DB_PASSWORD=postgres

# PostgreSQL (production — overrides above)
DATABASE_URL=postgres://user:pass@host:5432/eggrollpos
```

## API Endpoints

See [docs/routes.md](docs/routes.md) for the full API reference, including request/response schemas and client routes.

## Database Migrations

```bash
# Run all pending migrations
npx knex migrate:latest --knexfile db/knexfile.js

# Roll back the last batch
npx knex migrate:rollback --knexfile db/knexfile.js

# Run seeds (development data)
npx knex seed:run --knexfile db/knexfile.js
```

## Production Build

```bash
pnpm run build        # Builds client assets to dist/
pnpm run start        # Starts Express in production mode (uses tsx)
```

In production, the Express server serves the built static assets from `/dist`.

## Deployment

See **[DEPLOY.md](DEPLOY.md)** for Docker, Railway, Render, Fly.io, and self-hosted Docker Compose instructions.

## License

Open source — free for restaurants to self-host and customize.
