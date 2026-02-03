"""JWT-based invitation token generation and validation"""

import logging
import time
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

import jwt as pyjwt
from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)

# Use a secret key for signing invitation tokens
# Falls back to resend_email if invitation_secret not set (for development)
INVITATION_SECRET = settings.invitation_secret or settings.resend_email or "change-me-in-production"
INVITATION_ALGORITHM = "HS256"
INVITATION_EXPIRY_DAYS = 7


def generate_invitation_token(
    game_id: UUID,
    inviter_id: UUID,
    invitee_email: str,
    player_index: int,
) -> str:
    """
    Generate a JWT invitation token.

    Args:
        game_id: Game UUID
        inviter_id: User ID who sent the invitation
        invitee_email: Email address of invited player
        player_index: Which seat (0-3) they're invited to

    Returns:
        JWT token string
    """
    now = datetime.utcnow()
    expires_at = now + timedelta(days=INVITATION_EXPIRY_DAYS)

    payload = {
        "type": "game_invitation",
        "game_id": str(game_id),
        "inviter_id": str(inviter_id),
        "invitee_email": invitee_email,
        "player_index": player_index,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    token = pyjwt.encode(payload, INVITATION_SECRET, algorithm=INVITATION_ALGORITHM)
    return token


def validate_invitation_token(token: str) -> dict:
    """
    Validate and decode an invitation token.

    Args:
        token: JWT invitation token

    Returns:
        Decoded token payload

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = pyjwt.decode(
            token,
            INVITATION_SECRET,
            algorithms=[INVITATION_ALGORITHM],
            options={"verify_exp": True, "verify_signature": True},
        )

        # Validate token type
        if payload.get("type") != "game_invitation":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token type",
            )

        return payload
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation token has expired",
        )
    except pyjwt.InvalidTokenError as e:
        logger.warning(f"Invalid invitation token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invitation token",
        )
