"""
Authentication for FastAPI: JWT verification for tokens issued by Neon Auth.

Neon Auth is integrated with Neon PostgreSQL; this module provides a dependency that verifies
the JWT (from Authorization header or session cookie) using Neon's JWKS (JSON Web Key Set).
See docs/plan/authentication-architecture.md.
"""

from typing import Optional

import httpx
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from jose.utils import base64url_decode

from app.config import settings

HTTP_BEARER = HTTPBearer(auto_error=False)

# Cache for JWKS to avoid fetching on every request
_jwks_cache: Optional[dict] = None
_jwks_cache_expiry: Optional[float] = None
JWKS_CACHE_TTL = 3600  # Cache for 1 hour


async def get_jwks() -> dict:
    """
    Fetch JWKS from Neon Auth endpoint with caching.
    """
    global _jwks_cache, _jwks_cache_expiry
    import time
    
    current_time = time.time()
    
    # Return cached JWKS if still valid
    if _jwks_cache and _jwks_cache_expiry and current_time < _jwks_cache_expiry:
        return _jwks_cache
    
    if not settings.neon_auth_jwks_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth not configured (NEON_AUTH_JWKS_URL)",
        )
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(settings.neon_auth_jwks_url)
            response.raise_for_status()
            jwks = response.json()
            
            # Cache the JWKS
            _jwks_cache = jwks
            _jwks_cache_expiry = current_time + JWKS_CACHE_TTL
            
            return jwks
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to fetch JWKS: {str(e)}",
        ) from e


def get_signing_key(jwks: dict, token: str) -> Optional[dict]:
    """
    Get the signing key from JWKS that matches the token's key ID (kid).
    """
    try:
        # Decode token header to get kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        if not kid:
            return None
        
        # Find the key with matching kid
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                return key
        
        return None
    except Exception:
        return None


async def verify_token_with_jwks(token: str) -> dict:
    """
    Verify JWT token using JWKS from Neon Auth.
    """
    jwks = await get_jwks()
    signing_key = get_signing_key(jwks, token)
    
    if not signing_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: no matching key found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Convert JWK to PEM format for verification
    # For RS256 (most common), we need to construct the public key
    if signing_key.get("kty") == "RSA":
        # Decode base64url encoded values
        n_bytes = base64url_decode(signing_key["n"].encode())
        e_bytes = base64url_decode(signing_key["e"].encode())
        
        # Convert bytes to integers
        n_int = int.from_bytes(n_bytes, byteorder="big")
        e_int = int.from_bytes(e_bytes, byteorder="big")
        
        # Create RSA public key
        public_numbers = rsa.RSAPublicNumbers(e_int, n_int)
        public_key = public_numbers.public_key()
        
        # Serialize to PEM format
        pem_key = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        # Verify token
        try:
            payload = jwt.decode(
                token,
                pem_key,
                algorithms=["RS256"],
                options={"verify_exp": True, "verify_signature": True},
            )
            return payload
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            ) from e
    else:
        # For other key types, you may need different handling
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=f"Unsupported key type: {signing_key.get('kty')}",
        )


async def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTP_BEARER),
    session_cookie: Optional[str] = Cookie(None, alias="neon-auth.session_token"),
) -> str:
    """
    Require a valid JWT and return the user id (sub claim).

    Accepts token from Authorization: Bearer <token> or from the session cookie
    (neon-auth.session_token) when same domain. Uses Neon's JWKS for verification (RS256).
    """
    token = (credentials.credentials if credentials else None) or session_cookie
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = await verify_token_with_jwks(token)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing sub",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return str(sub)


async def get_current_user_id_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTP_BEARER),
    session_cookie: Optional[str] = Cookie(None, alias="neon-auth.session_token"),
) -> Optional[str]:
    """
    Optional auth: returns user id if a valid JWT is present, otherwise None.
    """
    token = (credentials.credentials if credentials else None) or session_cookie
    if not token or not settings.neon_auth_jwks_url:
        return None
    try:
        payload = await verify_token_with_jwks(token)
        sub = payload.get("sub")
        return str(sub) if sub else None
    except HTTPException:
        return None
