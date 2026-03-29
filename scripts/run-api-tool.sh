#!/usr/bin/env bash
# Run a command from api/.venv with api/.env loaded and DATABASE_URL using 127.0.0.1 instead of localhost
# (so host tools talk to Docker Postgres on IPv4, not system Postgres on ::1).
# Usage: bash scripts/run-api-tool.sh alembic upgrade head
#        bash scripts/run-api-tool.sh python -m scripts.seed
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/api"
set -a
[[ -f .env ]] && . .env
set +a
export DATABASE_URL="${DATABASE_URL//localhost/127.0.0.1}"
exec ./.venv/bin/"$1" "${@:2}"
