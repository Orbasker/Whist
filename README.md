# Whist Game - Scoring Application

A Whist card game scoring application built with Angular (web) and FastAPI (backend).

## Project Structure

```
Wist/
├── backend/              # FastAPI backend
│   ├── app/              # Application code
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── views/        # FastAPI route handlers
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Data access layer
│   │   └── sql/         # SQL models and queries
│   ├── tests/           # Backend tests
│   └── requirements.txt # Python dependencies
│
├── angular-web/          # Angular web application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/     # Services and models
│   │   │   ├── features/ # Feature modules
│   │   │   └── shared/   # Shared components
│   │   └── styles/      # Global styles
│   └── package.json     # Node dependencies
│
└── docs/                # Documentation
    └── plan/            # Architecture and migration plans
```

## Features

- ✅ 4-player Whist game scoring
- ✅ Bidding phase with trump suit selection
- ✅ Tricks phase with score calculation
- ✅ Round summary and score tracking
- ✅ Hebrew RTL support
- ✅ Dark theme with orange accents
- ✅ FastAPI backend with MVVM architecture
- ✅ Angular standalone components

## Getting Started

### Backend Setup

**Prerequisites:** Install [uv](https://github.com/astral-sh/uv):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# Or: brew install uv
```

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies (creates virtual environment automatically):
```bash
uv sync
```

3. Set up environment:
```bash
cp .env.example .env
# Edit .env with your database URL
```

4. Run database migrations:
```bash
uv run alembic upgrade head
```

5. Start the server:
```bash
uv run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Angular Setup

1. Navigate to angular-web directory:
```bash
cd angular-web
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
# Or: ng serve
```

The app will be available at `http://localhost:4200`

**Note:** Make sure the backend is running first (see Backend Setup above) so the API is available.

## API Endpoints

### Games
- `POST /api/v1/games` - Create new game
- `GET /api/v1/games/{id}` - Get game by ID
- `PUT /api/v1/games/{id}` - Update game
- `DELETE /api/v1/games/{id}` - Delete game

### Rounds
- `POST /api/v1/games/{id}/rounds/bids` - Submit bids
- `POST /api/v1/games/{id}/rounds/tricks` - Submit tricks
- `GET /api/v1/games/{id}/rounds` - Get all rounds

### Health
- `GET /api/v1/health` - Health check

## Game Rules

### Scoring
- **Bid 0 + Take 0**: +50 (under mode) or +30 (over mode)
- **Bid 0 + Take tricks**: -10 × tricks
- **Bid matches tricks**: (bid²) + 10
- **Bid doesn't match**: -10 × |bid - tricks|

### Round Mode
- **Over**: Total bids > 13
- **Under**: Total bids ≤ 13

## Technology Stack

### Backend
- FastAPI 0.104+
- SQLAlchemy 2.0+
- Pydantic v2
- PostgreSQL / SQLite
- Alembic (migrations)

### Frontend
- Angular 18+ (Standalone)
- Tailwind CSS
- RxJS
- TypeScript

## Development

### Backend Testing
```bash
cd backend
uv run pytest
```

### Angular Testing
```bash
cd angular-web
npm test
```

## Future Phases

- **Phase 2**: Multi-user support, game sharing, real-time updates (Supabase)
- **Phase 3**: Full card game simulation with card dealing

See `docs/plan/` for detailed architecture and future plans.

## License

MIT
