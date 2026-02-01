import pytest
from app.services.scoring_service import ScoringService


class TestScoringService:
    """Tests for ScoringService"""
    
    def test_calculate_score_bid_zero_tricks_zero_under(self):
        """Test: Bid 0, Take 0, Under mode = 50 points"""
        score = ScoringService.calculate_score(0, 0, 'under')
        assert score == 50
    
    def test_calculate_score_bid_zero_tricks_zero_over(self):
        """Test: Bid 0, Take 0, Over mode = 30 points"""
        score = ScoringService.calculate_score(0, 0, 'over')
        assert score == 30
    
    def test_calculate_score_bid_zero_take_tricks(self):
        """Test: Bid 0, Take tricks = -10 × tricks"""
        assert ScoringService.calculate_score(0, 1, 'under') == -10
        assert ScoringService.calculate_score(0, 2, 'under') == -20
        assert ScoringService.calculate_score(0, 3, 'under') == -30
    
    def test_calculate_score_bid_matches_tricks(self):
        """Test: Bid matches tricks = (bid²) + 10"""
        assert ScoringService.calculate_score(1, 1, 'under') == 11  # 1² + 10
        assert ScoringService.calculate_score(3, 3, 'under') == 19  # 3² + 10
        assert ScoringService.calculate_score(5, 5, 'under') == 35  # 5² + 10
        assert ScoringService.calculate_score(13, 13, 'under') == 179  # 13² + 10
    
    def test_calculate_score_bid_doesnt_match(self):
        """Test: Bid doesn't match = -10 × |bid - tricks|"""
        assert ScoringService.calculate_score(3, 2, 'under') == -10  # |3-2| = 1
        assert ScoringService.calculate_score(5, 3, 'under') == -20  # |5-3| = 2
        assert ScoringService.calculate_score(2, 5, 'under') == -30  # |2-5| = 3
    
    def test_calculate_round_mode_over(self):
        """Test: Total bids > 13 = 'over'"""
        assert ScoringService.calculate_round_mode(14) == 'over'
        assert ScoringService.calculate_round_mode(20) == 'over'
    
    def test_calculate_round_mode_under(self):
        """Test: Total bids <= 13 = 'under'"""
        assert ScoringService.calculate_round_mode(13) == 'under'
        assert ScoringService.calculate_round_mode(10) == 'under'
        assert ScoringService.calculate_round_mode(0) == 'under'
