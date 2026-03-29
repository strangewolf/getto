#!/usr/bin/env bash
# Removes the Postgres Docker volume and recreates the stack so POSTGRES_DB=getto is applied fresh.
# WARNING: deletes all local DB data for this project.
# Usage (from repo root):  bash scripts/reset-postgres-volume.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "This will delete the Docker volume getto_pgdata and recreate Postgres."
read -r -p "Continue? [y/N] " ans
[[ "${ans:-}" =~ ^[yY]$ ]] || exit 0

docker compose down -v
docker compose up -d db
echo "Waiting for Postgres..."
for _ in $(seq 1 40); do
  if docker compose exec -T db pg_isready -U getto -d getto >/dev/null 2>&1; then
    echo "Done. Database 'getto' is ready (fresh volume)."
    exit 0
  fi
  sleep 1
done
echo "Postgres did not become ready in time. Check Docker Desktop."
exit 1
