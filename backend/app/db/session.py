"""SQLAlchemy engine / session helpers for Neon Postgres."""

from __future__ import annotations

from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.core.logger import get_logger

logger = get_logger(__name__)


def _to_sqlalchemy_url(url: str) -> str:
    """Neon gives ``postgresql://…``; SQLAlchemy + psycopg3 wants ``postgresql+psycopg://``."""
    if url.startswith("postgresql+psycopg://"):
        return url
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    return url


@lru_cache(maxsize=1)
def get_engine() -> Engine | None:
    settings = get_settings()
    if not settings.database_url.strip():
        logger.warning("DATABASE_URL is empty — Postgres features disabled")
        return None
    url = _to_sqlalchemy_url(settings.database_url.strip())
    # Neon pooler: keep connections short-lived; pre-ping detects dropped sockets.
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
        pool_recycle=300,
    )


def get_session_factory() -> sessionmaker[Session] | None:
    engine = get_engine()
    if engine is None:
        return None
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency — yields a request-scoped session when DB is configured."""
    factory = get_session_factory()
    if factory is None:
        raise RuntimeError("DATABASE_URL is not configured")
    session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db() -> bool:
    """Create tables if DATABASE_URL is set. Returns True when DB is ready."""
    from app.db.models import Base  # local import avoids circulars at module load

    engine = get_engine()
    if engine is None:
        return False
    Base.metadata.create_all(bind=engine)
    logger.info("Neon Postgres schema ready")
    return True


def check_database() -> dict[str, str]:
    """Return ``{status, detail}`` for health checks."""
    engine = get_engine()
    if engine is None:
        return {"status": "unconfigured", "detail": "DATABASE_URL not set"}
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "detail": "connected"}
    except Exception as exc:  # noqa: BLE001 — surface any driver/network failure
        logger.error("Database health check failed: %s", exc)
        return {"status": "error", "detail": str(exc)}


def clear_db_caches() -> None:
    get_engine.cache_clear()
