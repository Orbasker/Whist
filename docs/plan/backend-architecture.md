# Backend Architecture: FastAPI with MVVM Pattern

## Project Structure

```
Wist/
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   │
│   │   ├── main.py                  # FastAPI app entry point
│   │   ├── config.py                # Configuration (settings)
│   │   │
│   │   ├── models/                  # Database Models (M in MVVM)
│   │   │   ├── __init__.py
│   │   │   ├── game.py              # Game SQLAlchemy model
│   │   │   ├── player.py            # Player SQLAlchemy model
│   │   │   ├── round.py             # Round SQLAlchemy model
│   │   │   └── base.py              # Base model class
│   │   │
│   │   ├── schemas/                 # ViewModels (VM in MVVM)
│   │   │   ├── __init__.py
│   │   │   ├── game.py              # Game Pydantic schemas
│   │   │   ├── player.py            # Player Pydantic schemas
│   │   │   ├── round.py             # Round Pydantic schemas
│   │   │   └── common.py            # Common schemas (responses, errors)
│   │   │
│   │   ├── views/                   # Views (V in MVVM) - API Routes
│   │   │   ├── __init__.py
│   │   │   ├── games.py             # Game endpoints
│   │   │   ├── players.py           # Player endpoints (if needed)
│   │   │   └── health.py            # Health check endpoint
│   │   │
│   │   ├── services/                # Business Logic Layer
│   │   │   ├── __init__.py
│   │   │   ├── game_service.py     # Game business logic
│   │   │   ├── scoring_service.py  # Scoring calculations
│   │   │   └── round_service.py    # Round management
│   │   │
│   │   ├── repositories/            # Data Access Layer
│   │   │   ├── __init__.py
│   │   │   ├── game_repository.py  # Game CRUD operations (ORM)
│   │   │   ├── round_repository.py # Round CRUD operations (ORM)
│   │   │   ├── base_repository.py  # Base repository class
│   │   │   └── sql_queries.py      # Raw SQL queries/models
│   │   │
│   │   ├── sql/                     # SQL Models & Queries
│   │   │   ├── __init__.py
│   │   │   ├── models/             # SQL model definitions
│   │   │   │   ├── game.sql        # Game table SQL
│   │   │   │   ├── round.sql       # Round table SQL
│   │   │   │   └── indexes.sql    # Index definitions
│   │   │   ├── queries/            # Raw SQL queries
│   │   │   │   ├── game_queries.py # Game SQL queries
│   │   │   │   ├── round_queries.py # Round SQL queries
│   │   │   │   └── analytics_queries.py # Complex analytics queries
│   │   │   └── migrations/        # SQL migration files
│   │   │       └── 001_initial_schema.sql
│   │   │
│   │   ├── database/                # Database configuration
│   │   │   ├── __init__.py
│   │   │   ├── connection.py       # Database connection
│   │   │   ├── session.py          # Session management
│   │   │   └── migrations/         # Alembic migrations
│   │   │
│   │   ├── core/                    # Core utilities
│   │   │   ├── __init__.py
│   │   │   ├── dependencies.py     # FastAPI dependencies
│   │   │   ├── exceptions.py       # Custom exceptions
│   │   │   └── middleware.py       # Custom middleware
│   │   │
│   │   └── api/                     # API router aggregation
│   │       ├── __init__.py
│   │       ├── v1/
│   │       │   ├── __init__.py
│   │       │   └── router.py       # API v1 router
│   │       └── deps.py             # API dependencies
│   │
│   ├── tests/                       # Backend tests
│   │   ├── __init__.py
│   │   ├── conftest.py             # Pytest fixtures
│   │   ├── unit/
│   │   │   ├── test_scoring.py
│   │   │   ├── test_game_service.py
│   │   │   └── test_repositories.py
│   │   ├── integration/
│   │   │   ├── test_game_api.py
│   │   │   └── test_round_api.py
│   │   └── e2e/
│   │       └── test_game_flow.py
│   │
│   ├── alembic/                     # Database migrations
│   │   ├── versions/
│   │   ├── env.py
│   │   └── alembic.ini
│   │
│   ├── requirements.txt             # Python dependencies
│   ├── requirements-dev.txt        # Development dependencies
│   ├── .env.example                # Environment variables template
│   ├── .gitignore
│   └── README.md
│
├── angular-web/                    # Angular frontend
│   └── src/
│       └── app/
│           └── core/
│               └── services/
│                   └── api.service.ts  # HTTP client for backend
│
├── flutter-mobile/                  # Flutter frontend
│   └── lib/
│       └── core/
│           └── services/
│               └── api_service.dart    # HTTP client for backend
│
└── shared/                         # Shared TypeScript logic (still useful)
    └── src/
        └── game-logic/             # Can be used for validation
```

