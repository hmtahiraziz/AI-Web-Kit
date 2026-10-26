"""Account lifecycle — wipe server-side user data (Ragmob)."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.dependencies import CurrentUser
from app.core.exceptions import NotFoundError
from app.core.logger import get_logger
from app.db import feedback_repo, get_session_factory
from app.models.responses import DeleteAccountResponse

logger = get_logger(__name__)

router = APIRouter(tags=["account"])


@router.delete(
    "/me",
    summary="Delete the signed-in user's server data",
    response_model=DeleteAccountResponse,
    responses={
        401: {"description": "Missing or invalid Clerk JWT"},
        404: {"description": "Database not configured"},
    },
)
def delete_account(user: CurrentUser) -> dict:
    """Delete chats, feedback, and reports for the authenticated user.

    Clerk user deletion is handled client-side after this succeeds.
    """
    factory = get_session_factory()
    if factory is None:
        raise NotFoundError("Database not configured")
    session = factory()
    try:
        counts = feedback_repo.delete_user_data(session, user.user_id)
        logger.info("Account data wiped user=%s counts=%s", user.user_id, counts)
        return {"success": True, "deleted": counts}
    finally:
        session.close()
