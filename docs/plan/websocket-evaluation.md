# WebSocket: Evaluation, Alternatives, and Management

This document evaluates whether WebSockets are the best option for real-time game updates in the Whist app, documents current usage, and recommends improvements or a migration path.

---

## 1. Current WebSocket Usage

### 1.1 Architecture Overview

- **Backend**: FastAPI native WebSocket support.
- **Endpoint**: `WS /api/v1/ws/games/{game_id}` (router prefix `/ws` under API v1).
- **Connection model**: One WebSocket per game view; all players in a game share the same “room” (same `game_id`). Connections are in-memory per process (no Redis/pub-sub across instances).

### 1.2 Backend Components

| File | Role |
|------|------|
| `backend/app/views/websocket.py` | WebSocket endpoint: accepts connection, sends initial game state + phase, then loops on `receive_text()` to handle client messages. |
| `backend/app/core/websocket_manager.py` | `ConnectionManager`: holds `active_connections[game_id]` (set of WebSockets) and `game_states[game_id]` (ephemeral UI state: bid/trick/trump selections, phase). Broadcasts to all connections in a game room. |
| `backend/app/views/rounds.py` | REST endpoints for bids/tricks also call `connection_manager.broadcast_*` so that clients using REST still get real-time updates if others are on WebSocket. |

**Connection lifecycle**

1. Client connects to `/api/v1/ws/games/{game_id}`.
2. Server accepts, adds the socket to `ConnectionManager` for that `game_id`, and sends:
   - `game_update` (full game state)
   - `phase_update` (bidding | tricks)
   - Any existing ephemeral state (bid_selection, trick_selection, trump_selection) so the new client catches up.
3. Server runs a loop: `receive_text()` → parse JSON → dispatch by `type` (see below) → broadcast or reply.
4. On `WebSocketDisconnect` or error, the connection is removed from the manager.

**Message types (server → client)**

- `game_update` — full game state (after bids/tricks submitted).
- `phase_update` — phase change (bidding ↔ tricks).
- `bid_selection` / `trick_selection` / `trump_selection` — live UI state (hover/selection before submit).
- `bids_submitted` / `bet_sent` — bids committed.
- `tricks_submitted` / `round_result_sent` — tricks committed and round result.
- `bet_change` / `bet_locked` / `round_result_changed` / `round_score_locked` — incremental UI locks.
- `error` — validation or server error.

**Message types (client → server)**

- `submit_bids` — commit bids and trump; server persists, then broadcasts.
- `submit_tricks` — commit tricks; server persists, then broadcasts.
- `bid_selection` / `trick_selection` / `trump_selection` — ephemeral UI state (broadcast only).
- `bet_change` / `bet_locked` / `round_result_changed` / `round_score_locked` — broadcast only.

All messages are JSON; structure is documented in `WebSocketMessage` in the frontend and in the endpoint docstring.

### 1.3 Frontend Usage

| File | Role |
|------|------|
| `angular-web/src/app/core/services/websocket.service.ts` | Builds WS URL from `environment.apiUrl` (replace `/api/v1`, switch `http`→`ws`), exposes `connect(gameId)`, `disconnect()`, `send()`, `isConnected()`, and an `Observable<WebSocketMessage>`. Reconnect: up to 5 attempts, 3s delay. |
| `angular-web/src/app/core/services/game.service.ts` | On `loadGame(gameId)` subscribes to the WebSocket stream and maps message types to internal state (e.g. `game_update` → `gameState$`, `bid_selection` → `liveBidSelections$`). Sends `submit_bids` / `submit_tricks` and ephemeral types via `wsService.send()`. |

**URL construction**

- `apiUrl` = e.g. `http://localhost:8000/api/v1`.
- Base URL = `apiUrl.replace('/api/v1', '')` → `http://localhost:8000`.
- WS URL = base with `http`→`ws` + `/api/v1/ws/games/${gameId}` → `ws://localhost:8000/api/v1/ws/games/{id}`.

### 1.4 Characteristics of Current Use

