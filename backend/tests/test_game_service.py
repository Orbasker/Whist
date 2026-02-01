import pytest
from uuid import uuid4
from app.schemas.game import GameCreate
from app.models.game import GameStatus


class TestGameService:
    """Tests for GameService"""
    
    def test_create_game(self, game_service):
        """Test creating a game"""
        game_data = GameCreate(players=["Player1", "Player2", "Player3", "Player4"])
        game = game_service.create_game(game_data)
        
        assert game.players == ["Player1", "Player2", "Player3", "Player4"]
        assert game.scores == [0, 0, 0, 0]
        assert game.current_round == 1
        assert game.status == GameStatus.ACTIVE
    
    def test_get_game(self, game_service):
        """Test getting a game"""
        game_data = GameCreate(players=["P1", "P2", "P3", "P4"])
        created_game = game_service.create_game(game_data)
        
        retrieved_game = game_service.get_game(created_game.id)
        assert retrieved_game is not None
        assert retrieved_game.id == created_game.id
        assert retrieved_game.players == ["P1", "P2", "P3", "P4"]
    
    def test_get_nonexistent_game(self, game_service):
        """Test getting a non-existent game"""
        fake_id = uuid4()
        game = game_service.get_game(fake_id)
        assert game is None
