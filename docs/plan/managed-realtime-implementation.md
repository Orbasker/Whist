# Managed Real-Time Implementation (Supabase / Firebase)

This document describes how to add a **managed real-time service** (Supabase Realtime or Firebase) alongside the existing Neon database and optional FastAPI WebSockets. Neon does not provide a Realtime product, so we use Supabase Realtime (Broadcast) or Firebase Realtime as a separate layer for game updates.

## Why managed real-time?

- Offload WebSocket connection management and scaling to the vendor.
- Works across multiple backend instances without Redis or sticky sessions.
- Same message shapes as today; we keep game logic in FastAPI and Neon.

## Architecture

```
┌─────────────────┐     REST (submit_bids, submit_tricks)     ┌──────────────────┐
│  Angular app    │ ────────────────────────────────────────► │  FastAPI backend  │
│                 │                                            │  (Neon DB)       │
│                 │ ◄────────────────────────────────────────  │                  │
└────────┬────────┘     Supabase Realtime / Firebase          └────────┬─────────┘
         │              (broadcast: game_update, phase_update, etc.)   │
         │  subscribe to channel "game:{id}"                           │  publish
         │  send ephemeral (bid_selection, etc.) via channel           │  after DB
         └──────────────────────────────┬─────────────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  Supabase Realtime  │
                              │  or Firebase        │
                              └─────────────────────┘
```

- **Game mutations** (submit_bids, submit_tricks): frontend calls **REST** (existing `POST /games/{id}/rounds/bids` and `.../tricks`). Backend persists to Neon, then **publishes** the new game state to the managed service (Supabase Broadcast API or Firebase).
- **Ephemeral UI** (bid_selection, trick_selection, trump_selection, bet_locked, etc.): frontend sends via the **managed service channel** (e.g. Supabase `channel.send()`); all subscribers (including other clients) receive it. No backend round-trip.
- **Receiving**: frontend subscribes to one channel per game (e.g. `game:{game_id}`) and receives the same message types as today (`game_update`, `phase_update`, `bid_selection`, etc.).

## Option A: Supabase Realtime (recommended first)

Supabase Realtime provides **Broadcast** with a simple REST API for server-side publish and a JS client for subscribe/send. You can use **only** Realtime (no Supabase DB or Auth); Neon remains the source of truth.

### Backend (FastAPI)

1. **Config** (e.g. in `app/config.py` or env):
   - `SUPABASE_URL` — e.g. `https://<project_ref>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` — for server-side broadcast (keep secret). If not set, publisher is no-op.

2. **Realtime publisher** (e.g. `app/core/realtime_publisher.py`):
   - `async def publish(game_id: str, message: dict) -> None`
   - POST to `{SUPABASE_URL}/realtime/v1/api/broadcast` with:
     - Headers: `apikey: SUPABASE_SERVICE_ROLE_KEY`, `Content-Type: application/json`
     - Body: `{"messages": [{"topic": "game:" + game_id, "event": "message", "payload": message}]}`
   - If `SUPABASE_URL` is empty, no-op. Use `httpx.AsyncClient` for the POST.

3. **Wiring**: After every place that currently calls `connection_manager.broadcast_*`, also call `realtime_publisher.publish(game_id, message_dict)` with the same payload you send over WebSockets (e.g. `{"type": "game_update", "game": game_state}`). You can keep WebSocket and Supabase in parallel (both receive the same updates) or disable WebSocket when Supabase is configured.

### Frontend (Angular)

1. **Dependency**: `npm install @supabase/supabase-js`

