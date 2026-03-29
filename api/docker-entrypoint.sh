#!/bin/sh
set -e
cd /app
echo "[api] Running database migrations..."
alembic upgrade head
echo "[api] Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
