#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [[ -x "$ROOT/.venv/bin/gunicorn" ]]; then
  GUNICORN="$ROOT/.venv/bin/gunicorn"
elif command -v gunicorn >/dev/null 2>&1; then
  GUNICORN="$(command -v gunicorn)"
else
  echo "gunicorn not found. From apps/api run:" >&2
  echo "  python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
WORKERS="${WEB_CONCURRENCY:-${WORKERS:-2}}"
TIMEOUT="${TIMEOUT:-120}"

exec "$GUNICORN" app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind "${HOST}:${PORT}" \
  --workers "$WORKERS" \
  --timeout "$TIMEOUT" \
  --access-logfile - \
  --error-logfile -
