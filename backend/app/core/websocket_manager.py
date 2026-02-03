"""WebSocket connection manager for real-time game updates"""

import json
import logging
from typing import Dict, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for game state updates"""
    
    def __init__(self):
        # Map game_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Store current state for each game (selections, phase, etc.)
        self.game_states: Dict[str, dict] = {}
    
    async def connect(self, websocket: WebSocket, game_id: str):
        """Connect a WebSocket to a game room"""
        await websocket.accept()
        
        if game_id not in self.active_connections:
            self.active_connections[game_id] = set()
            self.game_states[game_id] = {
                "bid_selections": {},
                "trick_selections": {},
                "trump_selection": None,
                "phase": "bidding"
            }
        
        self.active_connections[game_id].add(websocket)
        logger.info(f"WebSocket connected to game {game_id}. Total connections: {len(self.active_connections[game_id])}")
        
        # Send current state to the newly connected client
        if game_id in self.game_states:
            state = self.game_states[game_id]
            # Send all current selections
            for player_idx, bid in state["bid_selections"].items():
                await websocket.send_text(json.dumps({
                    "type": "bid_selection",
                    "data": {
                        "player_index": int(player_idx),
                        "bid": bid
                    }
                }))
            for player_idx, trick in state["trick_selections"].items():
                await websocket.send_text(json.dumps({
                    "type": "trick_selection",
                    "data": {
                        "player_index": int(player_idx),
                        "trick": trick
                    }
                }))
            if state["trump_selection"] is not None:
                await websocket.send_text(json.dumps({
                    "type": "trump_selection",
                    "data": {
                        "trump_suit": state["trump_selection"]
                    }
                }))
            # Send current phase
            await websocket.send_text(json.dumps({
                "type": "phase_update",
                "phase": state["phase"]
            }))
    
    def disconnect(self, websocket: WebSocket, game_id: str):
        """Disconnect a WebSocket from a game room"""
        if game_id in self.active_connections:
            self.active_connections[game_id].discard(websocket)
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]
                # Keep game state even when no connections (for when players reconnect)
                # Only clear if explicitly needed
            logger.info(f"WebSocket disconnected from game {game_id}")
    
    async def broadcast_game_update(self, game_id: str, game_state: dict):
        """Broadcast game state update to all connections in a game room"""
        if game_id not in self.active_connections:
            return
        
        # game_state should already be serialized (using model_dump(mode='json'))
        message = json.dumps({
            "type": "game_update",
            "game": game_state
        })
        
        logger.info(f"Broadcasting game_update for game {game_id} to {len(self.active_connections[game_id])} connections")
        
        disconnected = set()
        for connection in self.active_connections[game_id]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send message to WebSocket: {e}")
                disconnected.add(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection, game_id)
        
        # Clear selections when phase changes (bids submitted -> tricks phase, tricks submitted -> bidding phase)
        if game_id in self.game_states:
            # Clear bid selections when moving to tricks phase
            if game_state.get("current_round"):
                # Keep selections for current round, but we'll clear them when phase actually changes
                pass
    
    async def broadcast_phase_update(self, game_id: str, phase: str):
        """Broadcast phase change to all connections in a game room"""
        if game_id not in self.active_connections:
            return
        
        # Store the phase in game state
        if game_id not in self.game_states:
            self.game_states[game_id] = {
                "bid_selections": {},
                "trick_selections": {},
                "trump_selection": None,
                "phase": "bidding"
            }
        self.game_states[game_id]["phase"] = phase
        
        message = json.dumps({
            "type": "phase_update",
            "phase": phase
        })
        
        logger.info(f"Broadcasting phase_update for game {game_id}: {phase} to {len(self.active_connections[game_id])} connections")
        
        disconnected = set()
        for connection in self.active_connections[game_id]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send phase update to WebSocket: {e}")
                disconnected.add(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection, game_id)
    
    async def broadcast_bid_selection(self, game_id: str, player_index: int, bid: int):
        """Broadcast a player's bid selection to all connections in a game room"""
        if game_id not in self.active_connections:
            logger.warning(f"No active connections for game {game_id}")
            return
        
        # Store the selection in game state
        if game_id not in self.game_states:
            self.game_states[game_id] = {
                "bid_selections": {},
                "trick_selections": {},
                "trump_selection": None,
                "phase": "bidding"
            }
        self.game_states[game_id]["bid_selections"][str(player_index)] = bid
        
        message = json.dumps({
            "type": "bid_selection",
            "data": {
                "player_index": player_index,
                "bid": bid
            }
        })
        
        logger.info(f"Broadcasting bid_selection for game {game_id}: player {player_index} bid {bid} to {len(self.active_connections[game_id])} connections")
        
        disconnected = set()
        # Broadcast to ALL connections (including sender) so everyone sees all selections
        for connection in self.active_connections[game_id]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send bid selection to WebSocket: {e}")
                disconnected.add(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection, game_id)
    
    async def broadcast_trick_selection(self, game_id: str, player_index: int, trick: int):
        """Broadcast a player's trick selection to all connections in a game room"""
        if game_id not in self.active_connections:
            logger.warning(f"No active connections for game {game_id}")
            return
        
        # Store the selection in game state
        if game_id not in self.game_states:
            self.game_states[game_id] = {
                "bid_selections": {},
                "trick_selections": {},
                "trump_selection": None,
                "phase": "bidding"
            }
        self.game_states[game_id]["trick_selections"][str(player_index)] = trick
        
        message = json.dumps({
            "type": "trick_selection",
            "data": {
                "player_index": player_index,
                "trick": trick
            }
        })
        
        logger.info(f"Broadcasting trick_selection for game {game_id}: player {player_index} trick {trick} to {len(self.active_connections[game_id])} connections")
        
        disconnected = set()
        # Broadcast to ALL connections (including sender) so everyone sees all selections
        for connection in self.active_connections[game_id]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send trick selection to WebSocket: {e}")
                disconnected.add(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection, game_id)
    
    async def broadcast_trump_selection(self, game_id: str, trump_suit: str):
        """Broadcast trump suit selection to all connections in a game room"""
        if game_id not in self.active_connections:
            return
        
        # Store the selection in game state
        if game_id not in self.game_states:
            self.game_states[game_id] = {
                "bid_selections": {},
                "trick_selections": {},
                "trump_selection": None,
                "phase": "bidding"
            }
        self.game_states[game_id]["trump_selection"] = trump_suit
        
        message = json.dumps({
            "type": "trump_selection",
            "data": {
                "trump_suit": trump_suit
            }
        })
        
        logger.info(f"Broadcasting trump_selection for game {game_id}: {trump_suit} to {len(self.active_connections[game_id])} connections")
        
        disconnected = set()
        # Broadcast to ALL connections (including sender) so everyone sees all selections
        for connection in self.active_connections[game_id]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send trump selection to WebSocket: {e}")
                disconnected.add(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection, game_id)


# Global connection manager instance
connection_manager = ConnectionManager()
