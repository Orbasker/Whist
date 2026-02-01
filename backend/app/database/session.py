from app.database.connection import SessionLocal


def get_db_session():
    """Get database session"""
    return SessionLocal()
