#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/scoreboard"

MAIN_PATH=$(git worktree list | awk '/\[main\]$/ { print $1; exit }')
if [ -n "$MAIN_PATH" ] && [ "$MAIN_PATH" != "$ROOT_DIR" ] && [ -f "$MAIN_PATH/scoreboard/.env.local" ]; then
  cp "$MAIN_PATH/scoreboard/.env.local" .env.local && echo "Copied scoreboard/.env.local from main worktree"
fi

echo "=== Installing web dependencies ==="
if [ -d "node_modules" ] && [ -f "node_modules/.package-lock.json" ]; then
  echo "Deps already installed, skipping npm ci"
else
  npm ci
fi

echo "=== Setup complete ==="
