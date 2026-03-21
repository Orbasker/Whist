#!/usr/bin/env bash
# Clean up workspace when archiving (stopping/shelving).
# Kills dev processes and optionally removes build artifacts to save disk space.
# Safe to run multiple times (idempotent).

set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Stopping dev processes ==="

# Kill backend (uvicorn)
if pgrep -f "uvicorn app.main:app" > /dev/null 2>&1; then
  echo "Stopping uvicorn..."
  pkill -f "uvicorn app.main:app" || true
else
  echo "No uvicorn process found"
fi

# Kill frontend (Angular ng serve)
if pgrep -f "ng serve" > /dev/null 2>&1; then
  echo "Stopping ng serve..."
  pkill -f "ng serve" || true
else
  echo "No ng serve process found"
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
