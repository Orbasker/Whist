# Email Invitations & Real-Time Participation

## Overview

This document outlines a **lightweight implementation** for email-based game invitations and real-time participation **without creating database tables**. 

### Approach Options:

**Option A: Simple (Current Plan)**
- **JWT tokens** for invitation links (no table needed)
- **Email service APIs** (Resend/SendGrid) for sending invitations
- **FastAPI WebSockets** for live updates (built-in, works with Neon)
- **Existing `player_user_ids` field** in games table to track participants

**Option B: Google Cloud Services** ⭐ (Better for scale)
- **JWT tokens** for invitation links (no table needed)
- **Cloud Tasks** for async email sending
- **Cloud Pub/Sub** for real-time messaging
- **Cloud Functions** for serverless invitation handling
- **Existing `player_user_ids` field** in games table to track participants

## Architecture Components

### 1. No Database Table Needed! 🎉

Instead of a `game_invitations` table, we'll use **JWT-based invitation tokens** that are self-contained:

```python
# Invitation token payload (stored in JWT, not database)
{
    "game_id": "uuid",
    "inviter_id": "uuid",
    "invitee_email": "player@example.com",
    "player_index": 0,  # Which seat (0-3)
    "exp": 1234567890,  # Expiration (7 days)
    "type": "game_invitation"
}
```

**Benefits:**
- ✅ No database table needed
- ✅ Stateless (works across servers)
- ✅ Self-validating (JWT signature)
- ✅ Automatic expiration
- ✅ Leverages existing JWT infrastructure

**Tracking participants:**
- Use existing `games.player_user_ids` JSON field: `[user_id1, user_id2, null, null]`
- When invitation accepted → update `player_user_ids[player_index] = user_id`
- That's it! No separate table needed.

### 2. Email Service Integration (No Database Needed)

#### Recommended Services:
1. **Resend** ⭐ (Best for this use case)
   - Modern, simple API
   - Free tier: 3,000 emails/month
   - Great developer experience
   - Built-in templates

2. **SendGrid**
   - Free tier: 100 emails/day
   - Reliable, well-documented
   - Good deliverability

3. **Brevo (formerly Sendinblue)**
   - Free tier: 300 emails/day
   - Good for transactional emails

4. **AWS SES**
   - Very cheap ($0.10 per 1,000 emails)
   - Requires AWS setup

#### Implementation:
```python
# backend/app/services/email_service.py
import httpx
from app.config import settings

class EmailService:
    async def send_invitation(self, email: str, invitation_token: str, game_name: str):
        """Send invitation email with JWT token link"""
        invitation_link = f"{settings.frontend_url}/invite/{invitation_token}"
        
        # Use Resend API (or SendGrid, etc.)
        async with httpx.AsyncClient() as client:
            await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_email}"},
                json={
                    "from": settings.from_email,
                    "to": email,
                    "subject": f"You've been invited to play: {game_name}",
                    "html": f"""
                        <h2>You've been invited!</h2>
                        <p>Click here to join: <a href="{invitation_link}">Join Game</a></p>
                        <p>This link expires in 7 days.</p>
                    """
                }
            )
```

**No database needed** - just send the email with the JWT token link!

### 3. Real-Time Communication (Neon-Compatible Options)

#### Option 1: FastAPI WebSockets (Recommended - Built-in!)
Since you're using **Neon** (not Supabase), use **FastAPI's native WebSocket support**:

```python
# backend/app/websocket/game_room.py
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
from uuid import UUID

class GameRoomManager:
    """In-memory WebSocket manager (no database needed)"""
    
    def __init__(self):
        self.active_connections: Dict[UUID, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, game_id: UUID, user_id: UUID):
        await websocket.accept()
        if game_id not in self.active_connections:
            self.active_connections[game_id] = set()
        self.active_connections[game_id].add(websocket)
    
    async def disconnect(self, websocket: WebSocket, game_id: UUID):
        if game_id in self.active_connections:
            self.active_connections[game_id].discard(websocket)
    
    async def broadcast(self, game_id: UUID, message: dict):
        """Broadcast message to all connected clients in a game room"""
        if game_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[game_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            # Clean up disconnected clients
            self.active_connections[game_id] -= disconnected
```

