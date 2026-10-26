"""Auth helper endpoint — echoes the verified Clerk user (debugging/integration)."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.dependencies import CurrentUser

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get(
    "/me",
    summary="Echo the verified Clerk user",
    responses={401: {"description": "Missing or invalid Clerk JWT"}},
)
def me(user: CurrentUser) -> dict:
    """Debug / integration helper — returns JWT subject and claims."""
    return {"userId": user.user_id, "claims": user.claims}
