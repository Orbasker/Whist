import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.models.base import Base, GUID, TimestampMixin


class GameStatus(enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    SHARED = "shared"  # Phase 2


class GameMode(enum.Enum):
    SCORING_ONLY = "scoring_only"  # Phase 1-2
    FULL_REMOTE = "full_remote"    # Phase 3
    HYBRID = "hybrid"              # Phase 3


class Game(Base, TimestampMixin):
    __tablename__ = "games"
    
    # Phase 1
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    players = Column(JSON, nullable=False)  # List of player names
    scores = Column(JSON, nullable=False)   # List of scores [int, int, int, int]
    current_round = Column(Integer, default=1, nullable=False)
    status = Column(Enum(GameStatus), default=GameStatus.ACTIVE, nullable=False)
    
    # Phase 2 (nullable for backward compatibility)
    owner_id = Column(GUID(), nullable=True)  # References Supabase auth.users
    name = Column(String, nullable=True)  # Optional game name
    player_user_ids = Column(JSON, nullable=True)  # [user_id1, null, null, null]
    is_shared = Column(Boolean, default=False)
    share_code = Column(String, unique=True, nullable=True)
    
    # Phase 3
    game_mode = Column(Enum(GameMode), default=GameMode.SCORING_ONLY)
    
    # Relationships
    rounds = relationship("Round", back_populates="game", cascade="all, delete-orphan")