---

## MVVM Architecture Layers

### 1. Models (Data Layer)
**Location**: `app/models/` (ORM) + `app/sql/models/` (SQL)
**Purpose**: Database entities using SQLAlchemy ORM + Raw SQL models

```python
# app/models/game.py
from sqlalchemy import Column, String, Integer, JSON, Enum, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum
import uuid

class GameStatus(enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    SHARED = "shared"  # Phase 2

class GameMode(enum.Enum):
    SCORING_ONLY = "scoring_only"  # Phase 1-2
    FULL_REMOTE = "full_remote"    # Phase 3
    HYBRID = "hybrid"              # Phase 3

class Game(Base):
    __tablename__ = "games"
    
    # Phase 1
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    players = Column(JSON, nullable=False)  # List of player names
    scores = Column(JSON, nullable=False)   # List of scores [int, int, int, int]
    current_round = Column(Integer, default=1)
    status = Column(Enum(GameStatus), default=GameStatus.ACTIVE)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    
    # Phase 2 (nullable for backward compatibility)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=True)  # Optional game name
    player_user_ids = Column(JSON, nullable=True)  # [user_id1, null, null, null]
    is_shared = Column(Boolean, default=False)
    share_code = Column(String, unique=True, nullable=True)
    
    # Phase 3
    game_mode = Column(Enum(GameMode), default=GameMode.SCORING_ONLY)
    
    # Relationships
    rounds = relationship("Round", back_populates="game", cascade="all, delete-orphan")
    owner = relationship("User", foreign_keys=[owner_id])  # Phase 2
    participants = relationship("GameParticipant", back_populates="game")  # Phase 2
```

### 2. ViewModels (Presentation Layer)
**Location**: `app/schemas/`
**Purpose**: Pydantic models for request/response validation

```python
# app/schemas/game.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models.game import GameStatus

class GameCreate(BaseModel):
    """ViewModel for creating a game"""
    players: List[str] = Field(..., min_length=4, max_length=4)

class GameResponse(BaseModel):
    """ViewModel for game response"""
    id: str
    players: List[str]
    scores: List[int]
    current_round: int
    status: GameStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # For SQLAlchemy model conversion

class GameUpdate(BaseModel):
    """ViewModel for updating a game"""
    scores: Optional[List[int]] = None
    current_round: Optional[int] = None
    status: Optional[GameStatus] = None
```

### 3. Views (API Layer)
**Location**: `app/views/`
**Purpose**: FastAPI route handlers (API endpoints)

```python
# app/views/games.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.game import GameCreate, GameResponse, GameUpdate
from app.services.game_service import GameService
from app.core.dependencies import get_db, get_game_service

router = APIRouter(prefix="/games", tags=["games"])

@router.post("/", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
async def create_game(
    game_data: GameCreate,
    game_service: GameService = Depends(get_game_service)
):
    """Create a new game"""
    return await game_service.create_game(game_data.players)

@router.get("/{game_id}", response_model=GameResponse)
async def get_game(
    game_id: str,
    game_service: GameService = Depends(get_game_service)
):
    """Get game by ID"""
    game = await game_service.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game
```

### 4. Services (Business Logic Layer)
**Location**: `app/services/`
**Purpose**: Business logic and orchestration (uses both ORM and SQL repositories)

