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
        result = self.db.execute(
            text(query),
            {"player_name": player_name}
        )
        return [dict(row._mapping) for row in result]
    
    def get_games_by_user(self, user_id: UUID) -> List[Game]:
        """
        Get all games for a user (games they own or are a player in).
        
        Args:
            user_id: User UUID
            
        Returns:
            List of games
        """
        # Get games where user is the owner
        owner_games = self.db.query(Game).filter(Game.owner_id == user_id).all()
        
        # Get games where user is a player (check player_user_ids JSON array)
        # Query games where player_user_ids is not null
        player_games = self.db.query(Game).filter(
            Game.player_user_ids.isnot(None)
        ).all()
        
        # Filter in Python for games where user_id is in player_user_ids
        # Handle both UUID objects and string UUIDs in the JSON array
        player_games_filtered = []
        for game in player_games:
            if not game.player_user_ids:
                continue
            for pid in game.player_user_ids:
                if pid is None:
                    continue
                # Compare UUIDs: handle both UUID objects and string UUIDs
                pid_uuid = UUID(str(pid)) if not isinstance(pid, UUID) else pid
                if pid_uuid == user_id:
                    player_games_filtered.append(game)
                    break
        
        # Combine and deduplicate by game ID
        all_games = {game.id: game for game in owner_games + player_games_filtered}
        
        # Sort by created_at descending (most recent first)
        return sorted(all_games.values(), key=lambda g: g.created_at, reverse=True)