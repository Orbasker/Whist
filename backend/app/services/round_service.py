"""Round service for managing game rounds"""

from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.round import Round
from app.models.game import Game
from app.services.scoring_service import ScoringService
from app.repositories.round_repository import RoundRepository


class RoundService:
    """Business logic for round management"""
    
    def __init__(self, db: Session, round_repo: RoundRepository):
        self.db = db
        self.round_repo = round_repo
        self.scoring_service = ScoringService()
    
    def create_round(
        self,
        game: Game,
        round_number: int,
        bids: List[int],
        tricks: List[int],
        trump_suit: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> Round:
        """
        Create a round with calculated scores.
        
        Args:
            game: Game instance
            round_number: Round number
            bids: List of 4 bids
            tricks: List of 4 tricks taken
            trump_suit: Trump suit (optional)
            created_by: User ID who created (optional, Phase 2)
            
        Returns:
            Created Round instance
        """
        total_bids = sum(bids)
        round_mode = self.scoring_service.calculate_round_mode(total_bids)
        
        # Calculate scores for each player
        scores = [
            self.scoring_service.calculate_score(bids[i], tricks[i], round_mode)
            for i in range(4)
        ]
        
        # Create round
        round = Round(
            game_id=game.id,
            round_number=round_number,
            bids=bids,
            tricks=tricks,
            scores=scores,
            round_mode=round_mode,
            trump_suit=trump_suit,
            created_by=created_by
        )
        
        return self.round_repo.create(round)
    
    def get_rounds_by_game(self, game_id: UUID) -> List[Round]:
        """Get all rounds for a game"""
        return self.round_repo.get_by_game_id(game_id)
