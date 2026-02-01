from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.models.base import Base, GUID


class Round(Base):
    __tablename__ = "rounds"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(GUID(), ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    round_number = Column(Integer, nullable=False)
    bids = Column(JSON, nullable=False)  # [0, 3, 4, 5]
    tricks = Column(JSON, nullable=False)  # [2, 3, 4, 4]
    scores = Column(JSON, nullable=False)  # [-20, 19, 26, -10]
    round_mode = Column(String, nullable=False)  # 'over' or 'under'
    trump_suit = Column(String, nullable=True)  # 'spades', 'clubs', 'diamonds', 'hearts', 'no-trump'
    created_by = Column(GUID(), nullable=True)  # Phase 2: Who submitted
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    game = relationship("Game", back_populates="rounds")
