"""
Auth router - Note: With Neon Auth, authentication is handled directly by Neon.
This router is kept for backward compatibility but is not needed with Neon Auth.

Neon Auth handles authentication at the database level, and the frontend
communicates directly with Neon Auth endpoints. FastAPI verifies JWTs issued by Neon.
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


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_better_auth(path: str, request: Request) -> Response:
    """
    Note: With Neon Auth, this proxy is not needed.
    Frontend communicates directly with Neon Auth endpoints.
    This endpoint returns 501 to indicate Neon Auth should be used directly.
    """
    return JSONResponse(
        status_code=501,
        content={
            "error": "Use Neon Auth directly",
            "detail": "With Neon Auth, the frontend should communicate directly with Neon Auth endpoints. " +
                      "FastAPI verifies JWTs issued by Neon Auth, but does not proxy auth requests.",
            "neon_auth_docs": "https://neon.tech/docs/auth"
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
