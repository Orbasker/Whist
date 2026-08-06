set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/scoreboard"

if [ ! -d node_modules ]; then
  echo "Installing web dependencies..."
  npm install
fi

if [ ! -f .env.local ]; then
  echo "⚠️  scoreboard/.env.local not found — the app will boot but AI + MongoDB calls will fail."
  echo "   Copy .env.local.example to .env.local and set AI_GATEWAY_API_KEY and MONGODB_URI."
fi

# Conductor allocates a unique port per local workspace so parallel workspaces
# don't collide; fall back to 3000 (e.g. cloud, where CONDUCTOR_PORT is unset).
PORT="${CONDUCTOR_PORT:-3000}"
echo "Starting Scoreboard (Next.js) on http://localhost:$PORT ..."
npm run dev -- --port "$PORT"
