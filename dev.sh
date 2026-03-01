#!/usr/bin/env bash
set -e

# ─── eggroll-pos development launcher ───
# Usage:
#   ./dev.sh            # PostgreSQL via Docker (default)
#   ./dev.sh --sqlite   # SQLite, no Docker required

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${CYAN}[dev]${NC} $1"; }
ok()   { echo -e "${GREEN}[dev] ✓${NC} $1"; }
warn() { echo -e "${YELLOW}[dev] !${NC} $1"; }
err()  { echo -e "${RED}[dev] ✗${NC} $1"; }

USE_SQLITE=false
if [ "$1" = "--sqlite" ]; then
  USE_SQLITE=true
fi

cleanup() {
  log "Shutting down..."
  kill $EXPRESS_PID $VITE_PID 2>/dev/null || true
  wait $EXPRESS_PID $VITE_PID 2>/dev/null || true
  if [ "$USE_SQLITE" = true ]; then
    log "Done. SQLite database is at db/eggrollpos.db"
  else
    log "Done. Docker Postgres is still running — stop with: docker compose down"
  fi
}
trap cleanup EXIT INT TERM

# ─── 1. Check prerequisites ───

if ! command -v pnpm &>/dev/null; then
  err "pnpm is not installed. Install it with: npm install -g pnpm"
  exit 1
fi

if [ "$USE_SQLITE" = false ] && ! command -v docker &>/dev/null; then
  warn "Docker not found. Falling back to SQLite mode."
  USE_SQLITE=true
fi

# ─── 2. Install dependencies ───

if [ ! -d node_modules ]; then
  log "Installing dependencies..."
  pnpm install
  ok "Dependencies installed"
else
  log "node_modules exists, skipping install (run 'pnpm install' manually if needed)"
fi

# ─── 3. Database setup ───

if [ "$USE_SQLITE" = true ]; then
  export DB_CLIENT=sqlite3
  log "Using SQLite (db/eggrollpos.db)"
else
  log "Starting PostgreSQL..."
  docker compose up -d --wait postgres 2>/dev/null || docker-compose up -d postgres 2>/dev/null

  for i in {1..20}; do
    if docker compose exec -T postgres pg_isready -U postgres &>/dev/null; then
      ok "PostgreSQL is ready on port 5432"
      break
    fi
    if [ $i -eq 20 ]; then
      err "PostgreSQL failed to start"
      exit 1
    fi
    sleep 1
  done

  export DB_PASSWORD=postgres
fi

# ─── 4. Run migrations ───

log "Running database migrations..."
npx knex migrate:latest --knexfile db/knexfile.js 2>&1 | tail -1
ok "Migrations complete"

# ─── 5. Seed data (only if tables are empty) ───

if [ "$USE_SQLITE" = true ]; then
  ROW_COUNT=$(node -e "
    const knex = require('./db/knex');
    knex('merchants').count('* as c').first().then(r => {
      console.log(r.c);
      knex.destroy();
    }).catch(() => { console.log('0'); knex.destroy(); });
  " 2>/dev/null || echo "0")
else
  ROW_COUNT=$(docker compose exec -T postgres psql -U postgres -d eggrollpos -tAc "SELECT count(*) FROM merchants" 2>/dev/null || echo "0")
fi

if [ "$ROW_COUNT" = "0" ] || [ "$ROW_COUNT" = "" ]; then
  log "Seeding development data..."
  npx knex seed:run --knexfile db/knexfile.js 2>&1 | tail -1
  ok "Seed data loaded"
else
  log "Database already has data, skipping seeds"
fi

# ─── 6. Start Express backend ───

log "Starting Express API server on port 3000..."
if [ "$USE_SQLITE" = true ]; then
  NODE_ENV=development DB_CLIENT=sqlite3 npx tsx ./bin/www &
else
  NODE_ENV=development DB_PASSWORD=postgres npx tsx ./bin/www &
fi
EXPRESS_PID=$!

# ─── 7. Start Vite dev server ───

log "Starting Vite dev server on port 3001..."
npx vite &
VITE_PID=$!

# ─── 8. Wait for servers ───

sleep 3
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  eggroll-pos is running!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Frontend:  ${CYAN}http://localhost:3001${NC}"
echo -e "  API:       ${CYAN}http://localhost:3000${NC}"
echo -e "  Merchant:  ${CYAN}http://localhost:3001/merchant${NC}"
if [ "$USE_SQLITE" = true ]; then
  echo -e "  Database:  ${CYAN}SQLite → db/eggrollpos.db${NC}"
else
  echo -e "  Database:  ${CYAN}postgres://postgres:postgres@localhost:5432/eggrollpos${NC}"
fi
echo ""
echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop dev servers."
echo ""

wait
