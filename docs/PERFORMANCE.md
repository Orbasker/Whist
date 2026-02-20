# Performance improvements

Summary of changes and how to measure impact.

## Backend

### 1. List games by user (GET /api/v1/games)

- **Before:** Loaded all games with non-null `player_user_ids`, then filtered in Python. O(n) over every game in the DB.
- **After:** Single DB query that filters by `owner_id = :user_id` OR user in `player_user_ids` JSON array (SQLite: `json_each`, PostgreSQL: `jsonb_array_elements_text`). Only matching rows are read. Order by `created_at DESC` in SQL; then games loaded by ID to preserve order.
- **Measure:** Compare response time for a user with many games vs. total games in DB. Before, time grew with total games; after, it grows with the user’s games only.

### 2. Indexes (migration `6b2c3d4e5f6a`)

- `ix_games_owner_id` – speeds up “games I own”.
- `ix_games_created_at` – speeds up `ORDER BY created_at DESC` for list games.
- `ix_rounds_game_id_round_number` – speeds up “rounds by game” and ordering by round number.

Apply with: `cd backend && uv run alembic upgrade head` (requires DB already at revision `5a1b2c3d4e5f`).

### 3. Reset vote (unanimous reset)

- **Before:** Looped over `game.rounds` and deleted each round (N queries, plus lazy load of all rounds).
- **After:** Single bulk delete: `Round.query.filter(Round.game_id == game_id).delete()`.

### API response size

- `GameResponse` and `RoundResponse` are unchanged. List games returns only the games for the current user (smaller when the DB has many games from other users). No extra fields were added.

## Frontend

### 1. Bundle size

- **Animations:** Switched from `provideAnimations()` to `provideNoopAnimations()`. The app uses CSS transitions only, not `@angular/animations`, so the animations bundle is no longer loaded. This reduces initial JS size.
- **Lazy loading:** Routes already use `loadComponent()` for home, login, game, and invite. Lazy chunks are loaded on demand.

### 2. Build output (example after changes)

- Initial total ~706 kB raw (~160 kB estimated transfer with gzip).
- Lazy chunks: game, home, auth, invite, etc., loaded when their route is opened.

To measure:

```bash
cd angular-web && npm run build
```

Check “Initial chunk files” and “Lazy chunk files” in the output. Budgets in `angular.json`: initial warning at 800 kB, error at 1.5 MB.

## Quick verification

- **Backend:** `cd backend && uv run pytest -q` and `uv run uvicorn app.main:app --reload` (then stop).
- **Frontend:** `cd angular-web && npm run build` (no errors).
- **Migrations:** On an existing DB at `5a1b2c3d4e5f`, run `alembic upgrade head` to add indexes.
