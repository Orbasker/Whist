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
    
    from app.database.connection import SessionLocal
    from app.repositories.game_repository import GameRepository
    from app.repositories.round_repository import RoundRepository
    
    db = SessionLocal()
    
    try:
        game_repo = GameRepository(db)
        round_repo = RoundRepository(db)
        from app.services.round_service import RoundService as RS
        round_service = RS(db, round_repo)
        game_service = GameService(db, game_repo, round_service)
        
        game = await game_service.get_game(game_uuid)
        if game:
            rounds = round_repo.get_by_game_id(game_uuid)
            current_round_number = game.current_round
            
            has_round_for_current = any(r.round_number == current_round_number for r in rounds)
            
            if has_round_for_current:
                phase = "bidding"
            else:
                has_round_for_previous = any(r.round_number == current_round_number - 1 for r in rounds)
                if has_round_for_previous:
                    phase = "tricks"
                else:
                    phase = "bidding"
            
            if game_id in connection_manager.game_states:
                connection_manager.game_states[game_id]["phase"] = phase
            
            await websocket.send_text(json.dumps({
                "type": "game_update",
                "game": game.model_dump(mode='json')
            }))
            
            await websocket.send_text(json.dumps({
                "type": "phase_update",
                "phase": phase
            }))
    except Exception as e:
        logger.error(f"Error sending initial game state: {e}", exc_info=True)
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                if message_type == "submit_bids":
                    bids = message.get("data", {}).get("bids", [])
                    trump_suit = message.get("data", {}).get("trump_suit")
                    
                    try:
                        game_repo = GameRepository(db)
                        round_repo = RoundRepository(db)
                        from app.services.round_service import RoundService as RS
                        round_service = RS(db, round_repo)
                        game_service = GameService(db, game_repo, round_service)
                        
                        game = await game_service.submit_bids(game_uuid, bids, trump_suit)
                        if game:
                            if game_id in connection_manager.game_states:
                                connection_manager.game_states[game_id]["bid_selections"] = {}
                                connection_manager.game_states[game_id]["trick_selections"] = {}
                            
                            await connection_manager.broadcast_game_update(game_id, game.model_dump(mode='json'))
                            await connection_manager.broadcast_phase_update(game_id, "tricks")
                            
                            broadcast_message = json.dumps({
                                "type": "bids_submitted",
                                "game": game.model_dump(mode='json'),
                                "data": {
                                    "bids": bids,
                                    "trump_suit": trump_suit
                                }
                            })
                            await connection_manager.broadcast_message(game_id, broadcast_message)
                            
                            await connection_manager.broadcast_message(game_id, json.dumps({
                                "type": "bet_sent",
                                "data": {
                                    "bids": bids,
                                    "trump_suit": trump_suit
                                }
                            }))
                    except ValueError as e:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": str(e)
                        }))
                
                elif message_type == "submit_tricks":
                    tricks = message.get("data", {}).get("tricks", [])
                    bids = message.get("data", {}).get("bids", [])
                    trump_suit = message.get("data", {}).get("trump_suit")
                    
                    try:
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
                            
                            if game_id in connection_manager.game_states:
                                connection_manager.game_states[game_id]["bid_selections"] = {}
                                connection_manager.game_states[game_id]["trick_selections"] = {}
                                connection_manager.game_states[game_id]["trump_selection"] = None
                            
                            await connection_manager.broadcast_game_update(game_id, updated_game.model_dump(mode='json'))
                            await connection_manager.broadcast_phase_update(game_id, "bidding")
                            
                            from app.schemas.round import RoundResponse
                            round_response = RoundResponse.model_validate(round_obj).model_dump(mode='json')
                            
                            tricks_submitted_message = json.dumps({
                                "type": "tricks_submitted",
                                "game": updated_game.model_dump(mode='json'),
                                "round": round_response
                            })
                            await connection_manager.broadcast_message(game_id, tricks_submitted_message)
                            
                            await connection_manager.broadcast_message(game_id, json.dumps({
                                "type": "round_result_sent",
                                "data": {
                                    "tricks": tricks,
                                    "round": round_response
                                }
                            }))
                    except ValueError as e:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": str(e)
                        }))
                
                elif message_type == "bid_selection":
                    player_index = message.get("data", {}).get("player_index")
                    bid = message.get("data", {}).get("bid")
                    
                    logger.info(f"Received bid_selection: player {player_index}, bid {bid} for game {game_id}")
                    
                    if player_index is not None and bid is not None:
                        await connection_manager.broadcast_bid_selection(
                            game_id, player_index, bid
                        )
                
                elif message_type == "trick_selection":
                    player_index = message.get("data", {}).get("player_index")
                    trick = message.get("data", {}).get("trick")
                    
                    logger.info(f"Received trick_selection: player {player_index}, trick {trick} for game {game_id}")
                    
                    if player_index is not None and trick is not None:
                        await connection_manager.broadcast_trick_selection(
                            game_id, player_index, trick
                        )
                
                elif message_type == "trump_selection":
                    trump_suit = message.get("data", {}).get("trump_suit")
                    
                    if trump_suit is not None:
                        await connection_manager.broadcast_trump_selection(
                            game_id, trump_suit
                        )
                
                elif message_type == "bet_change":
                    player_index = message.get("data", {}).get("player_index")
                    bid = message.get("data", {}).get("bid")
                    
                    if player_index is not None and bid is not None:
                        await connection_manager.broadcast_message(game_id, json.dumps({
                            "type": "bet_change",
                            "data": {
                                "player_index": player_index,
                                "bid": bid
                            }
                        }))
                
                elif message_type == "bet_locked":
                    player_index = message.get("data", {}).get("player_index")
                    
                    if player_index is not None:
                        await connection_manager.broadcast_message(game_id, json.dumps({
                            "type": "bet_locked",
                            "data": {
                                "player_index": player_index
                            }
                        }))
                
                elif message_type == "round_result_changed":
                    player_index = message.get("data", {}).get("player_index")
                    trick = message.get("data", {}).get("trick")
                    
                    if player_index is not None and trick is not None:
                        await connection_manager.broadcast_message(game_id, json.dumps({
                            "type": "round_result_changed",
                            "data": {
                                "player_index": player_index,
                                "trick": trick
                            }
                        }))
                
                elif message_type == "round_score_locked":
                    player_index = message.get("data", {}).get("player_index")
                    
                    if player_index is not None:
                        await connection_manager.broadcast_message(game_id, json.dumps({
                            "type": "round_score_locked",
                            "data": {
                                "player_index": player_index
                            }
                        }))
                
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