```python
# app/services/game_service.py
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.game import Game, GameStatus
from app.schemas.game import GameResponse
from app.repositories.game_repository import GameRepository
from app.services.scoring_service import ScoringService
import uuid
from datetime import datetime

class GameService:
    def __init__(self, db: Session, game_repo: GameRepository):
        self.db = db
        self.game_repo = game_repo
        self.scoring_service = ScoringService()
    
    async def create_game(self, players: List[str]) -> GameResponse:
        """Create a new game"""
        game = Game(
            id=str(uuid.uuid4()),
            players=players,
            scores=[0, 0, 0, 0],
            current_round=1,
            status=GameStatus.ACTIVE,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        saved_game = await self.game_repo.create(game)
        return GameResponse.from_orm(saved_game)
    
    async def get_game(self, game_id: str) -> Optional[GameResponse]:
        """Get game by ID (using ORM)"""
        game = await self.game_repo.get_by_id(game_id)
        return GameResponse.from_orm(game) if game else None
    
    async def get_game_statistics(self) -> List[dict]:
        """Get games with statistics (using raw SQL)"""
        return await self.game_repo.get_games_with_stats()
    
    async def submit_bids(
        self, 
        game_id: str, 
        bids: List[int], 
        trump_suit: Optional[str]
    ) -> GameResponse:
        """Submit bids for current round"""
        game = await self.game_repo.get_by_id(game_id)
        if not game:
            raise ValueError("Game not found")
        
        # Business logic: validate bids, calculate round mode
        round_mode = self.scoring_service.calculate_round_mode(sum(bids))
        
        # Update game state (in real implementation, create Round record)
        game.updated_at = datetime.utcnow()
        updated_game = await self.game_repo.update(game)
        return GameResponse.from_orm(updated_game)
```

### 5. Repositories (Data Access Layer)
**Location**: `app/repositories/`
**Purpose**: Database operations abstraction (ORM + Raw SQL)

#### ORM Repository Pattern
```python
# app/repositories/game_repository.py
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.game import Game
from app.repositories.base_repository import BaseRepository
from app.sql.queries.game_queries import GameQueries

class GameRepository(BaseRepository[Game]):
    def __init__(self, db: Session):
        super().__init__(db, Game)
        self.sql_queries = GameQueries()
    
    # ORM methods for simple operations
    async def get_by_id(self, game_id: str) -> Optional[Game]:
        """Get game by ID using ORM"""
        return self.db.query(Game).filter(Game.id == game_id).first()
    
    async def create(self, game: Game) -> Game:
        """Create a new game using ORM"""
        self.db.add(game)
        self.db.commit()
        self.db.refresh(game)
        return game
    
    async def update(self, game: Game) -> Game:
        """Update an existing game using ORM"""
        self.db.commit()
        self.db.refresh(game)
        return game
    
    # Raw SQL methods for complex queries
    async def get_games_with_stats(self) -> List[dict]:
        """Get games with statistics using raw SQL"""
        query = self.sql_queries.get_games_with_round_count()
        result = self.db.execute(text(query))
        return [dict(row) for row in result]
    
    async def get_player_history(self, player_name: str) -> List[dict]:
        """Get player's game history using raw SQL"""
        query = self.sql_queries.get_player_history()
        result = self.db.execute(
            text(query),
            {"player_name": player_name}
        )
        return [dict(row) for row in result]
```

#### SQL Queries Module
```python
# app/sql/queries/game_queries.py
class GameQueries:
    """Raw SQL queries for complex operations"""
    
    def get_games_with_round_count(self) -> str:
        """Get games with round count using JOIN"""
        return """
            SELECT 
                g.id,
                g.players,
                g.scores,
                g.current_round,
                g.status,
                COUNT(r.id) as total_rounds,
                MAX(r.created_at) as last_round_at
            FROM games g
            LEFT JOIN rounds r ON g.id = r.game_id
            GROUP BY g.id, g.players, g.scores, g.current_round, g.status
            ORDER BY g.created_at DESC
        """
    
    def get_player_history(self) -> str:
        """Get player's game history"""
        return """
            SELECT 
                g.id as game_id,
                g.players,
                g.scores,
                g.current_round,
                g.status,
                g.created_at,
                COUNT(r.id) as rounds_played
            FROM games g
            LEFT JOIN rounds r ON g.id = r.game_id
            WHERE :player_name = ANY(
                SELECT json_array_elements_text(g.players::json)
            )
            GROUP BY g.id, g.players, g.scores, g.current_round, g.status, g.created_at
            ORDER BY g.created_at DESC
        """
    
    def get_round_statistics(self) -> str:
        """Get round statistics"""
        return """
            SELECT 
                round_number,
                round_mode,
                trump_suit,
                COUNT(*) as frequency,
                AVG(
                    (scores->>0)::int + 
                    (scores->>1)::int + 
                    (scores->>2)::int + 
                    (scores->>3)::int
                ) as avg_total_score
            FROM rounds
            GROUP BY round_number, round_mode, trump_suit
            ORDER BY round_number
        """
```

