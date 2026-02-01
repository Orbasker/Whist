# Supabase Integration Guide (Phase 2)

## Overview

User authentication and authorization will be handled by **Supabase** (or similar service), not in the FastAPI backend. This simplifies Phase 1 and provides a robust, scalable authentication solution.

## Architecture

### Authentication Flow

```
┌─────────────────┐
│  Frontend       │
│  (Angular/      │
│   Flutter)      │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  Supabase    │   │  FastAPI     │
│  Auth        │   │  Backend     │
│              │   │              │
│  - Login     │   │  - Validate  │
│  - Register  │   │    JWT       │
│  - JWT Token │   │  - Extract   │
│              │   │    user_id    │
└──────────────┘   └──────────────┘
         │                 │
         │                 ▼
         │          ┌──────────────┐
         │          │  Database    │
         │          │  (PostgreSQL)│
         │          │  with RLS    │
         │          └──────────────┘
         │
         ▼
┌──────────────┐
│  Supabase    │
│  Database    │
│  (auth.users)│
└──────────────┘
```

## Phase 1 (Current)

### No Authentication
- ✅ Games can be created without authentication
- ✅ `owner_id` field exists but is `NULL`
- ✅ All games are accessible (no restrictions)
- ✅ Simple local storage or database storage

## Phase 2 (Future)

### Supabase Integration

#### 1. Frontend Authentication

**Angular:**
```typescript
// Install: @supabase/supabase-js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Register
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Get session (includes JWT token)
const { data: { session } } = await supabase.auth.getSession();
```

**Flutter:**
```dart
// Install: supabase_flutter
import 'package:supabase_flutter/supabase_flutter.dart';

// Initialize
await Supabase.initialize(
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key',
);

// Register
final response = await Supabase.instance.client.auth.signUp(
  email: 'user@example.com',
  password: 'password123',
);

// Login
final response = await Supabase.instance.client.auth.signInWithPassword(
  email: 'user@example.com',
  password: 'password123',
);

// Get current user
final user = Supabase.instance.client.auth.currentUser;

// Get session (includes JWT token)
final session = Supabase.instance.client.auth.currentSession;
```

#### 2. FastAPI JWT Validation

```python
# app/core/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jose import JWTError
from app.config import settings

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Validate Supabase JWT token and extract user info"""
    token = credentials.credentials
    
    try:
        # Get Supabase JWT secret from settings
        # Supabase JWT secret is available in Supabase dashboard
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_signature": True}
        )
        
        return {
            "user_id": payload["sub"],  # Supabase user ID
            "email": payload.get("email"),
            "role": payload.get("role", "authenticated")
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

# Optional: Get current user or None (for optional auth)
async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))
) -> dict | None:
    """Get current user if authenticated, None otherwise"""
    if not credentials:
        return None
    return await get_current_user(credentials)
```

#### 3. Protected Endpoints

```python
# app/views/games.py
from app.core.dependencies import get_current_user

@router.get("/games")
async def list_user_games(
    current_user: dict = Depends(get_current_user)
):
    """List games for current user"""
    user_id = current_user["user_id"]
    return await game_service.get_user_games(user_id)

@router.post("/games")
async def create_game(
    game_data: GameCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new game (owned by current user)"""
    user_id = current_user["user_id"]
    return await game_service.create_game(
        players=game_data.players,
        owner_id=user_id
    )
```

#### 4. Database RLS Policies

```sql
-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Games: Owner can manage, participants can view
CREATE POLICY "Game owners can manage"
ON games FOR ALL
USING (owner_id = auth.uid());

CREATE POLICY "Game participants can view"
ON games FOR SELECT
USING (
    owner_id = auth.uid() OR
    id IN (
        SELECT game_id 
        FROM game_participants 
        WHERE user_id = auth.uid()
    )
);

-- Rounds: Participants can view
CREATE POLICY "Participants can view rounds"
ON rounds FOR SELECT
USING (
    game_id IN (
        SELECT id FROM games 
        WHERE owner_id = auth.uid() OR
        id IN (
            SELECT game_id 
            FROM game_participants 
            WHERE user_id = auth.uid()
        )
    )
);
```

#### 5. Configuration

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str
    
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_jwt_secret: str  # From Supabase dashboard
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## Migration Path: Phase 1 → Phase 2

### Step 1: Add Supabase to Project
1. Create Supabase project
2. Get API keys and JWT secret
3. Install Supabase SDKs in frontends
4. Add Supabase config to FastAPI

### Step 2: Update Database Schema
```sql
-- Add owner_id to existing games (nullable, backfill later)
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Create game_participants table
CREATE TABLE game_participants (
    id SERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,  -- References Supabase auth.users
    player_index INTEGER,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(game_id, user_id),
    UNIQUE(game_id, player_index)
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
```

### Step 3: Update FastAPI
1. Add JWT validation dependency
2. Update endpoints to require authentication
3. Use `user_id` from JWT for authorization
4. Test with Supabase tokens

### Step 4: Update Frontends
1. Add Supabase authentication
2. Store JWT token
3. Send token in API requests
4. Handle authentication state

### Step 5: Deploy RLS Policies
1. Create RLS policies in Supabase
2. Test access control
3. Verify users can only access their games

## Benefits of Supabase Approach

### For Phase 1
- ✅ No authentication complexity
- ✅ Focus on core game logic
- ✅ Faster development
- ✅ Simple database schema

### For Phase 2
- ✅ Built-in authentication (no custom code)
- ✅ Multiple auth methods (email, OAuth, magic links)
- ✅ User management UI included
- ✅ Native RLS support
- ✅ Real-time subscriptions
- ✅ Free tier available
- ✅ PostgreSQL database (same as FastAPI)

## Alternative: Self-Hosted Supabase

If you want full control:
- Supabase is open source
- Can self-host on your infrastructure
- Same features, more control
- More setup complexity

## Security Considerations

1. **JWT Secret**: Store in environment variables, never commit
2. **Token Expiration**: Supabase handles token refresh automatically
3. **RLS Policies**: Test thoroughly, they're the primary security layer
4. **CORS**: Configure Supabase CORS for your frontend domains
5. **Rate Limiting**: Supabase includes rate limiting

## Testing

### Local Development
```python
# Test with mock JWT token
def create_test_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "email": "test@example.com",
        "role": "authenticated"
    }
    return jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")
```

### Integration Testing
- Use Supabase test project
- Create test users
- Test authentication flow
- Test RLS policies

---

**Status**: 📋 Phase 2 Planning - Supabase Integration Ready
