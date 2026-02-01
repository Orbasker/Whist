"""Scoring service for calculating game scores"""


class ScoringService:
    """Pure business logic for scoring calculations"""
    
    @staticmethod
    def calculate_score(bid: int, tricks: int, round_mode: str) -> int:
        """
        Calculate score for a player's round.
        
        Rules:
        - Bid 0 + Take 0: +50 (under) or +30 (over)
        - Bid 0 + Take tricks: -10 × tricks
        - Bid matches tricks: (bid²) + 10
        - Bid doesn't match: -10 × |bid - tricks|
        
        Args:
            bid: Player's bid (0-13)
            tricks: Actual tricks taken (0-13)
            round_mode: 'over' or 'under'
            
        Returns:
            Score for this round
        """
        if bid == 0:
            if tricks == 0:
                return 50 if round_mode == 'under' else 30
            else:
                return -10 * tricks
        else:
            if bid == tricks:
                return (bid * bid) + 10
            else:
                return -10 * abs(bid - tricks)
    
    @staticmethod
    def calculate_round_mode(total_bids: int) -> str:
        """
        Calculate if round is 'over' or 'under'.
        
        Args:
            total_bids: Sum of all players' bids
            
        Returns:
            'over' if total_bids > 13, 'under' otherwise
        """
        return 'over' if total_bids > 13 else 'under'