#### SQL Models (Table Definitions)
```sql
-- app/sql/models/game.sql
-- Game table definition (for reference and migrations)

CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID,
    name VARCHAR,
    players JSON NOT NULL,
    player_user_ids JSON,
    scores JSON NOT NULL,
    current_round INTEGER DEFAULT 1,
    status VARCHAR DEFAULT 'active',
    is_shared BOOLEAN DEFAULT false,
    share_code VARCHAR UNIQUE,
    game_mode VARCHAR DEFAULT 'scoring_only',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_owner ON games(owner_id);
CREATE INDEX IF NOT EXISTS idx_games_share_code ON games(share_code);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

-- Phase 2: Foreign key (commented for Phase 1)
-- ALTER TABLE games 
-- ADD CONSTRAINT fk_games_owner 
-- FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
```

```sql
-- app/sql/models/round.sql
-- Round table definition

CREATE TABLE IF NOT EXISTS rounds (
    id SERIAL PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    bids JSON NOT NULL,
    tricks JSON NOT NULL,
    scores JSON NOT NULL,
    round_mode VARCHAR NOT NULL,
    trump_suit VARCHAR,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_round_mode CHECK (round_mode IN ('over', 'under')),
    CONSTRAINT chk_trump_suit CHECK (
        trump_suit IS NULL OR 
        trump_suit IN ('spades', 'clubs', 'diamonds', 'hearts', 'no-trump')
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rounds_game_id ON rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_rounds_game_round ON rounds(game_id, round_number);
CREATE INDEX IF NOT EXISTS idx_rounds_created_at ON rounds(created_at DESC);
```

```sql
-- app/sql/models/indexes.sql
-- Additional indexes for complex queries

-- Composite index for game queries
CREATE INDEX IF NOT EXISTS idx_games_status_created 
ON games(status, created_at DESC);

-- Index for round statistics
CREATE INDEX IF NOT EXISTS idx_rounds_mode_suit 
ON rounds(round_mode, trump_suit);

-- GIN index for JSON queries (PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_games_players_gin 
ON games USING GIN (players);

CREATE INDEX IF NOT EXISTS idx_rounds_bids_gin 
ON rounds USING GIN (bids);

CREATE INDEX IF NOT EXISTS idx_rounds_tricks_gin 
ON rounds USING GIN (tricks);
```

#### SQL Migration Files
```sql
-- app/sql/migrations/001_initial_schema.sql
-- Initial database schema

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID,
    name VARCHAR,
    players JSON NOT NULL,
    player_user_ids JSON,
    scores JSON NOT NULL,
    current_round INTEGER DEFAULT 1,
    status VARCHAR DEFAULT 'active',
    is_shared BOOLEAN DEFAULT false,
    share_code VARCHAR UNIQUE,
    game_mode VARCHAR DEFAULT 'scoring_only',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Rounds table
CREATE TABLE rounds (
    id SERIAL PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    bids JSON NOT NULL,
    tricks JSON NOT NULL,
    scores JSON NOT NULL,
    round_mode VARCHAR NOT NULL,
    trump_suit VARCHAR,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_owner ON games(owner_id);
CREATE INDEX idx_games_share_code ON games(share_code);
CREATE INDEX idx_rounds_game_id ON rounds(game_id);
CREATE INDEX idx_rounds_game_round ON rounds(game_id, round_number);
```

---

