"""Game service for game orchestration."""

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.game import Game, GameMode, GameStatus
from app.models.round import Round
from app.repositories.game_repository import GameRepository
from app.schemas.game import GameCreate, GameResponse, GameUpdate
from app.services.round_service import RoundService
from app.services.scoring_service import ScoringService

NUM_PLAYERS = 4
VALID_BID_RANGE = (0, 13)
BIDS_SUM_FORBIDDEN = 13
TRICKS_SUM_REQUIRED = 13


def _ensure_four_slots(items: Optional[List], default) -> List:
    """Return a list of exactly 4 elements, padding with default if needed."""
    result = list(items) if items else []
    while len(result) < NUM_PLAYERS:
        result.append(default)
    return result[:NUM_PLAYERS]


def _validate_bids(bids: List[int]) -> None:
    """Raise ValueError if bids are invalid (must be 4 values 0–13, sum != 13)."""
    if len(bids) != NUM_PLAYERS or not all(
        VALID_BID_RANGE[0] <= b <= VALID_BID_RANGE[1] for b in bids
    ):
        raise ValueError("Invalid bids: must be 4 values, each between 0 and 13")
    if sum(bids) == BIDS_SUM_FORBIDDEN:
        raise ValueError("Invalid bids: total bids cannot equal 13. Must be more or less than 13.")


def _validate_tricks(tricks: List[int]) -> None:
    """Raise ValueError if tricks are invalid (4 values 0–13, sum = 13)."""
    if len(tricks) != NUM_PLAYERS or not all(
        VALID_BID_RANGE[0] <= t <= VALID_BID_RANGE[1] for t in tricks
    ):
        raise ValueError("Invalid tricks: must be 4 values, each between 0 and 13")
    if sum(tricks) != TRICKS_SUM_REQUIRED:
        raise ValueError(f"Invalid tricks: sum must be 13, got {sum(tricks)}")


