"""FastAPI application entry point"""

import logging

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.config import settings
from app.core.exceptions import GameNotFoundError, InvalidBidsError, InvalidTricksError
from app.core.middleware import (
    game_not_found_handler,
    invalid_bids_handler,
    invalid_tricks_handler,
    validation_exception_handler,
)
from app.views.auth import router as auth_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.is_production else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Create FastAPI app
app = FastAPI(
    title=settings.project_name,
    version="1.0.0",
    description="Whist card game scoring API"
)

# Configure CORS (auth endpoints need credentials for cookies)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.effective_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth router: Note - With Neon Auth, frontend communicates directly with Neon.
# This router is kept for backward compatibility but returns 501.
app.include_router(auth_router, prefix="/api/auth")

# Include API router
app.include_router(api_router, prefix=settings.api_v1_prefix)

# Add exception handlers
app.add_exception_handler(GameNotFoundError, game_not_found_handler)
app.add_exception_handler(InvalidBidsError, invalid_bids_handler)
app.add_exception_handler(InvalidTricksError, invalid_tricks_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Whist Game API",
        "version": "1.0.0",
        "docs": "/docs"
    }
