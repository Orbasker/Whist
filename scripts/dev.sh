#!/usr/bin/env bash
# Run backend (FastAPI) and client (Angular) together for local development.
# Backend: http://localhost:8000
# Client:  http://localhost:4200

set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKEND_PID=""
cleanup() {
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Stopping backend (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting backend (FastAPI) on http://localhost:8000 ..."
(cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

# Give backend a moment to bind
sleep 2

if [[ ! -d angular-web/node_modules ]]; then
  echo "Installing Angular client dependencies..."
  (cd angular-web && npm install)
fi
echo "Starting client (Angular) on http://localhost:4200 ..."
(cd angular-web && ./node_modules/.bin/ng serve)