**Benefits:**
- ✅ Built into FastAPI (no external service)
- ✅ Works with Neon database
- ✅ Full control over messages
- ✅ No additional infrastructure needed

#### Option 2: Third-Party Real-Time Services (If you want managed infrastructure)

**Alternative Services (if you want managed infrastructure):**

1. **Pusher** - Managed WebSocket service
   - Free tier: 200k messages/day
   - Easy integration
   - Built-in presence channels

2. **Ably** - Real-time messaging platform
   - Free tier: 3M messages/month
   - Good for scaling

3. **Socket.io with Redis** - For multi-server setups
   - More complex setup
   - Good for horizontal scaling

**Recommendation:** Use FastAPI WebSockets (Option 1) - it's simpler and works great with Neon!

---

## Google Cloud Alternative (Option B) ⭐

If you want to use **Google Cloud** services, here are better options:

### 1. Real-Time: Cloud Pub/Sub ⭐⭐⭐

**Best for:** Scalable real-time messaging without managing WebSocket servers

```python
# Backend: Publish game updates
from google.cloud import pubsub_v1

publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path(project_id, 'game-updates')

# When game state changes
publisher.publish(topic_path, json.dumps({
    'game_id': str(game_id),
    'event': 'bid_submitted',
    'data': {...}
}).encode('utf-8'))
```

```typescript
// Frontend: Subscribe via Cloud Pub/Sub (via your backend WebSocket bridge)
// Or use Cloud Pub/Sub client libraries
```

**Benefits:**
- ✅ Fully managed (no server to maintain)
- ✅ Scales automatically
- ✅ Reliable message delivery
- ✅ Free tier: 10GB/month
- ✅ Works with Neon database

**Cost:** ~$0.40 per million messages after free tier

### 2. Email: Cloud Tasks + SendGrid/Gmail API ⭐⭐⭐

**Best for:** Reliable, scalable email delivery

```python
# Backend: Queue email via Cloud Tasks
from google.cloud import tasks_v2

client = tasks_v2.CloudTasksClient()
queue_path = client.queue_path(project_id, location, 'email-queue')

task = {
    'http_request': {
        'http_method': tasks_v2.HttpMethod.POST,
        'url': 'https://your-app.com/send-invitation',
        'body': json.dumps({
            'email': 'player@example.com',
            'token': invitation_token
        }).encode()
    }
}
client.create_task(request={'parent': queue_path, 'task': task})
```

