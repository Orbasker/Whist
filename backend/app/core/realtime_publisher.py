"""Optional publisher for Supabase Realtime Broadcast API.

When SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set, broadcast messages
are also sent to Supabase so clients can subscribe via Supabase Realtime
instead of (or in addition to) WebSockets.
"""

import logging
from typing import Any, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

REALTIME_TOPIC_PREFIX = "game:"


class RealtimePublisher:
    """Publishes game messages to Supabase Realtime Broadcast API."""

    def __init__(self) -> None:
        self._enabled = settings.use_supabase_realtime
        self._url = settings.supabase_realtime_broadcast_url
        self._api_key = settings.supabase_service_role_key

    @property
    def enabled(self) -> bool:
        return self._enabled and bool(self._url and self._api_key)

    async def publish(self, game_id: str, message: dict[str, Any]) -> None:
        """Send a message to the Supabase Realtime channel for this game.

        No-op if Supabase is not configured. Topic is 'game:{game_id}'.
        Clients subscribe to the same topic to receive the same message shape
        as WebSocket (type, game?, phase?, data?, etc.).
        """
        if not self.enabled:
            return

        topic = f"{REALTIME_TOPIC_PREFIX}{game_id}"
        payload = {
            "messages": [
                {
                    "topic": topic,
                    "event": "message",
                    "payload": message,
                }
            ]
        }
        headers = {
            "apikey": self._api_key,
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(self._url, json=payload, headers=headers)
                if resp.status_code >= 400:
                    logger.warning(
                        "Supabase Realtime broadcast failed: %s %s",
                        resp.status_code,
                        resp.text[:200],
                    )
        except Exception as e:
            logger.warning("Supabase Realtime publish error: %s", e)


def get_realtime_publisher() -> Optional[RealtimePublisher]:
    """Return a RealtimePublisher if Supabase is configured, else None."""
    if not settings.use_supabase_realtime:
        return None
    return RealtimePublisher()


realtime_publisher: Optional[RealtimePublisher] = None


def get_or_create_realtime_publisher() -> Optional[RealtimePublisher]:
    """Lazy singleton for RealtimePublisher (used by ConnectionManager)."""
    global realtime_publisher
    if realtime_publisher is None and settings.use_supabase_realtime:
        realtime_publisher = RealtimePublisher()
    return realtime_publisher
