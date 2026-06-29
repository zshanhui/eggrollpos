# Deployment Guide

Deploy **eggroll-pos** with Docker to any managed cloud (Railway, Render, Fly.io, AWS ECS, etc.) or self-host with Docker Compose.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│  eggroll-pos     │────▶│ PostgreSQL  │
│             │     │  (Express :3000) │     │             │
└─────────────┘     │  + React /dist   │     └─────────────┘
                    └──────────────────┘
```

One container runs the Express API and serves the built React frontend from `dist/`. PostgreSQL is required in production (`DATABASE_URL`).

---

## Quick start (Docker Compose)

Self-host app + database on a single machine:

```bash
# 1. Set a strong database password
export DB_PASSWORD='change-me-to-a-strong-password'

# 2. Build and start
docker compose -f docker-compose.prod.yml up -d --build

# 3. Create your first merchant (run inside the app container)
docker compose -f docker-compose.prod.yml exec app \
  pnpm run create-merchant "My Restaurant" --address "123 Main St"
```

Open `http://localhost:3000`. Migrations run automatically on container start.

Stop everything:

```bash
docker compose -f docker-compose.prod.yml down
```

Persisted Postgres data lives in the `pgdata` Docker volume.

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | yes | — | Set to `production` |
| `PORT` | no | `3000` | HTTP port (cloud platforms inject this) |
| `DATABASE_URL` | yes | — | Postgres connection string (Neon, Supabase, Railway Postgres, etc.) |
| `DATABASE_SSL` | no | auto | Set to `true` to force SSL; `false` to disable. Auto-enabled for Neon/Supabase URLs and `sslmode=require`. |
| `PUBLIC_BASE_URL` | recommended | — | Public app URL for dashboard links and WhatsApp templates |
| `SKIP_MIGRATIONS` | no | — | Set to `1` to skip auto-migrate on start (use with a separate release/migrate step) |
| `SKIP_SEED` | no | — | Set to `1` to skip auto-seed on empty DB |

**Production `DATABASE_URL` format:**

```
postgres://USER:PASSWORD@HOST:5432/eggrollpos
```

On **first deploy** (empty `merchants` table), the container entrypoint runs development seeds automatically — same demo merchants and menus as local `./dev.sh`. After that, seeds are skipped so existing data is never wiped. Set `SKIP_SEED=1` to disable. Do **not** run `pnpm run db:seed` manually on a populated production database (the cleanup seed deletes all rows first).

### Neon or Supabase

1. Create a PostgreSQL database in [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the **connection string** (pooler URL is fine for this app).
3. Set `DATABASE_URL` on Railway to that value. SSL is enabled automatically for Neon/Supabase hosts.
4. Optional: set `PUBLIC_BASE_URL` to your Railway app URL after the first deploy.

---

## Railway

[Railway](https://railway.app) works well with the included `Dockerfile`.

### 1. Create project

1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo**.
3. Railway detects the `Dockerfile` automatically.

### 2. Add PostgreSQL

1. **Add service → Database → PostgreSQL**.
2. Railway sets `DATABASE_URL` on linked services. Attach Postgres to the app service (Variables → reference `${{Postgres.DATABASE_URL}}` if needed).

### 3. Configure the app service

| Setting | Value |
|---------|-------|
| **Builder** | Dockerfile |
| **Start command** | (default — uses `ENTRYPOINT`) |
| **Release command** | `npx knex migrate:latest --knexfile db/knexfile.js` |
| **Health check path** | `/health` |

If you use a **release command** for migrations, set on the app service:

```
SKIP_MIGRATIONS=1
```

Otherwise migrations run on every container start via `scripts/docker-entrypoint.sh` (also fine for Railway).

On first start with an empty database, seeds run automatically (see `scripts/seed-if-empty.js`). If a deploy finds demo merchant `mc_n1c0ffee` but **no menu items** (common when an earlier seed failed on PostgreSQL), seeds run again to repair demo data.

### 4. Deploy

Railway assigns a public URL. Custom domains: **Settings → Networking → Custom Domain**.

### 5. Create additional merchants (optional)

Demo seed data is loaded on first deploy. For a real merchant, use Railway’s **Shell** (or a one-off job):

```bash
pnpm run create-merchant "Business Name" --address "123 Main St"
```

---

## Render

1. **New → Web Service** from your repo.
2. **Environment:** Docker.
3. Add a **PostgreSQL** database; copy its **Internal Database URL** to `DATABASE_URL`.
4. **Health Check Path:** `/health`.
5. Optional **Pre-Deploy Command:** `npx knex migrate:latest --knexfile db/knexfile.js` and set `SKIP_MIGRATIONS=1`.

---

## Fly.io

```bash
fly launch --no-deploy
fly postgres create
fly postgres attach <postgres-app-name>
fly secrets set NODE_ENV=production
fly deploy
```

Run migrations once:

```bash
fly ssh console -C "npx knex migrate:latest --knexfile db/knexfile.js"
```

---

## Build the image locally

```bash
docker build -t eggroll-pos .
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/eggrollpos \
  eggroll-pos
```

On Linux, replace `host.docker.internal` with your host IP or run Postgres in Compose.

---

## Operations

### Migrations

```bash
npx knex migrate:latest --knexfile db/knexfile.js
```

Runs automatically on container start unless `SKIP_MIGRATIONS=1`.

### Create merchant accounts

Merchants are created only via the admin script:

```bash
pnpm run create-merchant "Business Name" [--address "..."] [--postal-code 94105] [--type cafe]
```

### Backups

Back up PostgreSQL regularly (platform snapshots or `pg_dump`). The app stores no local file state in production.

### Health check

```
GET /health
→ 200 { "status": "ok" }        (database reachable)
→ 503 { "status": "error", ... }  (database down)
```

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Container exits immediately | Missing or invalid `DATABASE_URL` |
| 503 on `/health` | Postgres not reachable or migrations failed |
| Blank page / spinner | Frontend not built; ensure `pnpm run build` ran in Docker build stage |
| `Cannot find module` on start | Server must run with `tsx` (handled by Dockerfile entrypoint) |

For local development, continue using `./dev.sh` — see [README.md](README.md).
