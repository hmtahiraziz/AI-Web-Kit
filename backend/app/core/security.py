"""Clerk JWT verification.

Verifies the ``Authorization: Bearer <jwt>`` header against Clerk's JWKS
endpoint (RS256). The verified subject (``sub``) becomes the user id.

Set ``AUTH_DISABLED=true`` to bypass verification during local development
when Clerk keys are not configured.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

import httpx
from jose import jwt
from jose.exceptions import JWTError

from app.core.config import Settings, get_settings
from app.core.exceptions import AuthError
from app.core.logger import get_logger

logger = get_logger(__name__)

_JWKS_TTL_SECONDS = 3600


@dataclass(frozen=True)
class AuthenticatedUser:
    """The authenticated principal extracted from a verified JWT."""

    user_id: str
    claims: dict


class ClerkJWTVerifier:
    """Fetches and caches Clerk's JWKS, then verifies incoming tokens."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._jwks: dict | None = None
        self._jwks_fetched_at: float = 0.0

    def _fetch_jwks(self) -> dict:
        now = time.time()
        if self._jwks and (now - self._jwks_fetched_at) < _JWKS_TTL_SECONDS:
            return self._jwks

        if not self._settings.clerk_jwks_url:
            raise AuthError("Auth is not configured (missing CLERK_JWKS_URL)")

        try:
            response = httpx.get(self._settings.clerk_jwks_url, timeout=10.0)
            response.raise_for_status()
        except httpx.HTTPError as exc:  # network / status errors
            logger.error("Failed to fetch Clerk JWKS: %s", exc)
            raise AuthError("Unable to fetch signing keys") from exc

        self._jwks = response.json()
        self._jwks_fetched_at = now
        return self._jwks

    def _signing_key(self, token: str) -> dict:
        try:
            header = jwt.get_unverified_header(token)
        except JWTError as exc:
            raise AuthError("Malformed token header") from exc

        kid = header.get("kid")
        jwks = self._fetch_jwks()
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                return key
        # Key rotated? Force a refresh once.
        self._jwks = None
        for key in self._fetch_jwks().get("keys", []):
            if key.get("kid") == kid:
                return key
        raise AuthError("No matching signing key for token")

    def verify(self, token: str) -> AuthenticatedUser:
        key = self._signing_key(token)

        options = {
            "verify_aud": bool(self._settings.clerk_audience),
        }
        try:
            claims = jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                audience=self._settings.clerk_audience or None,
                issuer=self._settings.clerk_issuer or None,
                options=options,
            )
        except JWTError as exc:
            logger.warning("JWT verification failed: %s", exc)
            raise AuthError("Invalid or expired token") from exc

        subject = claims.get("sub")
        if not subject:
            raise AuthError("Token missing subject claim")
        return AuthenticatedUser(user_id=subject, claims=claims)


_verifier: ClerkJWTVerifier | None = None


def get_verifier() -> ClerkJWTVerifier:
    """Return a process-wide verifier singleton."""
    global _verifier
    if _verifier is None:
        _verifier = ClerkJWTVerifier(get_settings())
    return _verifier
