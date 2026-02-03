"""WebSocket endpoints for real-time game updates"""

import json
import logging
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.core.websocket_manager import connection_manager
from app.services.game_service import GameService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/games/{game_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    game_id: str,
    # Note: WebSocket doesn't support Depends, so we'll handle auth via query params or headers
):
    """
    WebSocket endpoint for real-time game state updates and commands.
    
    Clients connect to this endpoint to:
    - Receive game state updates (broadcasted to all clients)
    - Send commands (submit_bids, submit_tricks) through WebSocket
    
    Message format for commands:
    {
        "type": "submit_bids" | "submit_tricks",
        "data": { ... }
    }
    """
    try:
        game_uuid = UUID(game_id)
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    await connection_manager.connect(websocket, game_id)
    
    # Get services (we'll need to create them manually since Depends doesn't work with WebSocket)
    from app.database.connection import SessionLocal
    from app.repositories.game_repository import GameRepository
    from app.repositories.round_repository import RoundRepository
    
    db = SessionLocal()
    
    # Send initial game state and phase when client connects
    try:
        game_repo = GameRepository(db)
        round_repo = RoundRepository(db)
        from app.services.round_service import RoundService as RS
        round_service = RS(db, round_repo)
        game_service = GameService(db, game_repo, round_service)
        
        # Get current game state
        game = await game_service.get_game(game_uuid)
        if game:
            # Determine phase: if there's a round for current_round, we're in bidding phase for next round
            # Otherwise, check if there's a round for current_round - 1 (meaning we're in tricks phase)
            rounds = round_repo.get_by_game_id(game_uuid)
            current_round_number = game.current_round
            
            # Check if there's a round for the current round number
            has_round_for_current = any(r.round_number == current_round_number for r in rounds)
            
            # Determine phase
            if has_round_for_current:
                # Round exists for current_round, so we're in bidding phase for next round
                phase = "bidding"
            else:
                # No round for current_round, check if there's a round for current_round - 1
                has_round_for_previous = any(r.round_number == current_round_number - 1 for r in rounds)
                if has_round_for_previous:
                    # We have a round for previous round, so we're in tricks phase
                    phase = "tricks"
                else:
                    # No rounds yet, we're in bidding phase
                    phase = "bidding"
            
            # Update connection manager's phase state
            if game_id in connection_manager.game_states:
                connection_manager.game_states[game_id]["phase"] = phase
            
            # Send full game state
            await websocket.send_text(json.dumps({
                "type": "game_update",
                "game": game.model_dump(mode='json')
            }))
            
            # Send phase
            await websocket.send_text(json.dumps({
                "type": "phase_update",
                "phase": phase
            }))
    except Exception as e:
        logger.error(f"Error sending initial game state: {e}", exc_info=True)
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                if message_type == "submit_bids":
                    # Handle bid submission
                    bids = message.get("data", {}).get("bids", [])
                    trump_suit = message.get("data", {}).get("trump_suit")
                    
                    try:
                        # Create services for this request
                        game_repo = GameRepository(db)
                        round_repo = RoundRepository(db)
                        from app.services.round_service import RoundService as RS
                        round_service = RS(db, round_repo)
                        game_service = GameService(db, game_repo, round_service)
                        
                        game = await game_service.submit_bids(game_uuid, bids, trump_suit)
                        if game:
                            # Clear bid selections when bids are submitted
                            if game_id in connection_manager.game_states:
                                connection_manager.game_states[game_id]["bid_selections"] = {}
                                connection_manager.game_states[game_id]["trick_selections"] = {}
                            
                            # Broadcast update to all clients (use mode='json' to serialize UUIDs)
                            await connection_manager.broadcast_game_update(game_id, game.model_dump(mode='json'))
                            await connection_manager.broadcast_phase_update(game_id, "tricks")
                            
                            # Send confirmation to sender
                            await websocket.send_text(json.dumps({
                                "type": "bids_submitted",
                                "game": game.model_dump(mode='json')
                            }))
                    except ValueError as e:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": str(e)
                        }))
                
                elif message_type == "submit_tricks":
                    # Handle trick submission
                    tricks = message.get("data", {}).get("tricks", [])
                    bids = message.get("data", {}).get("bids", [])
                    trump_suit = message.get("data", {}).get("trump_suit")
                    
                    try:
                        # Create services for this request
                        game_repo = GameRepository(db)
                        round_repo = RoundRepository(db)
                        from app.services.round_service import RoundService as RS
                        round_service = RS(db, round_repo)
                        game_service = GameService(db, game_repo, round_service)
                        
                        result = await game_service.submit_tricks(
                            game_uuid, tricks, bids, trump_suit, None
                        )
                        if result:
                            round_obj, updated_game = result
                            
                            # Clear all selections when tricks are submitted (new round starts)
                            if game_id in connection_manager.game_states:
                                connection_manager.game_states[game_id]["bid_selections"] = {}
                                connection_manager.game_states[game_id]["trick_selections"] = {}
                                connection_manager.game_states[game_id]["trump_selection"] = None
                            
                            # Broadcast update to all clients (use mode='json' to serialize UUIDs)
                            await connection_manager.broadcast_game_update(game_id, updated_game.model_dump(mode='json'))
                            await connection_manager.broadcast_phase_update(game_id, "bidding")
                            
                            # Send confirmation to sender
                            from app.schemas.round import RoundResponse
                            await websocket.send_text(json.dumps({
                                "type": "tricks_submitted",
                                "game": updated_game.model_dump(mode='json'),
                                "round": RoundResponse.model_validate(round_obj).model_dump(mode='json')
                            }))
                    except ValueError as e:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": str(e)
                        }))
                
                elif message_type == "bid_selection":
                    # Handle live bid selection (not submission)
                    player_index = message.get("data", {}).get("player_index")
                    bid = message.get("data", {}).get("bid")
                    
                    logger.info(f"Received bid_selection: player {player_index}, bid {bid} for game {game_id}")
                    
                    if player_index is not None and bid is not None:
                        # Broadcast to all other clients (including sender so they see their own selection)
                        await connection_manager.broadcast_bid_selection(
                            game_id, player_index, bid
                        )
                
                elif message_type == "trick_selection":
                    # Handle live trick selection (not submission)
                    player_index = message.get("data", {}).get("player_index")
                    trick = message.get("data", {}).get("trick")
                    
                    logger.info(f"Received trick_selection: player {player_index}, trick {trick} for game {game_id}")
                    
                    if player_index is not None and trick is not None:
                        # Broadcast to all other clients (including sender so they see their own selection)
                        await connection_manager.broadcast_trick_selection(
                            game_id, player_index, trick
                        )
                
                elif message_type == "trump_selection":
                    # Handle live trump selection (not submission)
                    trump_suit = message.get("data", {}).get("trump_suit")
                    
                    if trump_suit is not None:
                        # Broadcast to all other clients
                        await connection_manager.broadcast_trump_selection(
                            game_id, trump_suit
                        )
                
                else:
                    logger.debug(f"Unknown message type: {message_type}")
                    
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received: {data}")
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}", exc_info=True)
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Internal server error"
                }))
                
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, game_id)
        logger.info(f"WebSocket disconnected for game {game_id}")
    except Exception as e:
        logger.error(f"WebSocket error for game {game_id}: {e}", exc_info=True)
        connection_manager.disconnect(websocket, game_id)
    finally:
        db.close()
