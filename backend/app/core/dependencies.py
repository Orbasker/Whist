"""FastAPI dependencies"""

from fastapi import Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.repositories.game_repository import GameRepository
from app.repositories.round_repository import RoundRepository
from app.services.round_service import RoundService
from app.services.game_service import GameService


def get_game_repository(db: Session = Depends(get_db)) -> GameRepository:
    """Dependency for game repository"""
    return GameRepository(db)


def get_round_repository(db: Session = Depends(get_db)) -> RoundRepository:
    """Dependency for round repository"""
    return RoundRepository(db)


def get_round_service(
    db: Session = Depends(get_db),
    round_repo: RoundRepository = Depends(get_round_repository)
) -> RoundService:
    """Dependency for round service"""
    return RoundService(db, round_repo)


def get_game_service(
    db: Session = Depends(get_db),
    game_repo: GameRepository = Depends(get_game_repository),
    round_service: RoundService = Depends(get_round_service)
) -> GameService:
    """Dependency for game service"""
    return GameService(db, game_repo, round_service)
