from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


def _validate_bid_trick_range(v: int) -> int:
    if not (0 <= v <= 13):
        raise ValueError("each value must be between 0 and 13")
    return v


class RoundCreate(BaseModel):
    """Schema for creating a round (bids)"""

    bids: List[int] = Field(..., min_length=4, max_length=4, description="List of 4 bids (0-13)")
    trump_suit: Optional[str] = Field(
        None, description="Trump suit: spades, clubs, diamonds, hearts, no-trump"
    )

    @field_validator("bids", mode="after")
    @classmethod
    def bids_in_range(cls, v: List[int]) -> List[int]:
        for bid in v:
            _validate_bid_trick_range(bid)
        return v


class TricksSubmit(BaseModel):
    """Schema for submitting tricks"""

    tricks: List[int] = Field(
        ..., min_length=4, max_length=4, description="List of 4 tricks taken (0-13)"
    )
    bids: List[int] = Field(
        ...,
        min_length=4,
        max_length=4,
        description="List of 4 bids (0-13) - from previous submission",
    )
    trump_suit: Optional[str] = Field(
        None, description="Trump suit: spades, clubs, diamonds, hearts, no-trump"
    )

    @field_validator("tricks", "bids", mode="after")
    @classmethod
    def values_in_range(cls, v: List[int]) -> List[int]:
        for x in v:
            _validate_bid_trick_range(x)
        return v


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
