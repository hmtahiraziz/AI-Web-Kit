"""FastAPI application factory.

Wires routers under ``/api``, configures CORS for the Next.js frontend / Ragmob,
and registers centralized exception handlers (401/403/404/422/429/500).
"""

from __future__ import annotations

import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api import account, auth, chat, documents, health, ingest, query
from app.core.config import get_settings
from app.core.dependencies import clear_dependency_caches
from app.core.exceptions import AppError
from app.core.logger import get_logger
from app.models.requests import (
    ChatImageUploadRequest,
    ChatRequest,
    FeedbackRequest,
    RenameConversationRequest,
    ReportRequest,
)
from app.models.responses import (
    ChatImageUploadResponse,
    ConversationDetailResponse,
    ConversationSummaryResponse,
    DeleteAccountResponse,
    DeleteConversationResponse,
    ErrorResponse,
    FeedbackResponse,
    ReportResponse,
)

logger = get_logger(__name__)

API_DESCRIPTION = """
REST API for **SA AI Web Kit** (Next.js RAG) and **Ragmob** (Expo mobile chat).

## Auth
Protected routes expect `Authorization: Bearer <Clerk JWT>` unless
`AUTH_DISABLED=true` (local dev only).

## Ragmob chat (vision)
1. `POST /api/chat/images` — upload image → `{ imageId }`
2. `POST /api/chat/stream` — JSON with `message`, `conversationId`, `imageId`
3. Text follow-ups on the same `conversationId` reuse server image context

See also `docs/ragmob-chat-image-contract.md`.
"""

OPENAPI_TAGS = [
    {"name": "health", "description": "Liveness and dependency status"},
    {"name": "auth", "description": "Clerk JWT helpers"},
    {"name": "account", "description": "Account lifecycle (Ragmob)"},
    {"name": "chat", "description": "Direct OpenAI chat, history, feedback (Ragmob)"},
    {"name": "documents", "description": "Document ingest and registry (RAG)"},
    {"name": "query", "description": "Grounded RAG Q&A"},
]


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="SA AI Web Kit API",
        version=settings.app_version,
        description=API_DESCRIPTION,
        openapi_tags=OPENAPI_TAGS,
        docs_url="/docs",
        redoc_url="/redoc",
        swagger_ui_parameters={"persistAuthorization": True},
    )

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
    _register_openapi(app)

    @app.on_event("startup")
    def _startup() -> None:
        from app.db import init_db

        clear_dependency_caches()
        settings = get_settings()
        settings.ensure_dirs()
        try:
            if init_db():
                logger.info("Neon Postgres connected")
            else:
                logger.warning("DATABASE_URL not set — running without Postgres")
        except Exception:
            logger.exception("Failed to initialize Neon Postgres")
        paths = sorted(app.openapi().get("paths", {}).keys())
        logger.info("SA AI Web Kit API v%s started (%d routes)", settings.app_version, len(paths))
        for path in paths:
            logger.info("  %s", path)

    return app


def _register_routers(app: FastAPI) -> None:
    for module in (health, auth, account, ingest, documents, query, chat):
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
        else:
            logger.warning("AppError %d: %s", exc.status_code, exc.detail)
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


def _schema(model: type) -> dict:
    return model.model_json_schema(mode="serialization", by_alias=True)


def _register_openapi(app: FastAPI) -> None:
    """Enrich Swagger: Bearer auth, shared schemas, chat stream request body."""

    def custom_openapi() -> dict:
        if app.openapi_schema:
            return app.openapi_schema

        schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
            tags=OPENAPI_TAGS,
        )

        components = schema.setdefault("components", {})
        components.setdefault("securitySchemes", {})["BearerAuth"] = {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Clerk session JWT (`Authorization: Bearer <token>`).",
        }

        schemas = components.setdefault("schemas", {})
        for model in (
            ChatRequest,
            ChatImageUploadRequest,
            ChatImageUploadResponse,
            RenameConversationRequest,
            FeedbackRequest,
            ReportRequest,
            ConversationSummaryResponse,
            ConversationDetailResponse,
            DeleteConversationResponse,
            FeedbackResponse,
            ReportResponse,
            DeleteAccountResponse,
            ErrorResponse,
        ):
            schemas[model.__name__] = _schema(model)

        # Document JSON + multipart for /chat/stream (runtime uses Request.body).
        stream_path = schema.get("paths", {}).get("/api/chat/stream", {}).get("post")
        if stream_path is not None:
            stream_path["requestBody"] = {
                "required": True,
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/ChatRequest"},
                        "examples": {
                            "textOnly": {
                                "summary": "Text-only chat",
                                "value": {
                                    "message": "Explain recursion briefly",
                                    "mode": "general",
                                    "conversationId": "conv_123",
                                    "userMessageId": "msg_u1",
                                    "assistantMessageId": "msg_a1",
                                },
                            },
                            "withImageId": {
                                "summary": "Vision after POST /chat/images",
                                "value": {
                                    "message": "What is in this photo?",
                                    "mode": "general",
                                    "conversationId": "conv_123",
                                    "imageId": "a1b2c3d4e5f6",
                                },
                            },
                        },
                    },
                    "multipart/form-data": {
                        "schema": {
                            "type": "object",
                            "required": ["message"],
                            "properties": {
                                "message": {"type": "string", "maxLength": 4000},
                                "mode": {"type": "string", "maxLength": 32},
                                "systemPrompt": {"type": "string"},
                                "conversationId": {"type": "string"},
                                "userMessageId": {"type": "string"},
                                "assistantMessageId": {"type": "string"},
                                "imageReuse": {
                                    "type": "boolean",
                                    "description": "Refresh image context without marking a new upload",
                                },
                                "image": {
                                    "type": "string",
                                    "format": "binary",
                                    "description": "JPEG, PNG, or WebP",
                                },
                            },
                        }
                    },
                },
            }

        images_path = schema.get("paths", {}).get("/api/chat/images", {}).get("post")
        if images_path is not None:
            images_path["requestBody"] = {
                "required": True,
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/ChatImageUploadRequest"},
                        "examples": {
                            "base64": {
                                "summary": "JSON base64 upload (Ragmob)",
                                "value": {
                                    "imageBase64": "<standard-base64>",
                                    "imageMime": "image/jpeg",
                                    "conversationId": "conv_123",
                                },
                            }
                        },
                    },
                    "multipart/form-data": {
                        "schema": {
                            "type": "object",
                            "required": ["image"],
                            "properties": {
                                "image": {"type": "string", "format": "binary"},
                                "conversationId": {"type": "string"},
                            },
                        }
                    },
                },
            }

        # Default security for all operations; health stays public in practice.
        schema["security"] = [{"BearerAuth": []}]
        health_get = schema.get("paths", {}).get("/api/health", {}).get("get")
        if health_get is not None:
            health_get["security"] = []

        app.openapi_schema = schema
        return app.openapi_schema

    app.openapi = custom_openapi  # type: ignore[method-assign]
