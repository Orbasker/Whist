"""
Proxy router for Better Auth: forwards /api/auth/* to the external Better Auth service.

When BETTER_AUTH_URL is set, all requests to this router are proxied to that URL.
The Better Auth server (Node) handles sign-up, sign-in, session, etc.; see
docs/plan/authentication-architecture.md.
"""

import logging

import httpx
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse

from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["auth"])

# Headers to forward from the client (skip hop-by-hop and sensitive ones)
FORWARD_REQUEST_HEADERS = {
    "content-type",
    "accept",
    "accept-encoding",
    "authorization",
    "cookie",
    "origin",
    "referer",
    "user-agent",
}

# Headers to forward from the auth service response back to the client
FORWARD_RESPONSE_HEADERS = {
    "content-type",
    "set-cookie",
    "cache-control",
    "content-length",
}


def _build_auth_base_url() -> str:
    base = (settings.better_auth_url or "").rstrip("/")
    return base


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_better_auth(path: str, request: Request) -> Response:
    """
    Proxy request to the configured Better Auth service.
    Returns 503 if BETTER_AUTH_URL is not set.
    """
    base_url = _build_auth_base_url()
    if not base_url:
        return JSONResponse(
            status_code=503,
            content={
                "error": "Auth service not configured",
                "detail": "Set BETTER_AUTH_URL to the Better Auth API base (e.g. http://localhost:3000/api/auth)",
            },
        )
    target = f"{base_url}/{path}" if path else base_url
    # Forward query string
    if request.url.query:
        target = f"{target}?{request.url.query}"

    incoming_headers = dict(request.headers)
    outgoing_headers = {
        k: v
        for k, v in incoming_headers.items()
        if k.lower() in FORWARD_REQUEST_HEADERS
    }
    body = await request.body()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.request(
                request.method,
                target,
                headers=outgoing_headers,
                content=body,
            )
    except httpx.RequestError as e:
        logger.warning("Auth proxy request failed: %s", e)
        return JSONResponse(
            status_code=502,
            content={
                "error": "Auth service unavailable",
                "detail": str(e),
            },
        )

    response_headers: dict[str, str] = {}
    for k, v in resp.headers.items():
        if k.lower() in FORWARD_RESPONSE_HEADERS:
            response_headers[k] = v

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=response_headers,
    )
