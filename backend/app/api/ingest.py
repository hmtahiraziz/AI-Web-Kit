"""Document ingestion endpoint."""

from __future__ import annotations

import time

from fastapi import APIRouter, File, UploadFile

from app.core.dependencies import CurrentUser, IngestServiceDep, SettingsDep
from app.core.exceptions import AppError, UnsupportedFileError
from app.core.logger import get_logger
from app.models.responses import IngestResponse
from app.utils.google_errors import map_google_exception

logger = get_logger(__name__)

router = APIRouter(tags=["documents"])


@router.post("/ingest", response_model=IngestResponse)
async def ingest_document(
    user: CurrentUser,
    service: IngestServiceDep,
    settings: SettingsDep,
    file: UploadFile = File(...),
) -> IngestResponse:
    start = time.perf_counter()
    data = await file.read()

    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise UnsupportedFileError(
            f"File exceeds maximum size of {settings.max_upload_mb} MB"
        )

    try:
        record = service.ingest(
            filename=file.filename or "document",
            content_type=file.content_type,
            data=data,
        )
    except AppError:
        raise
    except Exception as exc:
        logger.exception("Ingest failed user=%s filename=%s", user.user_id, file.filename)
        raise map_google_exception(exc) from exc

    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "Ingest user=%s document=%s chunks=%d latency_ms=%.1f",
        user.user_id, record.document_id, record.chunks, elapsed_ms,
    )
    return IngestResponse(document_id=record.document_id, chunks=record.chunks)
