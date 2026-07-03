"""Auth helper endpoint — echoes the verified Clerk user (debugging/integration)."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.dependencies import CurrentUser

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
def me(user: CurrentUser) -> dict:
    return {"userId": user.user_id, "claims": user.claims}