2. **Environment**: Add `supabaseUrl` and `supabaseAnonKey` (or a key that can subscribe to public broadcast). Get from [Supabase project Connect dialog](https://supabase.com/dashboard/project/_?showConnect=true).

3. **Supabase Realtime service** (e.g. `realtime.service.ts` or `supabase-realtime.service.ts`):
   - Same surface as `WebSocketService` for the parts `GameService` uses:
     - `connect(gameId): Observable<WebSocketMessage>`
     - `disconnect()`
     - `send(message)`
     - `isConnected(): boolean`
     - `getConnectionStatus(): Observable<boolean>`
   - **connect(gameId)**:
     - Create channel with topic `game:${gameId}` (or `game-${gameId}`).
     - Subscribe to broadcast event (e.g. `event: 'message'`) and push `payload` to a `Subject<WebSocketMessage>` (same shape as current WebSocket messages).
     - On SUBSCRIBED, set connection status to true.
     - Return the observable.
   - **send(message)**:
     - If `message.type === 'submit_bids'` or `'submit_tricks'`: call existing **REST** endpoints (e.g. `ApiService` or HTTP to `POST /games/{id}/rounds/bids` or `.../tricks`). Do not send over the channel.
     - Else: `channel.send({ type: 'broadcast', event: 'message', payload: message })` so other clients (and optionally self, if config `broadcast: { self: true }`) receive it.

4. **Choosing transport**: Use an **InjectionToken** or environment flag (e.g. `useSupabaseRealtime: true`) to provide either `WebSocketService` or the new Supabase Realtime service to `GameService`. That way you can switch without changing `GameService` logic.

### Supabase project setup

1. Create a project at [supabase.com](https://supabase.com).
2. Get **Project URL** and **service_role** (or anon) key from Project Settings → API. Use **service_role** only on the backend for broadcast; use **anon** (or publishable key) on the frontend for subscribe/send.
3. No database or auth configuration needed if you use Supabase only for Realtime Broadcast.

---

## Option B: Firebase Realtime Database

Use Firebase as the real-time bus: backend writes game state to a path like `/games/{game_id}/last_update` when state changes; frontend subscribes with `onValue` or `onChildChanged`. Ephemeral events can be written to `/games/{game_id}/ephemeral/{event_id}` by clients.

### Backend

1. **Config**: `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON` (path or JSON string).
2. **Firebase Admin SDK**: Initialize with service account; get a reference to the Realtime Database. On each broadcast-worthy action, `ref(`games/${game_id}/last_update`).set({ type, payload, timestamp })`.
3. **Wiring**: Same as Supabase—call the Firebase publisher after each `connection_manager.broadcast_*` (or replace broadcasts with Firebase-only writes).

### Frontend

1. Install `firebase` (or AngularFire).
2. Initialize Firebase with your project config (apiKey, databaseURL, etc.).
3. Subscribe to `ref(db, 'games/' + gameId + '/last_update')` with `onValue`; on snapshot, map to `WebSocketMessage` and push to the same observable. For ephemeral, clients can write to a sibling path and listen to that path for other clients’ updates.
4. **send(message)**: submit_bids/submit_tricks → REST; other types → write to Firebase (e.g. `/games/{id}/ephemeral/{pushId}`) so others receive.

---

## Implementation checklist

### Phase 1: Supabase Realtime (recommended)

- [x] Backend: Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` to config; add `realtime_publisher` module that POSTs to Supabase Broadcast API.
- [x] Backend: After each `broadcast_*` (in `ConnectionManager`), call `realtime_publisher.publish(game_id, message_dict)` when Supabase is configured.
- [x] Frontend: Add `@supabase/supabase-js`; add `supabaseUrl`, `supabaseAnonKey`, and `useSupabaseRealtime` to environment.
- [x] Frontend: Implement `SupabaseRealtimeService` (subscribe to channel `game:{id}`, send ephemeral via channel, submit_bids/submit_tricks via REST).
- [x] Frontend: Add `REALTIME_SERVICE` injection token and choose WebSocket vs Supabase Realtime based on `environment.useSupabaseRealtime` and Supabase URL/key.
- [ ] Docs: Update deployment/runbooks with Supabase env vars and link to this plan.

### Phase 2 (optional)

- [ ] Remove or deprecate FastAPI WebSocket endpoint when Supabase (or Firebase) is the only transport.
- [ ] Add channel-level auth (e.g. short-lived tokens for `game:{id}`) if required.

---

## Neon

Neon remains the **database and auth** provider. It does not offer a Realtime product; this implementation uses Supabase or Firebase **only** for real-time delivery, not for storage or authentication.
