#!/bin/sh
set -e

if [ "${SKIP_MIGRATIONS}" != "1" ]; then
  echo "[entrypoint] Running database migrations..."
  npx knex migrate:latest --knexfile db/knexfile.js
fi

echo "[entrypoint] Starting eggroll-pos on port ${PORT:-3000}..."
exec npx tsx ./bin/www
