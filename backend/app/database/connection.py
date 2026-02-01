from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Create engine
engine = create_engine(
    settings.effective_database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.effective_database_url else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
