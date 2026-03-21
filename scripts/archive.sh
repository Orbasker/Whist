#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Running pre-commit ==="
pre-commit run --all-files

echo "=== Pre-commit passed; safe to commit ==="
