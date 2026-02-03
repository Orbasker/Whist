"""Game API endpoints"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user_id
from app.core.dependencies import get_game_service
from app.schemas.game import GameCreate, GameResponse, GameUpdate
from app.services.game_service import GameService

router = APIRouter(prefix="/games", tags=["games"])


@router.get("", response_model=list[GameResponse])
async def list_games(
    user_id: str = Depends(get_current_user_id),
    game_service: GameService = Depends(get_game_service)
):
    """List all games for the authenticated user (games they own or are a player in)"""
    from uuid import UUID
    return await game_service.list_games(UUID(user_id))


@router.post("", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
async def create_game(
    game_data: GameCreate,
    user_id: str = Depends(get_current_user_id),
    game_service: GameService = Depends(get_game_service)
):
    """Create a new game (requires authentication)"""
    from uuid import UUID
    return await game_service.create_game(game_data, owner_id=UUID(user_id))


@router.get("/{game_id}", response_model=GameResponse)
async def get_game(
    game_id: UUID,
    game_service: GameService = Depends(get_game_service)
):
    """Get game by ID"""
    game = await game_service.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.put("/{game_id}", response_model=GameResponse)
async def update_game(
    game_id: UUID,
    game_update: GameUpdate,
    game_service: GameService = Depends(get_game_service)
):
    """Update a game"""
    game = await game_service.update_game(game_id, game_update)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_game(
    game_id: UUID,
    game_service: GameService = Depends(get_game_service)
):
    """Delete a game"""
    deleted = await game_service.delete_game(game_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Game not found")
    return None
