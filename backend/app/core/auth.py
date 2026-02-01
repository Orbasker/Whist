"""
Authentication for FastAPI: JWT verification for tokens issued by Better Auth (Node service).

Better Auth runs as a separate service; this module provides a dependency that verifies
the JWT (from Authorization header or session cookie) using the shared BETTER_AUTH_SECRET.
See docs/plan/authentication-architecture.md.
"""

from typing import Optional

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

HTTP_BEARER = HTTPBearer(auto_error=False)


def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTP_BEARER),
    session_cookie: Optional[str] = Cookie(None, alias="better-auth.session_token"),
) -> str:
    """
    Require a valid JWT and return the user id (sub claim).

    Accepts token from Authorization: Bearer <token> or from the session cookie
    (better-auth.session_token) when same domain. Uses the shared BETTER_AUTH_SECRET
    for verification (HS256).
    """
    token = (credentials.credentials if credentials else None) or session_cookie
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not settings.auth_jwt_secret or len(settings.auth_jwt_secret) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth not configured (AUTH_JWT_SECRET)",
        )
    try:
        payload = jwt.decode(
            token,
            settings.auth_jwt_secret,
            algorithms=["HS256"],
            options={"verify_exp": True},
        )
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing sub",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return str(sub)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


def get_current_user_id_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTP_BEARER),
    session_cookie: Optional[str] = Cookie(None, alias="better-auth.session_token"),
) -> Optional[str]:
    """
    Optional auth: returns user id if a valid JWT is present, otherwise None.
    """
    token = (credentials.credentials if credentials else None) or session_cookie
    if not token or not settings.auth_jwt_secret or len(settings.auth_jwt_secret) < 32:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.auth_jwt_secret,
            algorithms=["HS256"],
            options={"verify_exp": True},
        )
        sub = payload.get("sub")
        return str(sub) if sub else None
    except JWTError:
        return None