## API Endpoints Design

### Phase 1 Endpoints (Current)

#### Games API
```
POST   /api/v1/games                    # Create new game
GET    /api/v1/games/{game_id}          # Get game by ID
PUT    /api/v1/games/{game_id}          # Update game
DELETE /api/v1/games/{game_id}          # Delete game
```

#### Rounds API
```
POST   /api/v1/games/{game_id}/rounds/bids    # Submit bids
POST   /api/v1/games/{game_id}/rounds/tricks  # Submit tricks
GET    /api/v1/games/{game_id}/rounds          # Get all rounds
GET    /api/v1/games/{game_id}/rounds/{round}   # Get specific round
```

#### Health & Status
```
GET    /health                    # Health check
GET    /api/v1/status             # API status
```

### Phase 2 Endpoints (Future)

#### Authentication API
**Note**: Authentication handled by Supabase, not FastAPI. Frontend calls Supabase directly.

```
# These endpoints are in Supabase, not FastAPI:
POST   /auth/v1/signup            # Supabase: Register user
POST   /auth/v1/token             # Supabase: Login (get JWT)
POST   /auth/v1/logout            # Supabase: Logout
GET    /auth/v1/user              # Supabase: Get current user
```

#### FastAPI Endpoints (with Auth)
```
# FastAPI validates Supabase JWT token
GET    /api/v1/games               # List user's games (requires auth)
POST   /api/v1/games/{id}/share    # Generate share code (requires auth)
POST   /api/v1/games/join/{code}   # Join game by share code (requires auth)
POST   /api/v1/games/{id}/participants  # Add participant (requires auth)
```

#### Games API (Extended)
```
GET    /api/v1/games               # List user's games (owned + participating)
POST   /api/v1/games/{id}/share    # Generate share code
POST   /api/v1/games/join/{code}   # Join game by share code
POST   /api/v1/games/{id}/participants  # Add participant
```

#### WebSocket
```
WS     /ws/games/{game_id}         # Real-time game updates
```

### Phase 3 Endpoints (Future)

#### Card Game API
```
POST   /api/v1/games/{id}/rounds/{round}/deal    # Deal cards
POST   /api/v1/games/{id}/rounds/{round}/play    # Play a card
GET    /api/v1/games/{id}/rounds/{round}/hand     # Get player's hand
GET    /api/v1/games/{id}/rounds/{round}/tricks   # Get tricks
```

---

## Database Schema

### Phase 1 Schema (Current)

```sql
-- Games table (Phase 1 - forward compatible with Phase 2)
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- UUID for multi-user support
    owner_id UUID,                    -- NULL in Phase 1, populated in Phase 2
    name VARCHAR,                     -- Optional game name (Phase 2)
    players JSON NOT NULL,            -- ["player1", "player2", "player3", "player4"]
    player_user_ids JSON,             -- [user_id1, null, null, null] (Phase 2)
    scores JSON NOT NULL,             -- [0, 0, 0, 0]
    current_round INTEGER DEFAULT 1,
    status VARCHAR DEFAULT 'active',  -- 'active', 'completed', 'shared' (Phase 2)
    is_shared BOOLEAN DEFAULT false,  -- Phase 2: Can others join?
    share_code VARCHAR UNIQUE,        -- Phase 2: Code to share game
    game_mode VARCHAR DEFAULT 'scoring_only',  -- Phase 3: 'scoring_only', 'full_remote'
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Rounds table
CREATE TABLE rounds (
    id SERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    bids JSON NOT NULL,               -- [0, 3, 4, 5]
    tricks JSON NOT NULL,             -- [2, 3, 4, 4]
    scores JSON NOT NULL,             -- [-20, 19, 26, -10]
    round_mode VARCHAR NOT NULL,      -- 'over' or 'under'
    trump_suit VARCHAR,                -- 'spades', 'clubs', 'diamonds', 'hearts', 'no-trump'
    created_by UUID,                  -- Phase 2: Who submitted
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_owner ON games(owner_id);  -- Phase 2
CREATE INDEX idx_games_share_code ON games(share_code);  -- Phase 2
CREATE INDEX idx_rounds_game_id ON rounds(game_id);
CREATE INDEX idx_rounds_game_round ON rounds(game_id, round_number);
```

