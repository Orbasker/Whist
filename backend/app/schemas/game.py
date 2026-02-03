from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

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
    
    @field_validator('player_user_ids', mode='before')
    @classmethod
    def convert_player_user_ids(cls, v):
        """Convert string UUIDs from JSON to UUID objects"""
        if v is None:
            return None
        result = []
        for pid in v:
            if pid is None:
                result.append(None)
            elif isinstance(pid, str):
                result.append(UUID(pid))
            elif isinstance(pid, UUID):
                result.append(pid)
            else:
                result.append(UUID(str(pid)))
        return result
    
    class Config:
        from_attributes = True  # For SQLAlchemy model conversion
