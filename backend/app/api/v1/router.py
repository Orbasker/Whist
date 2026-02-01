"""API v1 router"""

from fastapi import APIRouter
from app.views import games, rounds, health

api_router = APIRouter()

# Include all routers
api_router.include_router(health.router)
api_router.include_router(games.router)
api_router.include_router(rounds.router)
