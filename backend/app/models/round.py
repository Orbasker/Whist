from sqlalchemy import Column, Integer, JSON, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime


class Round(Base):
    __tablename__ = "rounds"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    round_number = Column(Integer, nullable=False)
    bids = Column(JSON, nullable=False)  # [0, 3, 4, 5]
    tricks = Column(JSON, nullable=False)  # [2, 3, 4, 4]
    scores = Column(JSON, nullable=False)  # [-20, 19, 26, -10]
    round_mode = Column(String, nullable=False)  # 'over' or 'under'
    trump_suit = Column(String, nullable=True)  # 'spades', 'clubs', 'diamonds', 'hearts', 'no-trump'
    created_by = Column(UUID(as_uuid=True), nullable=True)  # Phase 2: Who submitted
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    game = relationship("Game", back_populates="rounds")
