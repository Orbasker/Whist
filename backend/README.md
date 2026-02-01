# Whist Game Backend

FastAPI backend for the Whist card game scoring application.

## Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer

Install `uv`:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# Or on macOS with Homebrew:
brew install uv
```

## Setup

1. Install dependencies and create virtual environment:
```bash
uv sync
```

This will:
- Create a virtual environment automatically
- Install all dependencies from `pyproject.toml`
- Generate a `uv.lock` file for reproducible builds

2. Set up environment:
```bash
cp env.example .env
# Edit .env with your DATABASE_URL (see options below).
```

**Database options:**

- **Neon PostgreSQL (recommended):** Create a project at [neon.tech](https://neon.tech), copy the connection string, and set `DATABASE_URL` in `.env`. Neon requires SSL; the app adds `sslmode=require` automatically for Neon hosts. Example format: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
- **Local PostgreSQL:** `DATABASE_URL=postgresql://username:password@localhost:5432/whist_db`
- **SQLite (dev):** `DATABASE_URL=sqlite:///./whist.db`

3. Create PostgreSQL database (only for local PostgreSQL):
```bash
# Using psql:
createdb whist_db
# Or using SQL:
psql -U postgres -c "CREATE DATABASE whist_db;"
```
For Neon, the database is created when you create the project.

4. Run database migrations (creates all tables):
```bash
uv run alembic upgrade head
```

This will create the `games` and `rounds` tables in your PostgreSQL database.

4. Start the server:
```bash
uv run uvicorn app.main:app --reload
```

Or use VS Code debugger:
- Press `F5` or go to Run and Debug
- Select "Backend: Dev (Local PostgreSQL)" for local development
- Select "Backend: Production (Supabase)" for production/Supabase testing

The API will be available at `http://localhost:8000`
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development

### Install with dev dependencies:
```bash
uv sync --all-extras
```

### Run tests:
```bash
uv run pytest
```

### Run linting and formatting:
```bash
uv run ruff check .
uv run black .
uv run mypy app/
```

### Add a new dependency:
```bash
uv add package-name
# For dev dependencies (adds to optional-dependencies.dev):
uv add --dev package-name
```

### Update dependencies:
```bash
uv sync --upgrade
```

## Architecture

- **Models**: SQLAlchemy ORM models (`app/models/`)
- **Schemas**: Pydantic schemas (`app/schemas/`)
- **Views**: FastAPI route handlers (`app/views/`)
- **Services**: Business logic (`app/services/`)
- **Repositories**: Data access layer (`app/repositories/`)
- **SQL**: Raw SQL models and queries (`app/sql/`)

## Migration from pip/venv

If you were using the old setup:
1. Remove old virtual environment: `rm -rf venv`
2. Run `uv sync` to create new environment
3. Use `uv run` prefix for all commands instead of activating venv

## Notes

- `uv.lock` file ensures reproducible builds across environments
- Virtual environment is managed automatically by `uv`
- All commands should use `uv run` prefix instead of activating venv
