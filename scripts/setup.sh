#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Copy .env files from main worktree
MAIN_PATH=$(git worktree list | awk '/\[main\]$/ { print $1; exit }')
if [ -n "$MAIN_PATH" ] && [ "$MAIN_PATH" != "$(pwd)" ]; then
  [ -f "$MAIN_PATH/backend/.env" ] && cp "$MAIN_PATH/backend/.env" backend/.env && echo "Copied backend/.env from main worktree"
  [ -f "$MAIN_PATH/backend/.env.prod" ] && cp "$MAIN_PATH/backend/.env.prod" backend/.env.prod && echo "Copied backend/.env.prod from main worktree"
fi

echo "=== Setting up backend ==="
cd backend
uv sync --all-extras

echo "=== Setting up frontend ==="
cd "$ROOT_DIR/angular-web"
npm ci

echo "=== Setup complete ==="
