"""FastAPI application factory.

Wires routers under ``/api``, configures CORS for the Next.js frontend, and
registers centralized exception handlers (401/403/404/422/429/500).
"""

from __future__ import annotations

import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api import auth, chat, documents, health, ingest, query
from app.core.config import get_settings
from app.core.dependencies import clear_dependency_caches
from app.core.exceptions import AppError
from app.core.logger import get_logger

logger = get_logger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="SA AI Web Kit API", version=settings.app_version)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    _register_routers(app)
    _register_exception_handlers(app)
    _register_timing_middleware(app)

    @app.on_event("startup")
    def _startup() -> None:
        clear_dependency_caches()
        settings = get_settings()
        settings.ensure_dirs()
        paths = sorted(app.openapi().get("paths", {}).keys())
        logger.info("SA AI Web Kit API v%s started (%d routes)", settings.app_version, len(paths))
        for path in paths:
            logger.info("  %s", path)

    return app


def _register_routers(app: FastAPI) -> None:
    for module in (health, auth, ingest, documents, query, chat):
        app.include_router(module.router, prefix="/api")


def _register_timing_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def _timing(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Process-Time-ms"] = f"{elapsed_ms:.1f}"
        if request.url.path.startswith("/api"):
            logger.info(
                "%s %s -> %d (%.1f ms)",
                request.method, request.url.path, response.status_code, elapsed_ms,
            )
        return response


def _register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        if exc.status_code >= 500:
            logger.error("AppError %d: %s", exc.status_code, exc.detail)
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={"detail": "Validation error", "errors": exc.errors()},
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code, content={"detail": exc.detail}
        )

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=500, content={"detail": "Internal server error"}
        )
