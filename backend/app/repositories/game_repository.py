from typing import List, Optional
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.game import Game
from app.repositories.base_repository import BaseRepository
from app.sql.queries.game_queries import GameQueries


class GameRepository(BaseRepository[Game]):
    """Repository for Game model with ORM and SQL methods"""

    def __init__(self, db: Session):
        super().__init__(db, Game)
        self.sql_queries = GameQueries()

    # ORM methods for simple operations
    def get_by_id(self, game_id: UUID) -> Optional[Game]:
        """Get game by ID using ORM"""
        return self.db.query(Game).filter(Game.id == game_id).first()

    def get_active_games(self) -> List[Game]:
        """Get all active games using ORM"""
        from app.models.game import GameStatus

        return self.db.query(Game).filter(Game.status == GameStatus.ACTIVE).all()

    # Raw SQL methods for complex queries
    def get_games_with_stats(self) -> List[dict]:
        """Get games with round count using raw SQL"""
        query = self.sql_queries.get_games_with_round_count()
        result = self.db.execute(text(query))
        return [dict(row._mapping) for row in result]

    def get_player_history(self, player_name: str) -> List[dict]:
        """Get player's game history using raw SQL"""
        query = self.sql_queries.get_player_history()
        result = self.db.execute(text(query), {"player_name": player_name})
        return [dict(row._mapping) for row in result]

    def get_games_by_user(self, user_id: UUID) -> List[Game]:
        """
        Get all games for a user (games they own or are a player in).
        Uses DB-side filtering for performance (no loading all games into memory).
        """
        dialect_name = self.db.get_bind().dialect.name
        if dialect_name == "postgresql":
            query = self.sql_queries.get_games_by_user_ids_postgresql()
        else:
            query = self.sql_queries.get_games_by_user_ids_sqlite()

        result = self.db.execute(text(query), {"user_id": user_id, "user_id_str": str(user_id)})
        ids_in_order = [row[0] for row in result]
        if not ids_in_order:
            return []

        games = self.db.query(Game).filter(Game.id.in_(ids_in_order)).all()
        return sorted(games, key=lambda g: ids_in_order.index(g.id))
