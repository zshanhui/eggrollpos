#!/usr/bin/env bash
set -e

# ─── eggroll-pos development launcher ───
# Starts PostgreSQL (Docker), runs migrations/seeds, and launches dev servers.

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${CYAN}[dev]${NC} $1"; }
ok()   { echo -e "${GREEN}[dev] ✓${NC} $1"; }
warn() { echo -e "${YELLOW}[dev] !${NC} $1"; }
err()  { echo -e "${RED}[dev] ✗${NC} $1"; }

cleanup() {
  log "Shutting down..."
  kill $EXPRESS_PID $VITE_PID 2>/dev/null || true
  wait $EXPRESS_PID $VITE_PID 2>/dev/null || true
  log "Done. Docker Postgres is still running — stop with: docker compose down"
}
trap cleanup EXIT INT TERM

# ─── 1. Check prerequisites ───

if ! command -v docker &>/dev/null; then
  err "Docker is not installed. Install it from https://docs.docker.com/get-docker/"
  exit 1
fi

if ! command -v pnpm &>/dev/null; then
  err "pnpm is not installed. Install it with: npm install -g pnpm"
  exit 1
fi

# ─── 2. Install dependencies ───

if [ ! -d node_modules ]; then
  log "Installing dependencies..."
  pnpm install
  ok "Dependencies installed"
else
  log "node_modules exists, skipping install (run 'pnpm install' manually if needed)"
fi

# ─── 3. Start PostgreSQL via Docker ───

log "Starting PostgreSQL..."
docker compose up -d --wait postgres 2>/dev/null || docker-compose up -d postgres 2>/dev/null

# Wait for healthy
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

# ─── 4. Run migrations ───

export DB_PASSWORD=postgres

log "Running database migrations..."
npx knex migrate:latest --knexfile db/knexfile.js 2>&1 | tail -1
ok "Migrations complete"

# ─── 5. Seed data (only if tables are empty) ───

ROW_COUNT=$(docker compose exec -T postgres psql -U postgres -d eggrollpos -tAc "SELECT count(*) FROM merchants" 2>/dev/null || echo "0")
if [ "$ROW_COUNT" = "0" ] || [ "$ROW_COUNT" = "" ]; then
  log "Seeding development data..."
  npx knex seed:run --knexfile db/knexfile.js 2>&1 | tail -1
  ok "Seed data loaded"
else
  log "Database already has data, skipping seeds"
fi

# ─── 6. Start Express backend ───

log "Starting Express API server on port 3000..."
NODE_ENV=development DB_PASSWORD=postgres npx tsx ./bin/www &
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
echo -e "  Database:  ${CYAN}postgres://postgres:postgres@localhost:5432/eggrollpos${NC}"
echo ""
echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop dev servers."
echo ""

wait