### Phase 2 Schema Additions (Future)

**Note**: User authentication will be handled by Supabase (not in FastAPI database). Users table exists in Supabase, FastAPI only stores `user_id` references.

```sql
-- Game participants (Phase 2)
-- Note: user_id references Supabase auth.users, not a local users table
CREATE TABLE game_participants (
    id SERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,  -- References Supabase auth.users(id)
    player_index INTEGER,    -- Which position (0-3)
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(game_id, user_id),
    UNIQUE(game_id, player_index)
);

-- Foreign key for games.owner_id (Phase 2)
-- Note: owner_id references Supabase auth.users, not a local users table
-- No foreign key constraint (Supabase handles this via RLS)
-- ALTER TABLE games 
-- ADD CONSTRAINT fk_games_owner 
-- FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;
-- ^ This is handled by Supabase RLS, not foreign key constraint
```

**Supabase Integration:**
- User data stored in Supabase `auth.users` table (managed by Supabase)
- FastAPI only stores `user_id` (UUID) references
- RLS policies enforce access control
- No need for local users table in FastAPI database

### Phase 3 Schema Additions (Future)

```sql
-- Cards in game (Phase 3)
CREATE TABLE game_cards (
    id SERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    player_index INTEGER NOT NULL,    -- Which player (0-3)
    card_suit VARCHAR NOT NULL,        -- 'spades', 'clubs', 'diamonds', 'hearts'
    card_rank VARCHAR NOT NULL,       -- 'A', '2', '3', ..., 'K'
    position INTEGER,                 -- Order in hand
    played_at TIMESTAMP,              -- When card was played
    trick_number INTEGER,             -- Which trick (1-13)
    UNIQUE(game_id, round_number, player_index, position)
);

-- Tricks tracking (Phase 3)
CREATE TABLE tricks (
    id SERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    trick_number INTEGER NOT NULL,   -- 1-13
    cards_played JSON NOT NULL,       -- [{player: 0, card: {...}}, ...]
    winner_index INTEGER,             -- Who won the trick (0-3)
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Data Flow

```
Client Request (Angular/Flutter)
    │
    ▼
FastAPI Route Handler (View)
    │
    ├──► Validate Request (Pydantic ViewModel)
    │
    ├──► Dependency Injection (Service)
    │
    ▼
Service Layer (Business Logic)
    │
    ├──► Validate Business Rules
    │
    ├──► Call Repository
    │
    └──► Apply Scoring Logic
            │
            ▼
Repository Layer (Data Access)
    │
    ├──► SQLAlchemy Query
    │
    └──► Database (PostgreSQL/SQLite)
            │
            ▼
Response (Pydantic ViewModel)
    │
    ▼
Client (Angular/Flutter)
```

---

## Technology Stack

### Backend Core
- **Framework**: FastAPI 0.104+
- **ORM**: SQLAlchemy 2.0+ (for simple operations)
- **Raw SQL**: Direct SQL queries (for complex operations)
- **Validation**: Pydantic v2
- **Database**: PostgreSQL (production) / SQLite (development)
- **Migrations**: Alembic + SQL migration files
- **Async**: asyncio + async/await

### Development Tools
- **Testing**: pytest + pytest-asyncio
- **HTTP Client**: httpx (for testing)
- **Code Quality**: black, ruff, mypy
- **API Docs**: FastAPI auto-generated (Swagger/OpenAPI)

### Deployment
- **Server**: Uvicorn (ASGI server)
- **Container**: Docker + Docker Compose
- **Hosting**: Railway, Render, or AWS

---

## Service Layer Details

### Scoring Service
```python
# app/services/scoring_service.py
class ScoringService:
    """Pure business logic for scoring calculations"""
    
    def calculate_score(
        self, 
        bid: int, 
        tricks: int, 
        round_mode: str
    ) -> int:
        """Calculate score for a player's round"""
        if bid == 0:
            if tricks == 0:
                return 50 if round_mode == 'under' else 30
            else:
                return -10 * tricks
        else:
            if bid == tricks:
                return (bid * bid) + 10
            else:
                return -10 * abs(bid - tricks)
    
    def calculate_round_mode(self, total_bids: int) -> str:
        """Calculate if round is 'over' or 'under'"""
        return 'over' if total_bids > 13 else 'under'
