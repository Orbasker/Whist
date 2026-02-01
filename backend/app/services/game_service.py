"""Game service for game orchestration"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.game import Game, GameMode, GameStatus
from app.models.round import Round
from app.repositories.game_repository import GameRepository
from app.schemas.game import GameCreate, GameResponse, GameUpdate
from app.services.round_service import RoundService
from app.services.scoring_service import ScoringService


class GameService:
    """Business logic for game management"""
    
    def __init__(self, db: Session, game_repo: GameRepository, round_service: RoundService):
        self.db = db
        self.game_repo = game_repo
        self.round_service = round_service
        self.scoring_service = ScoringService()
    
    async def create_game(self, game_data: GameCreate) -> GameResponse:
        """
        Create a new game.
        
        Args:
            game_data: Game creation data
            
        Returns:
            Created game response
        """
        game = Game(
            players=game_data.players,
            scores=[0, 0, 0, 0],
            current_round=1,
            status=GameStatus.ACTIVE,
            game_mode=GameMode.SCORING_ONLY
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
    
    async def submit_bids(
        self,
        game_id: UUID,
        bids: List[int],
        trump_suit: Optional[str] = None
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
        
        # Validation: bids must be 4 values, each 0-13
        if len(bids) != 4 or not all(0 <= bid <= 13 for bid in bids):
            raise ValueError("Invalid bids: must be 4 values, each between 0 and 13")
        
        # Game state is updated when tricks are submitted
        # This method just validates and returns current game state
        return GameResponse.model_validate(game)
    
    async def submit_tricks(
        self,
        game_id: UUID,
        tricks: List[int],
        bids: List[int],
        trump_suit: Optional[str] = None,
        created_by: Optional[UUID] = None
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
        from app.models.round import Round
        
        game = self.game_repo.get_by_id(game_id)
        if not game:
            return None
        
        # Validation: tricks must be 4 values, each 0-13, sum = 13
        if len(tricks) != 4 or not all(0 <= trick <= 13 for trick in tricks):
            raise ValueError("Invalid tricks: must be 4 values, each between 0 and 13")
        if sum(tricks) != 13:
            raise ValueError(f"Invalid tricks: sum must be 13, got {sum(tricks)}")
        
        # Validation: bids must be 4 values, each 0-13
        if len(bids) != 4 or not all(0 <= bid <= 13 for bid in bids):
            raise ValueError("Invalid bids: must be 4 values, each between 0 and 13")
        
        # Create round with calculated scores
        round_obj = self.round_service.create_round(
            game=game,
            round_number=game.current_round,
            bids=bids,
            tricks=tricks,
            trump_suit=trump_suit,
            created_by=created_by
        )
        
        # Update game scores and round number
        round_scores = round_obj.scores
        new_scores = [game.scores[i] + round_scores[i] for i in range(4)]
        new_round = game.current_round + 1
        
        from app.schemas.game import GameUpdate
        updated_game = await self.update_game(
            game_id,
            GameUpdate(scores=new_scores, current_round=new_round)
        )
        
        if not updated_game:
            raise ValueError("Failed to update game")
        
        return (round_obj, updated_game)
