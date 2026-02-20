"""Raw SQL queries for Game operations"""


class GameQueries:
    """Raw SQL queries for complex game operations"""

    def get_games_by_user_ids_sqlite(self) -> str:
        """Get game ids for a user (owner or player) for SQLite using json_each."""
        return """
            SELECT g.id
            FROM games g
            WHERE g.owner_id = :user_id
               OR EXISTS (
                   SELECT 1 FROM json_each(g.player_user_ids) AS je
                   WHERE je.value IS NOT NULL AND trim(je.value, '"') = :user_id_str
               )
            ORDER BY g.created_at DESC
        """

    def get_games_by_user_ids_postgresql(self) -> str:
        """Get game ids for a user (owner or player) for PostgreSQL using jsonb."""
        return """
            SELECT g.id
            FROM games g
            WHERE g.owner_id = :user_id
               OR (
                   g.player_user_ids IS NOT NULL
                   AND EXISTS (
                       SELECT 1 FROM jsonb_array_elements_text(g.player_user_ids::jsonb) AS elem
                       WHERE elem = :user_id_str
                   )
               )
            ORDER BY g.created_at DESC
        """

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
