# Database migrations (Alembic)

This document describes how database migrations are run in each environment and how the CI/CD pipeline ensures they stay valid.

## Overview

- **Tool:** [Alembic](https://alembic.sqlalchemy.org/)
- **Location:** `backend/alembic/` (migration scripts in `backend/alembic/versions/`)
- **Database URL:** Migrations use the same URL as the app, from `DATABASE_URL` (see `backend/app/config.py` and `backend/alembic/env.py`). Each environment must point `DATABASE_URL` at the **correct** database for that environment.

The pipeline is designed so that:

1. **CI** runs migrations against a temporary database; if migrations fail, the pipeline fails.
2. **Deploy** runs migrations before starting the app (e.g. on Render), so the correct database is migrated automatically when you deploy.

---

## Running migrations by environment

### Local / development

**Database:** Whatever is in your `backend/.env` (e.g. `DATABASE_URL=sqlite:///./whist.db` or a local/Neon PostgreSQL URL).

**How to run:**

```bash
cd backend
uv run alembic upgrade head
```

- Uses `DATABASE_URL` from `backend/.env` (or `.env.prod` if present).
- Run this after pulling new migration files or before starting the server.

**Create a new migration (after changing models):**

```bash
cd backend
uv run alembic revision --autogenerate -m "describe_your_change"
# Then edit the generated file in alembic/versions/ if needed, and run upgrade head.
```

---

### CI (GitHub Actions)

**Database:** A temporary PostgreSQL 16 service container (`whist_ci` database) used only for the duration of the job. Migrations run against Postgres so they are validated in the same way as staging and production.

**How it runs:** The CI workflow (`.github/workflows/ci.yml`) runs a **Run Alembic migrations** step in the Backend job:

1. Starts a PostgreSQL service container and sets `DATABASE_URL` to it.
2. Runs `uv run alembic upgrade head` from the `backend/` directory.

**Purpose:** Validate that all migration scripts apply in order without errors. If this step fails, the whole pipeline fails (e.g. merge to `main` is blocked until migrations are fixed).

**You don’t run migrations manually in CI** — they run automatically on every push/PR to `main`.

---

### Staging

**Database:** Staging PostgreSQL (e.g. a separate Neon branch or staging DB). Must be set via `DATABASE_URL` in your staging platform (e.g. Render, Railway).

**How to run:**

- **If your platform runs the same start command as production:** Migrations run automatically before the app starts (e.g. `uv run alembic upgrade head && uv run uvicorn ...`). Ensure the staging service has `DATABASE_URL` set to the **staging** database.
- **If you run migrations separately:** From a machine or one-off job that has access to the staging DB and env:
  ```bash
  cd backend
  export DATABASE_URL="postgresql://..."   # staging DB URL
  uv run alembic upgrade head
  ```

Never point staging’s `DATABASE_URL` at the production database.

---

### Production (e.g. Render)

**Database:** Production PostgreSQL (e.g. Neon production). Set via `DATABASE_URL` in the production service (Render → Environment).

**How it runs:** The documented Render **Start Command** includes migrations before starting the app:

```bash
uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

So on each deploy:

1. Render builds the app and sets `DATABASE_URL` from the service’s environment.
2. The start command runs `alembic upgrade head` against that **production** database.
3. If migrations fail, the start command fails and the deploy fails (no app start).
4. If they succeed, uvicorn starts.

**Manual run (only if needed):** If you ever run migrations manually against production (e.g. from a one-off job or your laptop), use the production `DATABASE_URL` and run from `backend/`:

```bash
cd backend
export DATABASE_URL="postgresql://..."   # production DB URL from Render/Neon
uv run alembic upgrade head
```

---

## Summary table

| Environment   | Database source              | How migrations run                                      | Pipeline fails if migrations fail? |
|---------------|------------------------------|---------------------------------------------------------|-------------------------------------|
| Local        | `backend/.env` → `DATABASE_URL` | You run: `cd backend && uv run alembic upgrade head`   | N/A                                 |
| CI           | PostgreSQL service container (`whist_ci`)    | Automatically in Backend job                        | Yes                                 |
| Staging      | Staging service `DATABASE_URL` | Before app start (if same start command as prod) or manually | Deploy fails if start command fails |
| Production   | Production service `DATABASE_URL` | Before app start in Render start command             | Yes (deploy fails)                  |

---

## Troubleshooting

- **CI: "alembic.util.exc.CommandError" or migration failure**  
  Fix the migration (or dependency order) in `backend/alembic/versions/`, then push. CI will pass once `alembic upgrade head` succeeds.

- **Render: Service won’t start / migrations fail**  
  Check Render logs for the exact error. Ensure `DATABASE_URL` in Render is set to the correct database (production DB for production service). Fix the migration or DB connectivity and redeploy.

- **Wrong database**  
  Migrations always use `DATABASE_URL` from the environment. Double-check that staging and production services each have their own `DATABASE_URL` and never point at the other’s database.
