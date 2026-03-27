"""Vercel serverless entry point — exports the FastAPI ASGI app."""

from app.main import app  # noqa: F401 — Vercel discovers this export at deploy time
