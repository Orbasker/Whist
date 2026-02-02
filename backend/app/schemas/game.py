from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.game import GameMode, GameStatus


class GameCreate(BaseModel):
    """Schema for creating a new game"""
    players: List[str] = Field(..., min_length=4, max_length=4, description="List of 4 player names")
    name: Optional[str] = Field(None, description="Optional game name")


class GameUpdate(BaseModel):
    """Schema for updating a game"""
    scores: Optional[List[int]] = None
    current_round: Optional[int] = None
    status: Optional[GameStatus] = None
    name: Optional[str] = None


class GameResponse(BaseModel):
    """Schema for game response"""
    id: UUID
    players: List[str]
    scores: List[int]
    current_round: int
    status: GameStatus
    game_mode: Optional[GameMode] = GameMode.SCORING_ONLY
    owner_id: Optional[UUID] = None
    name: Optional[str] = None
    player_user_ids: Optional[List[Optional[UUID]]] = None
    is_shared: bool = False
    share_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # For SQLAlchemy model conversion
