# Scoreboard

A **general scoreboard** — describe any game in plain language, then score turns by
chatting instead of filling forms. An LLM reads your rules and interprets each
chat message into per-player score changes.

Spun off from the Whist scoring app: the platform (games, players, rounds, live
standings) is kept, but the hardcoded Whist rule engine is replaced with an
LLM-driven one and form entry is replaced with chat.

## How it works

```
plain-language rules ──▶ normalizeRules()  ──▶ structured RuleSpec (stored once)
chat message per turn ─▶ scoreTurn()       ──▶ per-player deltas (LLM reasons over rules)
turns[]               ─▶ computeStandings() ─▶ running totals (deterministic, source of truth)
```

The LLM sits at the **edges** — understanding rules and language. Running totals
are computed deterministically from the stored turn deltas (`computeStandings`),
so standings are reproducible and auditable.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind
- Vercel AI SDK v7 (`generateObject`) via the Vercel AI Gateway
- Default model: `google/gemini-3.6-flash` (override with `SCOREBOARD_MODEL`)
- MongoDB (Atlas) — each game is one document (rules + players + turn history embedded)

## Setup

```bash
cp .env.local.example .env.local
# set AI_GATEWAY_API_KEY (Vercel → AI Gateway → API Keys)
# set MONGODB_URI (e.g. a MongoDB Atlas connection string)
npm install
npm run dev   # http://localhost:3000
```

## Layout

| Path | Purpose |
| --- | --- |
| `src/lib/domain.ts` | Game-agnostic types + `computeStandings` |
| `src/lib/db.ts` | Cached MongoDB connection (serverless-safe) |
| `src/lib/store.ts` | Game persistence in MongoDB (one document per game) |
| `src/lib/ai.ts` | `normalizeRules()` + `scoreTurn()` via the gateway |
| `src/app/api/games/**` | Create / list / get games, submit chat turns |
| `src/app/page.tsx` | Create + list games |
| `src/app/games/[id]/page.tsx` | Live scoreboard + chat entry |

## Known MVP limitations / next steps

- **Scoring is LLM-computed** each turn. To make it fully deterministic, have
  `normalizeRules` also emit a sandboxed scoring function and run that instead.
- No auth / realtime yet — reuse patterns from the original Whist backend
  (WebSocket + invitations) when multiplayer is needed.
- Add a chat-driven "define your own rules" flow and an "undo last turn" action.