- **Bidirectional**: Clients send commands (submit bids/tricks) and ephemeral UI updates; server pushes game state and phase.
- **Room-based**: All connections for a `game_id` receive the same broadcasts.
- **Ephemeral state**: Bid/trick/trump “selections” and “locked” flags are not persisted; they live only in `ConnectionManager.game_states` and are replayed to new joiners.
- **Single-process**: Connection manager is in-memory; multi-instance deployment would need a shared bus (e.g. Redis pub/sub) to broadcast across instances.
- **No auth on WS**: The endpoint does not validate JWT or session; anyone with `game_id` can connect. Auth is assumed at REST layer; securing the WS is a recommended improvement.

---

## 2. Alternatives Evaluation

### 2.1 WebSockets (Current)

| Pros | Cons |
|------|------|
| Full duplex; one connection for push and client commands. | Connection state and reconnection logic on client and server. |
| Low overhead once connected; efficient for frequent small messages. | No built-in auth in current implementation. |
| Native in FastAPI; no extra service. | Single-process only; horizontal scaling needs a shared message bus. |
| Fits “submit action + broadcast” and “ephemeral UI sync” well. | Proxies/load balancers must support WebSocket (most do). |

**Verdict**: Well-suited for this game: many small, bidirectional messages (submissions + live selections).

### 2.2 Server-Sent Events (SSE)

| Pros | Cons |
|------|------|
| Simple HTTP; auto-reconnect in browser; easy to add (e.g. FastAPI `StreamingResponse`). | **One-way only** (server → client). |
| No custom protocol; works through most proxies. | Client would still need REST (or a second SSE channel) for submit_bids / submit_tricks and ephemeral updates. |
| Less code on server than full WebSocket handler. | Would require either (a) REST for all writes + SSE for updates, or (b) a hybrid that is more complex than a single WS. |

**Verdict**: Not a good fit as a full replacement. The game needs **client → server** for submissions and live selections; SSE would force a REST+SSE hybrid and more moving parts than the current single WebSocket.

### 2.3 Polling (REST only)

| Pros | Cons |
|------|------|
| No WebSocket code; trivial to scale (stateless HTTP). | Higher latency (poll interval) and more requests. |
| Easy to reason about and debug. | Poor UX for “live” bid/trick selection and instant updates. |
| Works everywhere. | More load on server and client for the same real-time feel. |

**Verdict**: Acceptable as a **fallback** when WebSocket is unavailable; not desirable as the primary real-time mechanism.

### 2.4 Managed Real-Time Services

Examples: **Pusher**, **Ably**, **Supabase Realtime**, **Firebase Realtime**, etc.

| Pros | Cons |
|------|------|
| Offload connection management, scaling, and often reconnection. | Extra cost and vendor dependency. |
| Often provide presence and channels, which map to “game rooms”. | Game logic (submit_bids, submit_tricks) still runs in our backend; we’d send REST to our API, then publish to the service, so architecture is more complex. |
| Can simplify multi-region and horizontal scaling. | Need to keep auth and authorization in our backend; managed service would need tokens or server-side publish. |

**Verdict**: Reasonable for **future scaling** or if the team wants to avoid operating WebSocket infrastructure. For current scale and “one game room per process” model, FastAPI WebSockets are simpler and sufficient.

**Note on Neon**: Neon (our current database and auth provider) does **not** offer a managed real-time/pub-sub product. It provides serverless Postgres and Neon Auth only. For a managed real-time layer we use a separate service such as **Supabase Realtime** (Broadcast) or **Firebase Realtime**. See [Managed real-time implementation](managed-realtime-implementation.md) for an implementation plan using Supabase or Firebase alongside Neon.

---

## 3. Recommendation

### 3.1 Keep WebSockets as Primary Real-Time Transport

- The use case is **bidirectional** (submit + ephemeral sync + broadcast). WebSockets match this better than SSE or polling.
- Current implementation is already in place and works; switching to SSE would require a second path for all client→server traffic and more code paths.
- Managed services are an option later for scaling or ops preference, not a requirement for correctness or UX today.

### 3.2 Recommended Improvements (Stay on WebSockets)

1. **Authentication / authorization on the WebSocket**
   - Accept a query param or first-message token (e.g. JWT), validate it (e.g. same Neon Auth JWKS as REST), and optionally bind `user_id` to the connection so broadcasts can be filtered or abuse limited.
   - Reject connections without a valid token (or from users not in the game).

