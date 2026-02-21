#!/usr/bin/env bash
# Update PR #40 title and description. Run from repo root with: gh pr edit 40 ...
# Requires: gh auth login (if not already)

BODY='## What changed

- **Realtime types** (`realtime_types.dart`): Added `RealtimeMessage` and `RealtimeService` interface aligned with the backend and Angular realtime contract (message types: `game_update`, `phase_update`, `bid_selection`, `trick_selection`, etc.).
- **WebSocket realtime service** (`websocket_realtime_service.dart`): Implemented `WebSocketRealtimeService` that connects to the same backend endpoint as the web app (`/api/v1/ws/games/{gameId}`), with optional JWT in the query string. Includes reconnect logic (up to 5 attempts, 3s delay) and exposes a stream of parsed messages plus connection status.
- **GameService integration**: `GameService` now takes an optional `RealtimeService`, extends `ChangeNotifier`, and on `loadGame(gameId)` connects to the WebSocket and subscribes to the message stream. Incoming messages update game state, phase, live bid/trick/trump selections, and rounds (e.g. refetch on `tricks_submitted`). Added send methods: `sendSubmitBids`, `sendSubmitTricks`, `sendBidSelection`, `sendTrickSelection`, `sendTrumpSelection`, and the remaining ephemeral types (`sendBetChange`, `sendBetLocked`, `sendRoundResultChanged`, `sendRoundScoreLocked`). Realtime is disconnected on `clearGame()` and when leaving a game (e.g. delete). Added `setAuthToken(String?)` for future auth.
- **App wiring**: In `main.dart`, introduced a shared `_apiBaseUrl`, registered `RealtimeService` (WebSocket implementation) and `ProxyProvider2<ApiService, RealtimeService, GameService>` so `GameService` receives both API and realtime.
- **UI**: Game screen shows a realtime connection indicator in the app bar (filled/outline circle) and displays `realtimeError` when the backend sends an error over the socket.
- **Dependency**: Added `web_socket_channel: ^3.0.0` in `pubspec.yaml`.

## Why

The task was to add a realtime layer to the Whist Flutter app so it uses the same backend WebSocket (or Supabase Realtime) as the web app. This allows the mobile app to receive live game updates (`game_update`, `phase_update`, `bid_selection`, `trick_selection`, etc.) and to send actions (`submit_bids`, `submit_tricks`, `bid_selection`, etc.) over the same channel, keeping game state in sync across clients without polling.

## Implementation details

- **URL derivation**: WS URL is built from the API base URL (e.g. `http://localhost:8000/api/v1` → `ws://localhost:8000/api/v1/ws/games/{gameId}?token=...`), matching the Angular frontend.
- **RealtimeService abstraction**: The interface allows swapping in a Supabase Realtime implementation later if the backend publishes to it; the current PR uses the backend WebSocket only.
- **GameService as ChangeNotifier**: So that when realtime messages update `_gameState`, `_rounds`, or live selections, `notifyListeners()` is called and the existing `Consumer<GameService>` UI rebuilds.
- **Auth**: Backend requires JWT on the WebSocket. The app currently passes `token: null`; when auth is added, call `gameService.setAuthToken(accessToken)` so the next connect (or reconnect) uses the token.

---

This PR was written using [Vibe Kanban](https://vibekanban.com).'

gh pr edit 40 \
  --title "Flutter app: WebSocket realtime layer for game updates (Vibe Kanban)" \
  --body "$BODY"