**Benefits:**
- ✅ Async processing (doesn't block API)
- ✅ Automatic retries
- ✅ Rate limiting built-in
- ✅ Free tier: 1M operations/month
- ✅ Can use Gmail API or SendGrid

**Cost:** Free for first 1M operations/month, then $0.40 per million

### 3. Serverless: Cloud Functions ⭐⭐

**Best for:** Invitation acceptance webhooks, email sending

```python
# Cloud Function: Send invitation email
import functions_framework
from sendgrid import SendGridAPIClient

@functions_framework.http
def send_invitation(request):
    data = request.get_json()
    # Send email via SendGrid
    # Return success
```

**Benefits:**
- ✅ Serverless (no server management)
- ✅ Auto-scaling
- ✅ Pay per invocation
- ✅ Free tier: 2M invocations/month

### 4. Real-Time Database: Cloud Firestore ⭐⭐

**Best for:** Real-time game state sync (alternative to Neon for this feature)

```typescript
// Frontend: Real-time listener
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

const db = getFirestore();
const gameRef = doc(db, 'games', gameId);

onSnapshot(gameRef, (snapshot) => {
  const gameData = snapshot.data();
  updateGameState(gameData);
});
```

**Benefits:**
- ✅ Real-time listeners (automatic updates)
- ✅ Works alongside Neon
- ✅ Free tier: 50K reads/day, 20K writes/day
- ✅ No WebSocket code needed

**Cost:** Free tier generous, then pay-as-you-go

---

### Google Cloud vs Simple Approach Comparison

| Feature | Simple (Option A) | Google Cloud (Option B) |
|---------|-------------------|------------------------|
| **Setup Complexity** | ⭐ Easy | ⭐⭐ Moderate (GCP setup) |
| **Cost** | ⭐ Free (Resend free tier) | ⭐⭐ Low (generous free tiers) |
| **Scalability** | ⭐⭐ Good (FastAPI) | ⭐⭐⭐ Excellent (auto-scaling) |
| **Maintenance** | ⭐⭐ Manage WebSocket server | ⭐⭐⭐ Fully managed |
| **Real-Time** | FastAPI WebSockets | Cloud Pub/Sub or Firestore |
| **Email** | Resend/SendGrid API | Cloud Tasks + SendGrid |
| **Best For** | Small-medium scale | Large scale, production |

### Recommendation:

- **Start with Option A (Simple)** if you want to move fast and keep it simple
- **Use Option B (Google Cloud)** if you need:
  - Auto-scaling
  - Fully managed infrastructure
  - Production-grade reliability
  - Already using GCP for other services

**Hybrid Approach:** Use Neon for database + Cloud Pub/Sub for real-time + Resend for emails (best of both worlds!)

### 4. API Endpoints (Minimal, No Database Queries!)

#### Invitation Endpoints
```python
# POST /api/v1/games/{game_id}/invite
# Generate JWT invitation token and send email
{
    "emails": ["player1@example.com", "player2@example.com"],
    "player_indices": [0, 1]  # Optional: which seats
}
# Returns: { "sent": 2, "tokens": [...] }  (tokens for testing)

# GET /api/v1/invite/{token}
# Validate JWT token and return game info (public, no auth)
# Returns: { "game_id": "...", "game_name": "...", "player_index": 0 }

# POST /api/v1/invite/{token}/accept
# Accept invitation (validates JWT, updates player_user_ids)
# Returns: { "game": {...}, "joined": true }
```

**Key:** All invitation data is in the JWT token - no database queries needed!

#### Real-Time Endpoints
```python
# WebSocket /api/v1/games/{game_id}/ws
# Connect for real-time updates (FastAPI WebSocket)

# POST /api/v1/games/{game_id}/rounds/bids
# Submit bids (triggers WebSocket broadcast to all connected clients)

# POST /api/v1/games/{game_id}/rounds/tricks  
# Submit tricks (triggers WebSocket broadcast to all connected clients)
```

**Frontend WebSocket Connection:**
```typescript
// Frontend: Connect to game WebSocket
const ws = new WebSocket(`ws://localhost:8000/api/v1/games/${gameId}/ws`);

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Update game state in real-time
  updateGameState(update);
};

// Send messages (if needed)
ws.send(JSON.stringify({ type: 'ping' }));
```

### 5. Frontend Components

#### New Components:
1. **Invitation Form Component**
   - Input for email addresses
   - Select player positions
   - Send invitations button
   - Show pending invitations

2. **Invitation Acceptance Page**
   - Public route: `/invite/{token}`
   - Show game details
   - Accept/Decline buttons
   - Sign up/Login if needed

3. **Real-Time Game View**
   - WebSocket connection
   - Live updates for bids/tricks
   - Turn indicators
   - Notification system

4. **Participant List Component**
   - Show all participants
   - Email addresses
   - Join status
   - Remove participant (owner only)

### 6. User Flow (No Database Tables!)

#### Creating Game with Invitations:
1. User creates game
2. User enters email addresses for participants
3. **Backend generates JWT invitation tokens** (no database write!)
4. **Email service sends emails** with token links
5. Game status: "waiting_for_players" (optional field in games table)

#### Accepting Invitation:
1. User clicks email link: `/invite/{token}`
2. **Frontend validates JWT token** (no database query!)
3. If not logged in: prompt to sign up/login
4. If logged in: **POST /invite/{token}/accept**
5. **Backend validates JWT, updates `games.player_user_ids[player_index] = user_id`**
6. Redirect to game page

**Only one database update:** `games.player_user_ids` - that's it!

#### Real-Time Participation:
1. User joins game page
2. WebSocket connection established
3. User sees current game state
4. When it's their turn: can submit bids/tricks
5. All participants see live updates
6. Notifications for important events

### 7. Email Templates

#### Invitation Email:
```
Subject: You've been invited to play Whist!

