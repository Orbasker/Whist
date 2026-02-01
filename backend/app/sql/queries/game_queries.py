"""Raw SQL queries for Game operations"""


class GameQueries:
    """Raw SQL queries for complex game operations"""
    
    def get_games_with_round_count(self) -> str:
        """Get games with round count using JOIN"""
        return """
            SELECT 
                g.id,
                g.players,
                g.scores,
                g.current_round,
                g.status,
                COUNT(r.id) as total_rounds,
                MAX(r.created_at) as last_round_at
            FROM games g
            LEFT JOIN rounds r ON g.id = r.game_id
            GROUP BY g.id, g.players, g.scores, g.current_round, g.status
            ORDER BY g.created_at DESC
        """
    
    def get_player_history(self) -> str:
        """Get player's game history"""
        # Note: This query works with PostgreSQL JSON functions
        # For SQLite, we'd need a different approach
        return """
            SELECT 
                g.id as game_id,
                g.players,
                g.scores,
                g.current_round,
                g.status,
                g.created_at,
                COUNT(r.id) as rounds_played
            FROM games g
            LEFT JOIN rounds r ON g.id = r.game_id
            WHERE :player_name IN (
                SELECT json_extract(value, '$') 
                FROM json_each(g.players)
            )
            GROUP BY g.id, g.players, g.scores, g.current_round, g.status, g.created_at
            ORDER BY g.created_at DESC
        """
