#!/usr/bin/env bash
# One-shot local setup: env files → Postgres → Python venv → migrate → seed.
# Usage: from repo root:  npm run setup   OR   bash scripts/setup-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== Getto: local setup =="

if [[ ! -f api/.env ]]; then
  echo "Creating api/.env from env-example"
  cp env-example api/.env
else
  echo "api/.env already exists (leaving as-is)"
fi

# Next.js only needs NEXT_PUBLIC_* here (not DATABASE_URL / JWT — those go in api/.env)
if [[ ! -f web/.env.local ]] || [[ ! -s web/.env.local ]]; then
  echo "Creating web/.env.local (Next.js public env)"
  cat > web/.env.local << 'EOF'
# Next.js — only NEXT_PUBLIC_* is exposed to the browser
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
EOF
else
  echo "web/.env.local already exists (leaving as-is)"
fi

echo "Starting Postgres only (docker compose service: db)..."
echo "Tip: api/.env should use 127.0.0.1:5433 — Docker maps DB to host port 5433 so it does not clash with local Postgres on 5432."
docker compose up -d db

echo "Waiting for database to accept connections..."
for _ in $(seq 1 40); do
  if docker compose exec -T db pg_isready -U getto -d getto >/dev/null 2>&1; then
    echo "Postgres is ready."
    break
  fi
  sleep 1
done

if ! docker compose exec -T db pg_isready -U getto -d getto >/dev/null 2>&1; then
  echo "ERROR: Postgres did not become ready. Is Docker running?"
  exit 1
fi

cd api
if [[ ! -d .venv ]]; then
  echo "Creating Python virtualenv in api/.venv"
  python3 -m venv .venv
fi

echo "Installing Python dependencies..."
./.venv/bin/pip install -q -r requirements.txt

# Load api/.env and force IPv4 for host → Docker Postgres (avoids system Postgres on ::1)
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1090
  source .env
  set +a
fi
export DATABASE_URL="${DATABASE_URL//localhost/127.0.0.1}"

echo "Running database migrations..."
./.venv/bin/alembic upgrade head

echo "Seeding demo data..."
./.venv/bin/python -m scripts.seed

echo ""
echo "Done. Next (two terminals):"
echo "  Terminal 1:  npm run api:dev"
echo "  Terminal 2:  npm run web:install   # first time only"
echo "               npm run web:dev"
echo ""
echo "Then open http://localhost:3000 and sign in as admin@getto.demo / admin123"
