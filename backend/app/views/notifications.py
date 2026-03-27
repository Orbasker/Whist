"""Notifications API endpoint — computes notifications on-the-fly from game data."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user_id
from app.core.dependencies import get_game_service
from app.services.game_service import GameService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(
    user_id: str = Depends(get_current_user_id),
    game_service: GameService = Depends(get_game_service),
):
    """Return computed notifications for the authenticated user."""
    games = await game_service.list_games(UUID(user_id))
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    notifications: list[dict] = []

    for game in games:
        game_name = game.name or "Whist Game"
        game_id = str(game.id)
        updated_at = game.updated_at

        # Parse updated_at to timezone-aware datetime
        if isinstance(updated_at, str):
            try:
                ts = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
            except (ValueError, TypeError):
                ts = None
        elif isinstance(updated_at, datetime):
            ts = updated_at if updated_at.tzinfo else updated_at.replace(tzinfo=timezone.utc)
        else:
            ts = None

        # Game completed recently
        if game.status == "completed" and ts and ts > cutoff:
            notifications.append(
                {
                    "type": "game_completed",
                    "game_id": game_id,
                    "game_name": game_name,
                    "message": f"Game '{game_name}' has been completed.",
                    "timestamp": ts.isoformat(),
                    "read": False,
                }
            )

        # Pending reset vote
        if game.reset_requested_at:
            reset_votes = game.reset_vote_user_ids or []
            if user_id not in reset_votes:
                reset_ts = game.reset_requested_at
                notifications.append(
                    {
                        "type": "reset_vote",
                        "game_id": game_id,
                        "game_name": game_name,
                        "message": f"A reset has been requested for '{game_name}'. Cast your vote.",
                        "timestamp": reset_ts.isoformat()
                        if isinstance(reset_ts, datetime)
                        else str(reset_ts),
                        "read": False,
                    }
                )

    # Sort by timestamp descending
    notifications.sort(
        key=lambda n: n.get("timestamp") or "",
        reverse=True,
    )
    return notifications
