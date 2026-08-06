# Scoreboard

A general scoreboard web app: describe any game in plain language, then score
turns by chatting instead of filling forms. An LLM reads the rules and turns each
chat message into per-player score changes.

The app lives in [`scoreboard/`](./scoreboard) (Next.js). See its
[README](./scoreboard/README.md) for architecture and setup.

```bash
cd scoreboard
cp .env.local.example .env.local   # set AI_GATEWAY_API_KEY
npm install
npm run dev                        # http://localhost:3000
```

> Spun off from a Whist-specific scoring app. The old Angular/FastAPI/Flutter
> implementation has been removed; this repo is now the single Next.js app.