2. **Multi-instance support (when scaling horizontally)**
   - Introduce a shared message bus (e.g. Redis Pub/Sub). When a process handles a WebSocket message that must be broadcast:
     - Publish to a channel like `game:{game_id}`.
     - Every process (including the one that received the message) subscribes and broadcasts to its local connections for that `game_id`.
   - Alternatively, use sticky sessions so that all connections for a game land on the same instance (simpler but less flexible).

3. **Reconnection and backpressure**
   - Frontend: On reconnect, re-fetch game state via REST and then re-subscribe to WS to avoid long-lived desync (already partially there; ensure initial `game_update` after reconnect is authoritative).
   - Optionally add a simple “last event id” or “version” so the server can send a compact delta after reconnect.

4. **Operational hygiene**
   - Add a heartbeat (ping/pong or a small periodic message) to detect dead connections and close them so the manager doesn’t accumulate stale sockets.
   - Optionally limit concurrent connections per game (e.g. 4–8) to avoid abuse.

5. **Fallback for poor networks**
   - Keep or add a REST path for submit_bids / submit_tricks (already present in `rounds.py`). If the client detects WebSocket failure after max retries, show a “Reconnecting…” state and allow submitting via REST with a note that other players may need to refresh; or trigger a refresh of game state after a successful REST submit.

### 3.3 When to Revisit Alternatives

- **SSE**: Revisit only if we **remove** client→server over the same channel (e.g. move all writes to REST and use SSE purely for server→client). That would be a deliberate simplification of the protocol at the cost of more round-trips and complexity elsewhere.
- **Managed service**: Revisit when (a) we run multiple backend instances and don’t want to operate Redis (or similar), or (b) we need presence/typing indicators or multi-region fan-out and a vendor can do that more cheaply than we can.

---

## 4. Migration Path (If Changing Approach)

### 4.1 If Moving to SSE + REST for Writes

1. Add an SSE endpoint, e.g. `GET /api/v1/games/{game_id}/events`, that streams `game_update`, `phase_update`, and other server→client events (same payloads as today).
2. Change the frontend to open SSE for a game instead of WebSocket; keep using REST for `submit_bids` and `submit_tricks` (and optionally for fetching full state on reconnect).
3. **Ephemeral state** (bid_selection, trick_selection, etc.): either (a) send via REST (e.g. `PATCH /api/v1/games/{id}/live-selections`) and have the backend broadcast via the same event stream, or (b) drop true real-time for these and only sync on submit. (a) keeps current UX but adds REST surface and coupling.
4. Deprecate the WebSocket endpoint once the frontend is fully on SSE + REST.

### 4.2 If Moving to a Managed Service

1. Choose a provider (e.g. Pusher, Ably); create a channel per game, e.g. `game:{game_id}`.
2. Backend: after any action that currently triggers a broadcast, publish the same payload to the managed channel instead of (or in addition to) calling `connection_manager.broadcast_*`. Optionally keep the in-process manager for server-side server→server use if needed.
3. Frontend: replace `WebSocketService` with a client that subscribes to the provider’s channel and receives the same message types. Client→server: keep using REST for submit_bids / submit_tricks; for ephemeral updates, either REST or the provider’s “client events” if supported and authorized.
4. Add auth: use short-lived channel tokens or server-side publish-only so only our backend can publish; clients subscribe with tokens that restrict them to the right channel.
5. Remove or slim down the in-process ConnectionManager once the managed service is the single source of real-time delivery.

---

## 5. Summary

| Question | Answer |
|----------|--------|
| Are WebSockets the best option for this game? | **Yes** for the current and near-term design: bidirectional, low latency, and already implemented. |
| How are WebSockets used today? | Single endpoint per game; in-memory room per `game_id`; JSON messages for state updates, phase, submissions, and ephemeral UI sync; frontend derives WS URL from `apiUrl` and reconnects up to 5 times. |
| What should we improve? | Add auth on the WebSocket; plan for multi-instance (Redis or sticky sessions); heartbeat; optional REST fallback for submits when WS is down. |
| When to consider SSE or a managed service? | SSE if we explicitly move to “REST for writes + SSE for reads”. Managed service when we need to scale horizontally without running our own pub/sub or want managed presence/multi-region. |

This document should be updated when the real-time architecture changes (e.g. Redis pub/sub or a managed service is introduced) or when new requirements (e.g. presence, typing indicators) appear.
