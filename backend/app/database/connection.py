from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

from app.config import settings

# Build engine kwargs from effective database URL
url = settings.effective_database_url
is_sqlite = "sqlite" in url
connect_args: dict = {}
engine_kwargs: dict = {}

if is_sqlite:
    connect_args["check_same_thread"] = False
    engine_kwargs["connect_args"] = connect_args
else:
    # PostgreSQL (Neon or local): connection pooling and optional SSL
    engine_kwargs["poolclass"] = QueuePool
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_pre_ping"] = True  # Detect stale connections (e.g. Neon serverless)
    # Neon requires SSL; enforce when connecting to Neon if not already in URL
    if "neon.tech" in url and "sslmode" not in url:
        connect_args["sslmode"] = "require"
    if connect_args:
        engine_kwargs["connect_args"] = connect_args

engine = create_engine(url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