```

### Round Service
```python
# app/services/round_service.py
class RoundService:
    """Business logic for round management"""
    
    def __init__(self, db: Session, round_repo: RoundRepository):
        self.db = db
        self.round_repo = round_repo
        self.scoring_service = ScoringService()
    
    async def create_round(
        self, 
        game_id: str, 
        round_number: int,
        bids: List[int],
        tricks: List[int],
        trump_suit: Optional[str]
    ) -> Round:
        """Create a round with calculated scores"""
        total_bids = sum(bids)
        round_mode = self.scoring_service.calculate_round_mode(total_bids)
        
        scores = [
            self.scoring_service.calculate_score(bids[i], tricks[i], round_mode)
            for i in range(4)
        ]
        
        round = Round(
            game_id=game_id,
            round_number=round_number,
            bids=bids,
            tricks=tricks,
            scores=scores,
            round_mode=round_mode,
            trump_suit=trump_suit,
            created_at=datetime.utcnow()
        )
        
        return await self.round_repo.create(round)
```

---

## Dependency Injection

```python
# app/core/dependencies.py
from fastapi import Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.repositories.game_repository import GameRepository
from app.services.game_service import GameService

def get_game_repository(db: Session = Depends(get_db)) -> GameRepository:
    """Dependency for game repository"""
    return GameRepository(db)

def get_game_service(
    game_repo: GameRepository = Depends(get_game_repository)
) -> GameService:
    """Dependency for game service"""
    return GameService(db=game_repo.db, game_repo=game_repo)
```

---

## Error Handling

```python
# app/core/exceptions.py
class GameNotFoundError(Exception):
    """Game not found exception"""
    pass

class InvalidBidsError(Exception):
    """Invalid bids exception"""
    pass

# app/core/middleware.py
from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.core.exceptions import GameNotFoundError

@app.exception_handler(GameNotFoundError)
async def game_not_found_handler(request: Request, exc: GameNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Game not found"}
    )
```

---

## Configuration

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./whist.db"
    
    # API
    api_v1_prefix: str = "/api/v1"
    project_name: str = "Whist Game API"
    
    # CORS
    cors_origins: list = ["http://localhost:4200", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

## Frontend Integration

### Angular Service
```typescript
// angular-web/src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:8000/api/v1';
  
  constructor(private http: HttpClient) {}
  
  createGame(players: string[]): Observable<GameResponse> {
    return this.http.post<GameResponse>(`${this.baseUrl}/games`, { players });
  }
  
  getGame(gameId: string): Observable<GameResponse> {
    return this.http.get<GameResponse>(`${this.baseUrl}/games/${gameId}`);
  }
}
```

### Flutter Service
```dart
// flutter-mobile/lib/core/services/api_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  final String baseUrl = 'http://localhost:8000/api/v1';
  
  Future<GameResponse> createGame(List<String> players) async {
    final response = await http.post(
      Uri.parse('$baseUrl/games'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'players': players}),
    );
    return GameResponse.fromJson(jsonDecode(response.body));
  }
}
```

---

## Testing Strategy

### Unit Tests
- Test services (business logic)
- Test repositories (ORM methods)
- Test SQL queries (raw SQL)
- Test scoring calculations

### Integration Tests
- Test API endpoints
- Test database operations (ORM + SQL)
- Test full game flow
- Test complex SQL queries with real data

### E2E Tests
- Test complete game lifecycle
- Test error scenarios
- Test performance with SQL queries

### SQL Query Testing
```python
# Test SQL queries directly
def test_get_games_with_stats():
    query = GameQueries().get_games_with_round_count()
    result = db.execute(text(query))
    assert len(list(result)) > 0
