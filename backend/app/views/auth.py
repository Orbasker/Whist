"""
Auth router - Note: With Neon Auth, authentication is handled directly by Neon.
This router is kept for backward compatibility but is not needed with Neon Auth.

Neon Auth handles authentication at the database level, and the frontend
communicates directly with Neon Auth endpoints. FastAPI verifies JWTs issued by Neon.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(tags=["auth"])


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_better_auth(path: str) -> JSONResponse:
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
