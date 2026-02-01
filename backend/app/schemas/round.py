from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class RoundCreate(BaseModel):
    """Schema for creating a round (bids)"""
    bids: List[int] = Field(..., min_length=4, max_length=4, description="List of 4 bids (0-13)")
    trump_suit: Optional[str] = Field(None, description="Trump suit: spades, clubs, diamonds, hearts, no-trump")


class TricksSubmit(BaseModel):
    """Schema for submitting tricks"""
    tricks: List[int] = Field(..., min_length=4, max_length=4, description="List of 4 tricks taken (0-13)")
    bids: List[int] = Field(..., min_length=4, max_length=4, description="List of 4 bids (0-13) - from previous submission")
    trump_suit: Optional[str] = Field(None, description="Trump suit: spades, clubs, diamonds, hearts, no-trump")


class RoundResponse(BaseModel):
    """Schema for round response"""
    id: int
    game_id: UUID
    round_number: int
    bids: List[int]
    tricks: List[int]
    scores: List[int]
    round_mode: str
    trump_suit: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    
    class Config:
        from_attributes = True  # For SQLAlchemy model conversion
