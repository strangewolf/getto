#!/usr/bin/env bash
# Creates the "getto" database inside the Compose Postgres container if it is missing.
# Usage (from repo root):  bash scripts/create-getto-database.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Starting Postgres container (if needed)..."
docker compose up -d db

echo "Waiting for Postgres..."
for _ in $(seq 1 40); do
  if docker compose exec -T db pg_isready -U getto -d postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Ensuring database 'getto' exists..."
EXISTS=$(docker compose exec -T db psql -U getto -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'getto'" || echo "")
if [[ "$EXISTS" == "1" ]]; then
  echo "Database 'getto' already exists."
else
  docker compose exec -T db psql -U getto -d postgres -c "CREATE DATABASE getto OWNER getto;"
  echo "Database 'getto' created."
fi
