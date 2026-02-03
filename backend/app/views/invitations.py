"""Invitation API endpoints"""

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user_id, get_current_user_id_optional
from app.core.dependencies import get_game_service
from app.core.invitations import generate_invitation_token, validate_invitation_token
from app.schemas.invitation import InvitationAcceptResponse, InvitationCreate, InvitationInfo
from app.services.email_service import EmailService
from app.services.game_service import GameService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/invite", tags=["invitations"])

# Global email service instance
_email_service = EmailService()


@router.post("/games/{game_id}/invite", status_code=status.HTTP_200_OK)
async def create_invitations(
    game_id: UUID,
    invitation_data: InvitationCreate,
    user_id: str = Depends(get_current_user_id),
    game_service: GameService = Depends(get_game_service),
):
    """
    Create and send invitation emails for a game.
    
    Requires authentication and game ownership.
    """
    from uuid import UUID
    
    owner_id = UUID(user_id)
    
    # Verify user owns the game
    game = await game_service.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if game.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Only game owner can send invitations")
    
    # Validate player indices
    emails = invitation_data.emails
    player_indices = invitation_data.player_indices
    
    if player_indices:
        if len(player_indices) != len(emails):
            raise HTTPException(
                status_code=400,
                detail="player_indices length must match emails length"
            )
        if not all(0 <= idx <= 3 for idx in player_indices):
            raise HTTPException(
                status_code=400,
                detail="player_indices must be between 0 and 3"
            )
    else:
        # Assign sequentially starting from first available slot
        player_indices = list(range(len(emails)))
    
    # Check if seats are already taken
    # If player_user_ids is None, treat as all None (all seats available)
    player_user_ids = game.player_user_ids or [None, None, None, None]
    
    for idx in player_indices:
        if idx < len(player_user_ids) and player_user_ids[idx] is not None:
            raise HTTPException(
                status_code=400,
                detail=f"Player seat {idx} is already taken"
            )
    
    # Generate tokens and send emails
    sent_count = 0
    tokens = []
    
    for email, player_index in zip(emails, player_indices):
        try:
            token = generate_invitation_token(
                game_id=game_id,
                inviter_id=owner_id,
                invitee_email=email,
                player_index=player_index,
            )
            tokens.append(token)
            
            # Send email
            success = await _email_service.send_invitation(
                email=email,
                invitation_token=token,
                game_name=game.name,
                inviter_name=None,  # Could fetch from user service if available
            )
            
            if success:
                sent_count += 1
            else:
                logger.warning(f"Failed to send invitation email to {email}")
        except Exception as e:
            logger.error(f"Error creating invitation for {email}: {str(e)}", exc_info=True)
    
    return {
        "sent": sent_count,
        "total": len(emails),
        "tokens": tokens,  # For testing/debugging
    }


@router.get("/{token}", response_model=InvitationInfo)
async def get_invitation_info(
    token: str,
    game_service: GameService = Depends(get_game_service),
):
    """
    Get invitation information from token (public endpoint, no auth required).
    
    Used to display invitation details before acceptance.
    """
    try:
        payload = validate_invitation_token(token)
        
        game_id = UUID(payload["game_id"])
        game = await game_service.get_game(game_id)
        
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")
        
        return InvitationInfo(
            game_id=game_id,
            game_name=game.name,
            inviter_name=None,  # Could fetch from user service if available
            player_index=payload["player_index"],
            expires_at=payload["exp"],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting invitation info: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail="Invalid invitation token")


@router.post("/{token}/accept", response_model=InvitationAcceptResponse)
async def accept_invitation(
    token: str,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    game_service: GameService = Depends(get_game_service),
):
    """
    Accept an invitation and join the game.
    
    If user is not authenticated, they'll need to sign up/login first.
    """
    from uuid import UUID
    
    # Validate token
    payload = validate_invitation_token(token)
    
    game_id = UUID(payload["game_id"])
    invitee_email = payload["invitee_email"]
    player_index = payload["player_index"]
    
    logger.info(f"Invitation acceptance attempt: game_id={game_id}, invitee_email={invitee_email}, player_index={player_index}")
    
    # Check if user is authenticated
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please sign up or log in to accept the invitation."
        )
    
    user_uuid = UUID(user_id)
    
    # Get game
    game = await game_service.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Check if seat is still available
    # Handle both string UUIDs (from JSON) and UUID objects
    player_user_ids = game.player_user_ids or [None, None, None, None]
    if player_index < len(player_user_ids):
        existing_id = player_user_ids[player_index]
        if existing_id is not None:
            # Convert to string for comparison if needed
            existing_id_str = str(existing_id) if not isinstance(existing_id, str) else existing_id
            user_id_str = str(user_uuid)
            if existing_id_str == user_id_str:
                raise HTTPException(
                    status_code=400,
                    detail=f"You have already joined this game at seat {player_index}"
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Player seat {player_index} is already taken"
                )
    
    # Join the game (update player_user_ids)
    await game_service.join_game(game_id, user_uuid, player_index)
    
    return InvitationAcceptResponse(
        game_id=game_id,
        joined=True,
        player_index=player_index,
        message="Successfully joined the game!"
    )
