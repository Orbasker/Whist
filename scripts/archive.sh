#!/usr/bin/env bash
# Clean up workspace when archiving (stopping/shelving).
# Kills dev processes and optionally removes build artifacts to save disk space.
# Safe to run multiple times (idempotent).

set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Stopping dev processes ==="

# Kill backend (uvicorn) scoped to this workspace
UVICORN_PIDS=$(pgrep -f "uvicorn.*$ROOT_DIR" 2>/dev/null || true)
if [ -n "$UVICORN_PIDS" ]; then
  echo "Stopping uvicorn (PIDs: $UVICORN_PIDS)..."
  echo "$UVICORN_PIDS" | xargs kill 2>/dev/null || true
else
  echo "No uvicorn process found for this workspace"
fi

# Kill frontend (Angular ng serve) scoped to this workspace
NG_PIDS=$(pgrep -f "ng serve.*$ROOT_DIR" 2>/dev/null || true)
if [ -z "$NG_PIDS" ]; then
  # Also check for ng serve started from within the workspace dir
  NG_PIDS=$(lsof -ti :4200 2>/dev/null || true)
fi
if [ -n "$NG_PIDS" ]; then
  echo "Stopping ng serve (PIDs: $NG_PIDS)..."
  echo "$NG_PIDS" | xargs kill 2>/dev/null || true
else
  echo "No ng serve process found for this workspace"
fi

echo "=== Cleaning build artifacts ==="

# Remove Angular build output
if [ -d "angular-web/.angular" ]; then
  echo "Removing angular-web/.angular cache..."
  rm -rf angular-web/.angular
fi

if [ -d "angular-web/dist" ]; then
  echo "Removing angular-web/dist..."
  rm -rf angular-web/dist
fi

# Remove Python bytecode caches
find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
echo "Cleaned Python __pycache__ directories"

echo "=== Archive complete ==="
