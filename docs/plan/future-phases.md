# Future Phases: Multi-User, Real-Time, Full Game

## Phase Overview

### Phase 1: Single Game, Local/Backend (Current)
- ✅ Single game per session
- ✅ Local storage or simple backend
- ✅ Scoring only (no card dealing)
- ✅ No user authentication
- ✅ No game sharing

### Phase 2: Multi-User, Game Sharing, Real-Time (Future)
- 🔄 Multiple games per user
- 🔄 User authentication via Supabase (DECIDED)
- 🔄 Game sharing (players can join games)
- 🔄 Real-time updates (live bidding/scoring)
- 🔄 Persistent games (save forever)
- 🔄 Row Level Security (RLS) via Supabase
- 🔄 Multiple game groups (x,y,z,w can play, also x,y,s,w, etc.)

### Phase 3: Full Card Game Simulation (Future)
- 🔮 Card shuffling and dealing
- 🔮 Remote play (full game remotely)
- 🔮 Scoring-only mode (current functionality)
- 🔮 Card game mechanics

---

## Phase 2: Architecture Requirements

### User Management

#### Authentication
- **Provider**: Supabase (or similar service) - DECIDED
  - ✅ Built-in authentication (email/password, OAuth, etc.)
  - ✅ Built-in Row Level Security (RLS)
  - ✅ JWT tokens automatically handled
  - ✅ User management UI included
  - ✅ Session management handled by Supabase
- **Integration Approach**:
  - FastAPI backend will validate Supabase JWT tokens
  - User data stored in Supabase (not in FastAPI database)
  - FastAPI uses `user_id` from JWT token for authorization
  - RLS policies in Supabase database

#### Database Schema Updates

```sql
-- Users table (Phase 2)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Games table (updated for Phase 2)
CREATE TABLE games (
    id UUID PRIMARY KEY,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR,                    -- Optional game name
    players JSON NOT NULL,           -- ["player1", "player2", "player3", "player4"]
    player_user_ids JSON,            -- [user_id1, user_id2, null, null] - links to users
    scores JSON NOT NULL,
    current_round INTEGER DEFAULT 1,
    status VARCHAR DEFAULT 'active',
    is_shared BOOLEAN DEFAULT false, -- Can others join?
    share_code VARCHAR UNIQUE,      -- Code to share game
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Game participants (Phase 2)
CREATE TABLE game_participants (
    id SERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    player_index INTEGER,            -- Which position (0-3)
    joined_at TIMESTAMP NOT NULL,
    UNIQUE(game_id, user_id),
    UNIQUE(game_id, player_index)
);

-- Rounds table (unchanged, but with user tracking)
CREATE TABLE rounds (
    id SERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    bids JSON NOT NULL,
    tricks JSON NOT NULL,
    scores JSON NOT NULL,
    round_mode VARCHAR NOT NULL,
    trump_suit VARCHAR,
    created_by UUID REFERENCES users(id), -- Who submitted
    created_at TIMESTAMP NOT NULL
);
```

### Row Level Security (RLS)

#### RLS Policies (Supabase)
```sql
-- Enable RLS on tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Games: Owner can do everything, participants can read
CREATE POLICY "Game owners can manage games"
ON games FOR ALL
USING (owner_id = auth.uid());

CREATE POLICY "Game participants can view games"
ON games FOR SELECT
USING (
    owner_id = auth.uid() OR
    id IN (SELECT game_id FROM game_participants WHERE user_id = auth.uid())
);

-- Rounds: Participants can read, owner can manage
CREATE POLICY "Participants can view rounds"
ON rounds FOR SELECT
USING (
    game_id IN (
        SELECT id FROM games 
        WHERE owner_id = auth.uid() OR
        id IN (SELECT game_id FROM game_participants WHERE user_id = auth.uid())
    )
);

-- Game participants: Can view own participation
CREATE POLICY "Users can view own participation"
ON game_participants FOR SELECT
USING (user_id = auth.uid());
```

**Note**: `auth.uid()` is a Supabase function that returns the current user's ID from the JWT token.

### Real-Time Updates

#### WebSocket Architecture
```python
# FastAPI WebSocket support
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, game_id: str):
        await websocket.accept()
        if game_id not in self.active_connections:
            self.active_connections[game_id] = []
        self.active_connections[game_id].append(websocket)
    
    async def broadcast(self, game_id: str, message: dict):
        if game_id in self.active_connections:
            for connection in self.active_connections[game_id]:
                await connection.send_json(message)

@app.websocket("/ws/games/{game_id}")
async def game_websocket(websocket: WebSocket, game_id: str):
    await manager.connect(websocket, game_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle real-time updates
            await manager.broadcast(game_id, data)
    except WebSocketDisconnect:
        manager.disconnect(websocket, game_id)
```

