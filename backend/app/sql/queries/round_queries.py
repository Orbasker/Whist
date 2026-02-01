"""Raw SQL queries for Round operations"""


class RoundQueries:
    """Raw SQL queries for complex round operations"""
    
    def get_round_statistics(self) -> str:
        """Get round statistics"""
        return """
            SELECT 
                round_number,
                round_mode,
                trump_suit,
                COUNT(*) as frequency,
                AVG(
                    CAST(json_extract(scores, '$[0]') AS INTEGER) + 
                    CAST(json_extract(scores, '$[1]') AS INTEGER) + 
                    CAST(json_extract(scores, '$[2]') AS INTEGER) + 
                    CAST(json_extract(scores, '$[3]') AS INTEGER)
                ) as avg_total_score
            FROM rounds
            GROUP BY round_number, round_mode, trump_suit
            ORDER BY round_number
        """
