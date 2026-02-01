import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.database.connection import get_db
from app.repositories.game_repository import GameRepository
from app.repositories.round_repository import RoundRepository
from app.services.round_service import RoundService
from app.services.game_service import GameService


# Test database (in-memory SQLite)
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db():
    """Create test database session"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def game_repo(db):
    """Create game repository"""
    return GameRepository(db)


@pytest.fixture
def round_repo(db):
    """Create round repository"""
    return RoundRepository(db)


@pytest.fixture
def round_service(db, round_repo):
    """Create round service"""
    return RoundService(db, round_repo)


@pytest.fixture
def game_service(db, game_repo, round_service):
    """Create game service"""
    return GameService(db, game_repo, round_service)