Hi {invitee_name},

{inviter_name} has invited you to join a game of Whist!

Game: {game_name}
Your Position: Player {player_index + 1}

Click here to accept: {acceptance_link}

This invitation expires on {expires_at}.

If you don't have an account, you'll be prompted to create one.
```

#### Acceptance Confirmation:
```
Subject: Welcome to the Whist game!

Hi {player_name},

You've successfully joined the game "{game_name}".

Game Link: {game_link}

The game will begin once all players have joined.
```

### 8. Security Considerations (JWT-Based)

1. **Invitation Tokens (JWT)**
   - ✅ Cryptographically signed (same as auth tokens)
   - ✅ Automatic expiration (built into JWT)
   - ✅ Self-validating (no database lookup)
   - ✅ Can be revoked by invalidating signature secret (if needed)

2. **Authorization**
   - Only game owner can generate invitation tokens
   - JWT signature validates authenticity
   - Token contains inviter_id for verification

3. **Rate Limiting** (Optional)
   - Limit invitations per game (check `player_user_ids` length)
   - Limit invitations per user per day (in-memory counter or Redis)
   - Prevent spam

4. **Email Validation**
   - Validate email format
   - Check `player_user_ids` for duplicates
   - Prevent self-invitations (check inviter_id != invitee_user_id)

### 9. Implementation Phases (Simplified!)

#### Phase 1: Basic Invitations (No Database, No Real-Time)
- [ ] JWT invitation token generation
- [ ] Email service integration (Resend/SendGrid)
- [ ] Invitation API endpoints (`/invite/{token}`)
- [ ] Invitation acceptance flow
- [ ] Update `player_user_ids` on acceptance

**Time estimate: 2-3 hours** (much faster without database!)

#### Phase 2: Real-Time Updates
- [ ] FastAPI WebSocket endpoint (`/games/{id}/ws`)
- [ ] Game room manager (in-memory connection tracking)
- [ ] Broadcast game updates on bid/trick submission
- [ ] Frontend WebSocket client
- [ ] Live game state synchronization

**Time estimate: 3-4 hours**

#### Phase 3: Enhanced Features (Optional)
- [ ] Turn-based notifications
- [ ] Participant presence indicators
- [ ] Email reminders for pending invitations
- [ ] Mobile push notifications

### 10. Environment Variables

```bash
# Email Service (choose one)
RESEND_EMAIL=re_xxxxx  # Resend API token (named RESEND_EMAIL in .env)
# OR
SENDGRID_API_KEY=SG.xxxxx
# OR
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx

# Email Settings
FROM_EMAIL=noreply@wistgame.com
FRONTEND_URL=http://localhost:4200

# JWT Invitation Settings (uses same secret as auth)
INVITATION_EXPIRY_DAYS=7
MAX_INVITATIONS_PER_GAME=4
```

### 11. Testing Strategy

1. **Unit Tests**
   - Invitation creation/validation
   - Email service mocking
   - Token generation/validation

2. **Integration Tests**
   - End-to-end invitation flow
   - WebSocket connection handling
   - Real-time update broadcasting

3. **E2E Tests**
   - Full user flow: create → invite → accept → play
   - Multiple participants
   - Real-time synchronization

## Next Steps (Simplified!)

1. **Choose email service** (Resend recommended - easiest)
2. **Implement JWT invitation token generation** (reuse existing JWT code)
3. **Add email service integration** (simple HTTP API call)
4. **Build invitation API endpoints** (validate JWT, update `player_user_ids`)
5. **Create frontend invitation components**
6. **Add real-time WebSocket connections** (FastAPI native WebSockets)

## Summary: Why This Approach is Better

✅ **No database table needed** - invitations are stateless JWT tokens  
✅ **Faster to implement** - reuse existing JWT infrastructure  
✅ **Simpler architecture** - less code, less complexity  
✅ **Scalable** - no database queries for invitation validation  
✅ **Self-contained** - invitation data is in the token itself  

**The only database update:** `games.player_user_ids[player_index] = user_id` when someone accepts.

This is a **side feature** that doesn't need its own table! 🎉
