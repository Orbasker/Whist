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
if [ -d ".venv" ] && uv pip check --quiet 2>/dev/null; then
  echo "Backend deps already satisfied, skipping uv sync"
else
  uv sync --all-extras
fi

echo "=== Setting up frontend ==="
cd "$ROOT_DIR/angular-web"
if [ -d "node_modules" ] && [ -f "node_modules/.package-lock.json" ]; then
  echo "Frontend deps already installed, skipping npm ci"
else
  npm ci
fi

echo "=== Setting up Flutter ==="
cd "$ROOT_DIR/flutter_mobile"
if [ -d ".dart_tool" ] && [ -f ".dart_tool/package_config.json" ]; then
  echo "Flutter deps already installed, skipping flutter pub get"
else
  flutter pub get
fi

echo "=== Setup complete ==="
