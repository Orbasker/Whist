"""Game API endpoints"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user_id
from app.core.dependencies import get_game_service
from app.schemas.game import GameCreate, GameResponse, GameUpdate, PlayerDisplayNameUpdate
from app.services.game_service import GameService

router = APIRouter(prefix="/games", tags=["games"])


@router.get("", response_model=list[GameResponse])
async def list_games(
    user_id: str = Depends(get_current_user_id),
    game_service: GameService = Depends(get_game_service),
):
    """List all games for the authenticated user (games they own or are a player in)."""
    return await game_service.list_games(UUID(user_id))


@router.post("", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
async def create_game(
    game_data: GameCreate,
    user_id: str = Depends(get_current_user_id),
    game_service: GameService = Depends(get_game_service),
):
    """Create a new game (requires authentication)."""
    return await game_service.create_game(game_data, owner_id=UUID(user_id))


@router.get("/{game_id}", response_model=GameResponse)
async def get_game(
    game_id: UUID,
    user_id: str = Depends(get_current_user_id),
    game_service: GameService = Depends(get_game_service),
):
    """Get game by ID. Only participants (owner or player) can access."""
    from uuid import UUID

    game = await game_service.get_game_if_participant(game_id, UUID(user_id))
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.put("/{game_id}", response_model=GameResponse)
async def update_game(
    game_id: UUID,
    game_update: GameUpdate,
    user_id: str = Depends(get_current_user_id),
    game_service: GameService = Depends(get_game_service),
):
    """Update a game. Only participants can update."""
    from uuid import UUID

    game = await game_service.get_game_if_participant(game_id, UUID(user_id))
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    updated = await game_service.update_game(game_id, game_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Game not found")
    return updated


@router.patch(
    "/{game_id}/players/{player_index:int}",
    response_model=GameResponse,
    status_code=status.HTTP_200_OK,
)
async def update_player_display_name(
    game_id: UUID,
    player_index: int,
    body: PlayerDisplayNameUpdate,
    user_id: str = Depends(get_current_user_id),
    game_service: GameService = Depends(get_game_service),
):
    """
    Update a player's display name.
    Manager can edit only placeholder slots (no linked user).
    Any user can edit their own slot's name.
    """
    if not 0 <= player_index <= 3:
        raise HTTPException(status_code=400, detail="player_index must be between 0 and 3")
    try:
        game = await game_service.update_player_display_name(
            game_id, player_index, body.display_name, UUID(user_id)
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.post(
    "/{game_id}/reset-request", response_model=GameResponse, status_code=status.HTTP_200_OK
)
async def request_reset(
    game_id: UUID,
    user_id: str = Depends(get_current_user_id),
    game_service: GameService = Depends(get_game_service),
):
    """Propose a reset. All linked players must then vote to reset."""
    try:
        game = await game_service.request_reset(game_id, UUID(user_id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.post("/{game_id}/reset-vote", response_model=GameResponse, status_code=status.HTTP_200_OK)
async def vote_reset(
    game_id: UUID,
    user_id: str = Depends(get_current_user_id),
    game_service: GameService = Depends(get_game_service),
):
    """Vote yes for reset. When all linked players have voted, the game is reset."""
    try:
        game = await game_service.vote_reset(game_id, UUID(user_id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.delete(
    "/{game_id}/reset-request", response_model=GameResponse, status_code=status.HTTP_200_OK
)
async def cancel_reset_request(
    game_id: UUID,
    user_id: str = Depends(get_current_user_id),
    game_service: GameService = Depends(get_game_service),
):
    """Cancel an open reset request. Only the game owner can cancel."""
    try:
        game = await game_service.cancel_reset_request(game_id, UUID(user_id))
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_game(
    game_id: UUID,
    user_id: str = Depends(get_current_user_id),
    game_service: GameService = Depends(get_game_service),
):
    """Delete a game. Only the game owner can delete."""
    game = await game_service.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.owner_id != UUID(user_id):
        raise HTTPException(status_code=403, detail="Only the game owner can delete the game")
    deleted = await game_service.delete_game(game_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Game not found")
    return None