#### Frontend Real-Time Integration

**Angular:**
```typescript
// WebSocket service
@Injectable()
export class WebSocketService {
  private ws: WebSocket;
  
  connect(gameId: string): Observable<any> {
    this.ws = new WebSocket(`ws://localhost:8000/ws/games/${gameId}`);
    return new Observable(observer => {
      this.ws.onmessage = (event) => observer.next(JSON.parse(event.data));
    });
  }
}
```

**Flutter:**
```dart
// WebSocket service
class WebSocketService {
  WebSocket? _socket;
  StreamController<Map<String, dynamic>>? _controller;
  
  Stream<Map<String, dynamic>> connect(String gameId) {
    _socket = WebSocket.connect('ws://localhost:8000/ws/games/$gameId');
    _controller = StreamController<Map<String, dynamic>>.broadcast();
    
    _socket!.listen((data) {
      _controller!.add(jsonDecode(data));
    });
    
    return _controller!.stream;
  }
}
```

### Game Sharing

#### Share Code System
```python
# Generate unique share code
import secrets

def generate_share_code() -> str:
    return secrets.token_urlsafe(8)  # e.g., "aB3dEfGh"

# API endpoint
@router.post("/games/{game_id}/share")
async def create_share_code(
    game_id: str,
    current_user: User = Depends(get_current_user)
):
    game = await game_repo.get_by_id(game_id)
    if game.owner_id != current_user.id:
        raise HTTPException(403, "Not game owner")
    
    share_code = generate_share_code()
    game.share_code = share_code
    game.is_shared = True
    await game_repo.update(game)
    return {"share_code": share_code}

@router.post("/games/join/{share_code}")
async def join_game_by_code(
    share_code: str,
    current_user: User = Depends(get_current_user)
):
    game = await game_repo.get_by_share_code(share_code)
    if not game:
        raise HTTPException(404, "Game not found")
    
    # Add user as participant
    participant = GameParticipant(
        game_id=game.id,
        user_id=current_user.id,
        player_index=None  # Assign next available
    )
    await participant_repo.create(participant)
    return {"game_id": game.id}
```

### Multiple Game Groups

#### Game Management
```python
# List all games for a user
@router.get("/games")
async def list_user_games(
    current_user: User = Depends(get_current_user)
):
    # Games where user is owner
    owned_games = await game_repo.get_by_owner(current_user.id)
    
    # Games where user is participant
    participant_games = await game_repo.get_by_participant(current_user.id)
    
    return {
        "owned": [GameResponse.from_orm(g) for g in owned_games],
        "participating": [GameResponse.from_orm(g) for g in participant_games]
    }
```

---

## Phase 3: Full Card Game Simulation

### Card Game Mechanics

#### Card Representation
```python
# Card model
class Card:
    suit: str  # 'spades', 'clubs', 'diamonds', 'hearts'
    rank: str  # 'A', '2', '3', ..., 'K'
    value: int  # For scoring/ordering

# Deck representation
class Deck:
    cards: List[Card]
    
    def shuffle(self):
        random.shuffle(self.cards)
    
    def deal(self, num_players: int = 4) -> List[List[Card]]:
        # Deal 13 cards to each player
        hands = [[] for _ in range(num_players)]
        for i, card in enumerate(self.cards):
            hands[i % num_players].append(card)
        return hands
```

#### Database Schema Updates (Phase 3)

```sql
-- Cards in game (Phase 3)
CREATE TABLE game_cards (
    id SERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    player_index INTEGER NOT NULL,  -- Which player (0-3)
    card_suit VARCHAR NOT NULL,
    card_rank VARCHAR NOT NULL,
    position INTEGER,                -- Order in hand
    played_at TIMESTAMP,             -- When card was played
    trick_number INTEGER,            -- Which trick
    UNIQUE(game_id, round_number, player_index, position)
);

-- Tricks tracking (Phase 3)
CREATE TABLE tricks (
    id SERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    trick_number INTEGER NOT NULL,   -- 1-13
    cards_played JSON NOT NULL,       -- [{player: 0, card: {...}}, ...]
    winner_index INTEGER,            -- Who won the trick
    created_at TIMESTAMP NOT NULL
);
```

#### Game Modes

```python
# Game mode enum
class GameMode(enum.Enum):
    SCORING_ONLY = "scoring_only"  # Current Phase 1-2 functionality
    FULL_REMOTE = "full_remote"   # Full card game remotely
    HYBRID = "hybrid"              # Mix of remote and local

# Game settings
class GameSettings:
    mode: GameMode
    auto_deal: bool = True
    show_cards: bool = False  # For remote play
    timer_enabled: bool = False
