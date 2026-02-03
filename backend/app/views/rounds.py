"""Round API endpoints"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_game_service, get_round_service
from app.core.exceptions import InvalidBidsError, InvalidTricksError
from app.core.websocket_manager import connection_manager
from app.schemas.game import GameUpdate
from app.schemas.round import RoundCreate, RoundResponse, TricksSubmit
from app.services.game_service import GameService
from app.services.round_service import RoundService

router = APIRouter(prefix="/games/{game_id}/rounds", tags=["rounds"])


@router.post("/bids", response_model=dict)
async def submit_bids(
    game_id: UUID,
    round_data: RoundCreate,
    game_service: GameService = Depends(get_game_service)
):
    """Submit bids for current round"""
    try:
        game = await game_service.submit_bids(
            game_id=game_id,
            bids=round_data.bids,
            trump_suit=round_data.trump_suit
        )
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")
        
        # Calculate round mode
        total_bids = sum(round_data.bids)
        round_mode = "over" if total_bids > 13 else "under"
        
        # Broadcast game update via WebSocket (use mode='json' to serialize UUIDs)
        await connection_manager.broadcast_game_update(str(game_id), game.model_dump(mode='json'))
        await connection_manager.broadcast_phase_update(str(game_id), "tricks")
        
        return {
            "game": game,
            "round_mode": round_mode,
            "total_bids": total_bids
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tricks", response_model=dict)
async def submit_tricks(
    game_id: UUID,
    tricks_data: TricksSubmit,
    game_service: GameService = Depends(get_game_service),
    round_service: RoundService = Depends(get_round_service)
):
    """Submit tricks and create round"""
    try:
        game = await game_service.get_game(game_id)
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")
        
        # Submit tricks with bids
        result = await game_service.submit_tricks(
            game_id=game_id,
            tricks=tricks_data.tricks,
            bids=tricks_data.bids,
            trump_suit=tricks_data.trump_suit,
            created_by=None
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Game not found")
        
        round_obj, updated_game = result
        
        # Broadcast game update via WebSocket (use mode='json' to serialize UUIDs)
        await connection_manager.broadcast_game_update(str(game_id), updated_game.model_dump(mode='json'))
        await connection_manager.broadcast_phase_update(str(game_id), "bidding")
        
        return {
            "game": updated_game,
            "round": RoundResponse.model_validate(round_obj)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[RoundResponse])
async def get_rounds(
    game_id: UUID,
    round_service: RoundService = Depends(get_round_service)
):
    """Get all rounds for a game"""
    rounds = round_service.get_rounds_by_game(game_id)
    return [RoundResponse.model_validate(round) for round in rounds]
