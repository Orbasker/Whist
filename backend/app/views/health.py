"""Health check endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.common import HealthResponse
from app.database.connection import get_db

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Readiness probe: use for checks that require DB (e.g. k8s readiness, dashboards). Use GET /health for liveness only."""
    db_status: str | None = None
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"
    return HealthResponse(status="ok", database=db_status)