```

---

## Security Considerations

1. **Input Validation**: Pydantic schemas validate all inputs
2. **SQL Injection**: 
   - SQLAlchemy ORM prevents SQL injection automatically
   - Raw SQL queries use parameterized queries (never string formatting)
   - Example: `text("SELECT * FROM games WHERE id = :id").bindparams(id=game_id)`
3. **CORS**: Configure CORS for Angular/Flutter origins
4. **Rate Limiting**: Add rate limiting middleware (optional)
5. **Authentication (Phase 2)**: 
   - Supabase handles authentication (not FastAPI)
   - FastAPI validates Supabase JWT tokens
   - Extract `user_id` from token for authorization
   - RLS policies in Supabase database enforce access control

---

## Deployment

### Development
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production
```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Supabase Integration (Phase 2)

### Architecture Decision
**User authentication will be handled by Supabase (or similar service), not FastAPI.**

### Benefits
- ✅ No need to implement authentication in FastAPI
- ✅ Built-in user management UI
- ✅ Multiple auth methods (email, OAuth, magic links)
- ✅ Native Row Level Security (RLS)
- ✅ Real-time subscriptions built-in
- ✅ Free tier available

### FastAPI Integration Pattern
```python
# app/core/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.config import settings

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Validate Supabase JWT token and extract user info"""
    token = credentials.credentials
    
    try:
        # Verify token with Supabase public key
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return {
            "user_id": payload["sub"],
            "email": payload.get("email"),
            "role": payload.get("role")
        }
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

# Usage in endpoints
@router.get("/games")
async def list_games(
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    # Use user_id for authorization
    return await game_service.get_user_games(user_id)
```

### Database Setup
- FastAPI database: Stores games, rounds, participants
- Supabase database: Stores users (via `auth.users`)
- Connection: `user_id` UUID references Supabase users
- RLS: Supabase enforces access control via RLS policies

## Future Phase Compatibility

### Design Decisions for Phase 2 & 3

1. **UUID Primary Keys**: Using UUID instead of auto-increment integers
   - ✅ No conflicts when merging databases
   - ✅ Supports distributed systems
   - ✅ Better for multi-user scenarios

2. **Nullable Phase 2 Fields**: All Phase 2 fields are nullable
   - ✅ Backward compatible with Phase 1
   - ✅ Gradual migration path
   - ✅ No breaking changes

3. **JSON for Flexible Data**: Using JSON for players, scores, etc.
   - ✅ Easy to extend without schema changes
   - ✅ Can add metadata later
   - ✅ Supports dynamic player assignments

4. **Extensible Status Enum**: Game status can be extended
   - ✅ Phase 1: ACTIVE, COMPLETED
   - ✅ Phase 2: Add SHARED
   - ✅ Future: Add more statuses as needed

5. **Separate Rounds Table**: Rounds stored separately
   - ✅ Supports game history
   - ✅ Easy to query past rounds
   - ✅ Can add Phase 3 card data later

6. **ORM + Raw SQL Hybrid Approach**
   - ✅ ORM (SQLAlchemy) for simple CRUD operations
   - ✅ Raw SQL for complex queries and analytics
   - ✅ SQL models for reference and migrations
   - ✅ Best of both worlds: maintainability + performance
   - ✅ SQL queries module for reusable complex queries
   - ✅ SQL injection prevention via parameterized queries

**See**: `docs/plan/future-phases.md` for complete Phase 2 & 3 architecture

---

## When to Use ORM vs Raw SQL

### Use ORM (SQLAlchemy) For:
- ✅ Simple CRUD operations (create, read, update, delete)
- ✅ Type-safe operations
- ✅ Relationship management
- ✅ Automatic query optimization
- ✅ Development speed

### Use Raw SQL For:
- ✅ Complex JOIN queries
- ✅ Aggregations and analytics
- ✅ Performance-critical operations
- ✅ Database-specific features (JSON queries, full-text search)
- ✅ Complex reporting queries

### Example: Hybrid Approach
```python
# Simple operation - use ORM
game = await game_repo.get_by_id(game_id)  # ORM

# Complex query - use raw SQL
games_with_stats = await game_repo.get_games_with_stats()  # Raw SQL
```

---

**Status**: ⏳ Ready for Review - Phase 1 Implementation, Forward Compatible with Phase 2 & 3