class GameService:
    """Business logic for game management"""

    def __init__(self, db: Session, game_repo: GameRepository, round_service: RoundService):
        self.db = db
        self.game_repo = game_repo
        self.round_service = round_service
        self.scoring_service = ScoringService()

    async def create_game(
        self, game_data: GameCreate, owner_id: Optional[UUID] = None
    ) -> GameResponse:
        """
        Create a new game.

        Args:
            game_data: Game creation data
            owner_id: Optional user ID who owns the game

        Returns:
            Created game response
        """
        # Owner occupies slot 0; other slots are placeholders until claimed via invite
        player_user_ids = None
        if owner_id is not None:
            player_user_ids = [str(owner_id), None, None, None]

        game = Game(
            players=game_data.players,
            scores=[0, 0, 0, 0],
            current_round=1,
            status=GameStatus.ACTIVE,
            game_mode=GameMode.SCORING_ONLY,
            owner_id=owner_id,
            name=game_data.name,
            player_user_ids=player_user_ids,
        )

        saved_game = self.game_repo.create(game)
        return GameResponse.model_validate(saved_game)

    async def get_game(self, game_id: UUID) -> Optional[GameResponse]:
        """
        Get game by ID.

        Args:
            game_id: Game UUID

        Returns:
            Game response or None if not found
        """
        game = self.game_repo.get_by_id(game_id)
        if not game:
            return None
        return GameResponse.model_validate(game)

    def _user_is_participant(self, game: Game, user_id: UUID) -> bool:
        """Return True if user_id is the owner or one of the players in the game."""
        if game.owner_id is not None and game.owner_id == user_id:
            return True
        if not game.player_user_ids:
            return False
        user_str = str(user_id)
        for pid in game.player_user_ids:
            if pid is not None and str(pid) == user_str:
                return True
        return False

    async def get_game_if_participant(self, game_id: UUID, user_id: UUID) -> Optional[GameResponse]:
        """
        Get game by ID only if the user is a participant (owner or player).

        Returns:
            Game response if found and user is participant, else None.
        """
        game = self.game_repo.get_by_id(game_id)
        if not game:
            return None
        if not self._user_is_participant(game, user_id):
            return None
        return GameResponse.model_validate(game)

    async def update_game(self, game_id: UUID, game_update: GameUpdate) -> Optional[GameResponse]:
        """
        Update a game.

        Args:
            game_id: Game UUID
            game_update: Update data

        Returns:
            Updated game response or None if not found
        """
        game = self.game_repo.get_by_id(game_id)
        if not game:
            return None

        if game_update.scores is not None:
            game.scores = game_update.scores
        if game_update.current_round is not None:
            game.current_round = game_update.current_round
        if game_update.status is not None:
            game.status = game_update.status
        if game_update.name is not None:
            game.name = game_update.name

        updated_game = self.game_repo.update(game)
        self.db.commit()
        self.db.refresh(updated_game)

        return GameResponse.model_validate(updated_game)

    async def update_player_display_name(
        self, game_id: UUID, player_index: int, display_name: str, current_user_id: UUID
    ) -> Optional[GameResponse]:
        """
        Update display name for a player slot.
        Manager can update only slots with no linked user (placeholder).
        Any user can update their own slot's name (hold their seat).
        """
        if not 0 <= player_index <= 3:
            raise ValueError("player_index must be between 0 and 3")

        game = self.game_repo.get_by_id(game_id)
        if not game:
            return None

        player_user_ids = _ensure_four_slots(game.player_user_ids, None)
        slot_user_id = player_user_ids[player_index]
        slot_user_id_str = str(slot_user_id) if slot_user_id is not None else None
        current_user_str = str(current_user_id)

        # Manager can edit placeholder slots (no linked user)
        is_owner = game.owner_id is not None and str(game.owner_id) == current_user_str
        if slot_user_id is None:
            if not is_owner:
                raise ValueError("Only the game owner can edit placeholder player names")
        else:
            # Slot has a linked user: only that user can edit their display name
            if slot_user_id_str != current_user_str:
                raise ValueError("You can only edit your own display name")

        players = _ensure_four_slots(game.players, "")
        players[player_index] = display_name.strip()
        game.players = players

        updated_game = self.game_repo.update(game)
        self.db.commit()
        self.db.refresh(updated_game)
        return GameResponse.model_validate(updated_game)

    def _eligible_reset_voters(self, game: Game) -> set:
        """Set of user id strings who are linked players and must vote to reset."""
        pids = _ensure_four_slots(game.player_user_ids, None)
        return {str(pid) for pid in pids if pid is not None}

    async def request_reset(self, game_id: UUID, user_id: UUID) -> Optional[GameResponse]:
        """Propose a reset. Any linked player can propose. Opens voting."""
        game = self.game_repo.get_by_id(game_id)
        if not game:
            return None
        eligible = self._eligible_reset_voters(game)
        if not eligible:
            raise ValueError("No linked players to vote")
        if str(user_id) not in eligible:
            raise ValueError("Only a player in this game can request a reset")
        game.reset_requested_at = datetime.now(timezone.utc)
        game.reset_vote_user_ids = []
        updated_game = self.game_repo.update(game)
        self.db.commit()
        self.db.refresh(updated_game)
        return GameResponse.model_validate(updated_game)

    async def vote_reset(self, game_id: UUID, user_id: UUID) -> Optional[GameResponse]:
        """Vote yes for reset. When all linked players have voted, reset is performed."""
        game = self.game_repo.get_by_id(game_id)
        if not game:
            return None
        if game.reset_requested_at is None:
            raise ValueError("No reset has been requested for this game")
        eligible = self._eligible_reset_voters(game)
        if str(user_id) not in eligible:
            raise ValueError("Only a player in this game can vote to reset")
        vote_ids = list(game.reset_vote_user_ids or [])
        user_str = str(user_id)
        if user_str in vote_ids:
            return GameResponse.model_validate(game)  # already voted
        vote_ids.append(user_str)
        game.reset_vote_user_ids = vote_ids

        if set(vote_ids) >= eligible:
            # Unanimous: perform reset (bulk delete rounds for performance)
            from app.models.round import Round

            self.db.query(Round).filter(Round.game_id == game_id).delete()
            game.scores = [0, 0, 0, 0]
            game.current_round = 1
            game.reset_requested_at = None
            game.reset_vote_user_ids = None
        else:
            updated_game = self.game_repo.update(game)
            self.db.commit()
            self.db.refresh(updated_game)
            return GameResponse.model_validate(updated_game)

        updated_game = self.game_repo.update(game)
        self.db.commit()
        self.db.refresh(updated_game)
        return GameResponse.model_validate(updated_game)

    async def cancel_reset_request(self, game_id: UUID, user_id: UUID) -> Optional[GameResponse]:
        """Cancel an open reset request (e.g. by proposer or owner)."""
        game = self.game_repo.get_by_id(game_id)
        if not game:
            return None
        if game.reset_requested_at is None:
            return GameResponse.model_validate(game)
        is_owner = game.owner_id is not None and str(game.owner_id) == str(user_id)
        if not is_owner:
            raise ValueError("Only the game owner can cancel a reset request")
        game.reset_requested_at = None
        game.reset_vote_user_ids = None
        updated_game = self.game_repo.update(game)
        self.db.commit()
        self.db.refresh(updated_game)
        return GameResponse.model_validate(updated_game)

    async def delete_game(self, game_id: UUID) -> bool:
        """
        Delete a game.

        Args:
            game_id: Game UUID

        Returns:
            True if deleted, False if not found
        """
        game = self.game_repo.get_by_id(game_id)
        if not game:
            return False

        self.game_repo.delete(game)
        self.db.commit()
        return True

    async def list_games(self, user_id: UUID) -> List[GameResponse]:
        """
        List all games for a user (games they own or are a player in).

        Args:
            user_id: User UUID

        Returns:
            List of game responses
        """
        games = self.game_repo.get_games_by_user(user_id)
        return [GameResponse.model_validate(game) for game in games]

    async def join_game(self, game_id: UUID, user_id: UUID, player_index: int) -> GameResponse:
        """
        Join a game by updating player_user_ids at the specified index.

        Args:
            game_id: Game UUID
            user_id: User UUID joining the game
            player_index: Which seat (0-3) to join

        Returns:
            Updated game response

        Raises:
            ValueError: If player_index is invalid or seat is already taken
        """
        if not 0 <= player_index <= 3:
            raise ValueError("player_index must be between 0 and 3")

        game = self.game_repo.get_by_id(game_id)
        if not game:
            raise ValueError("Game not found")

        player_user_ids = _ensure_four_slots(game.player_user_ids, None)
        game.player_user_ids = [
            str(pid) if pid is not None and not isinstance(pid, str) else pid
            for pid in player_user_ids
        ]

        # Check if seat is already taken
        # Compare as strings since JSON stores UUIDs as strings
        user_id_str = str(user_id)
        existing_id = game.player_user_ids[player_index]
        if existing_id is not None:
            # Convert to string if it's a UUID object
            existing_id_str = str(existing_id) if not isinstance(existing_id, str) else existing_id
            if existing_id_str == user_id_str:
                raise ValueError(f"Player seat {player_index} is already taken by this user")
            else:
                raise ValueError(f"Player seat {player_index} is already taken")

        # Update player_user_ids - convert UUID to string for JSON storage
        game.player_user_ids[player_index] = str(user_id)

        updated_game = self.game_repo.update(game)
        self.db.commit()
        self.db.refresh(updated_game)

        return GameResponse.model_validate(updated_game)

    async def submit_bids(
        self, game_id: UUID, bids: List[int], trump_suit: Optional[str] = None
    ) -> Optional[GameResponse]:
        """
        Submit bids for current round (doesn't create round yet, just validates).

        Args:
            game_id: Game UUID
            bids: List of 4 bids
            trump_suit: Trump suit (optional)

        Returns:
            Updated game response or None if not found
        """
        game = self.game_repo.get_by_id(game_id)
        if not game:
            return None

        _validate_bids(bids)

        # Game state is updated when tricks are submitted
        # This method just validates and returns current game state
        return GameResponse.model_validate(game)

    async def submit_tricks(
        self,
        game_id: UUID,
        tricks: List[int],
        bids: List[int],
        trump_suit: Optional[str] = None,
        created_by: Optional[UUID] = None,
    ) -> Optional[tuple[Round, GameResponse]]:
        """
        Submit tricks and create round with calculated scores.

        Args:
            game_id: Game UUID
            tricks: List of 4 tricks taken
            bids: List of 4 bids (from previous submission)
            trump_suit: Trump suit (optional)
            created_by: User ID (optional, Phase 2)

        Returns:
            Tuple of (Round, Updated GameResponse) or None if not found
        """
        game = self.game_repo.get_by_id(game_id)
        if not game:
            return None

        _validate_tricks(tricks)
        _validate_bids(bids)

        # Create round with calculated scores
        round_obj = self.round_service.create_round(
            game=game,
            round_number=game.current_round,
            bids=bids,
            tricks=tricks,
            trump_suit=trump_suit,
            created_by=created_by,
        )

        game_scores = _ensure_four_slots(game.scores, 0)
        round_scores = _ensure_four_slots(round_obj.scores, 0)
        new_scores = [game_scores[i] + round_scores[i] for i in range(NUM_PLAYERS)]
        new_round = game.current_round + 1

        updated_game = await self.update_game(
            game_id, GameUpdate(scores=new_scores, current_round=new_round)
        )

        if not updated_game:
            raise ValueError("Failed to update game")

        return (round_obj, updated_game)
