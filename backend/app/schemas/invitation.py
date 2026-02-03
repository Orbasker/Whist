"""Schemas for game invitations"""

from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class InvitationCreate(BaseModel):
    """Schema for creating invitations"""
    emails: List[EmailStr] = Field(..., min_length=1, max_length=4, description="List of email addresses to invite")
    player_indices: Optional[List[int]] = Field(
        None,
        description="Optional list of player indices (0-3) for each email. If not provided, assigns sequentially."
    )


class InvitationInfo(BaseModel):
    """Schema for invitation information (public, no auth required)"""
    game_id: UUID
    game_name: Optional[str]
    inviter_name: Optional[str]
    player_index: int
    expires_at: int  # Unix timestamp


class InvitationAcceptResponse(BaseModel):
    """Schema for invitation acceptance response"""
    game_id: UUID
    joined: bool
    player_index: int
    message: str