```

#### API Endpoints (Phase 3)

```
POST   /api/v1/games/{id}/rounds/{round}/deal    # Deal cards
POST   /api/v1/games/{id}/rounds/{round}/play    # Play a card
GET    /api/v1/games/{id}/rounds/{round}/hand     # Get player's hand
GET    /api/v1/games/{id}/rounds/{round}/tricks  # Get tricks
```

---

## Architecture Considerations for Future Phases

### Phase 1 → Phase 2 Migration Path

#### Database Migration Strategy
1. **Add user tables** without breaking existing games
2. **Make owner_id nullable** initially (backfill later)
3. **Add participant tables** alongside existing structure
4. **Gradual migration** of existing games to user-owned

#### Backward Compatibility
- Phase 1 games continue to work
- Phase 2 features are opt-in
- Gradual migration path

### Phase 2 → Phase 3 Migration Path

#### Card Game Integration
- Add card tables without breaking scoring-only mode
- Game mode determines which features are active
- Scoring-only games don't need card tables

### Technology Choices for Phase 2

#### Authentication Provider: Supabase (DECIDED)

**Why Supabase:**
- ✅ Built-in authentication (email/password, OAuth, magic links)
- ✅ Native Row Level Security (RLS) on PostgreSQL
- ✅ Real-time subscriptions built-in
- ✅ PostgreSQL database (same as FastAPI backend)
- ✅ Auto-generated REST API
- ✅ Free tier available
- ✅ Open source (can self-host if needed)

**Integration Architecture:**
```
Frontend (Angular/Flutter)
    │
    ├──► Supabase Auth (login, register)
    │       │
    │       └──► JWT Token
    │
    └──► FastAPI Backend
            │
            ├──► Validate JWT Token (Supabase)
            │
            └──► Use user_id from token
                    │
                    └──► Database operations (with RLS)
```

**FastAPI Integration:**
- FastAPI validates Supabase JWT tokens
- Extracts `user_id` from token
- Uses `user_id` for authorization (not user storage)
- Database RLS policies enforce access control

#### Real-Time Options

| Solution | Pros | Cons |
|----------|------|------|
| **FastAPI WebSockets** | Native, simple | Manual connection management |
| **Supabase Realtime** | Built-in, easy | Vendor lock-in |
| **Socket.io** | Mature, cross-platform | Additional dependency |
| **Server-Sent Events** | Simple, HTTP-based | One-way only |

**Recommendation**: FastAPI WebSockets for Phase 2 (already using FastAPI)

---

## Updated Project Structure (Phase 2 Ready)

```
backend/
├── app/
│   ├── models/
│   │   ├── user.py              # Phase 2
│   │   ├── game_participant.py  # Phase 2
│   │   └── game_card.py          # Phase 3
│   ├── schemas/
│   │   ├── user.py              # Phase 2
│   │   ├── auth.py              # Phase 2
│   │   └── card.py               # Phase 3
│   ├── services/
│   │   ├── auth_service.py      # Phase 2
│   │   ├── websocket_service.py # Phase 2
│   │   └── card_service.py      # Phase 3
│   └── views/
│       ├── auth.py              # Phase 2
│       └── websocket.py         # Phase 2
```

---

## Implementation Roadmap

### Phase 1 (Current)
- ✅ Basic FastAPI backend
- ✅ Single game support
- ✅ Scoring logic
- ✅ Angular + Flutter frontends

### Phase 2 (Future)
- [ ] Supabase integration (authentication)
- [ ] JWT token validation in FastAPI
- [ ] Multi-game support
- [ ] Game sharing (share codes)
- [ ] Real-time updates (Supabase Realtime or WebSockets)
- [ ] RLS implementation (Supabase policies)
- [ ] Game participants management
- [ ] Persistent game history

### Phase 3 (Future)
- [ ] Card shuffling/dealing
- [ ] Card play mechanics
- [ ] Trick tracking
- [ ] Remote play mode
- [ ] Game mode selection (scoring-only vs full)

---

## Design Decisions for Future Compatibility

### Phase 1 Design Choices

1. **UUID for game IDs** (not auto-increment)
   - ✅ Supports multi-user scenarios
   - ✅ No conflicts when merging databases

2. **JSON for players/scores** (flexible)
   - ✅ Easy to extend with user IDs later
   - ✅ Can add metadata without schema changes

3. **Separate rounds table**
   - ✅ Supports game history
   - ✅ Easy to query past rounds

4. **Status field on games**
   - ✅ Can add more statuses later (shared, active, completed, etc.)

5. **Extensible schema**
   - ✅ Add columns without breaking existing data
   - ✅ Nullable fields for optional features

---

**Status**: 📋 Planning Document - Ready for Phase 1 Implementation
