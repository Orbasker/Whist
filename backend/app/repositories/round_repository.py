from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text
from uuid import UUID
from app.models.round import Round
from app.repositories.base_repository import BaseRepository
from app.sql.queries.round_queries import RoundQueries


class RoundRepository(BaseRepository[Round]):
    """Repository for Round model with ORM and SQL methods"""
    
    def __init__(self, db: Session):
        super().__init__(db, Round)
        self.sql_queries = RoundQueries()
    
    # ORM methods
    def get_by_game_id(self, game_id: UUID) -> List[Round]:
        """Get all rounds for a game using ORM"""
        return self.db.query(Round).filter(Round.game_id == game_id).order_by(Round.round_number).all()
    
    def get_by_game_and_round(self, game_id: UUID, round_number: int) -> Round:
        """Get specific round using ORM"""
        return self.db.query(Round).filter(
            Round.game_id == game_id,
            Round.round_number == round_number
        ).first()
    
    # Raw SQL methods
    def get_round_statistics(self) -> List[dict]:
        """Get round statistics using raw SQL"""
        query = self.sql_queries.get_round_statistics()
        result = self.db.execute(text(query))
        return [dict(row._mapping) for row in result]
