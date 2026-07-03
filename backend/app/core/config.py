"""Application settings.

All configuration is read once from the environment (and an optional ``.env``
file) into a single cached ``Settings`` instance. Nothing else in the codebase
should read ``os.environ`` directly — depend on ``get_settings()`` instead.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ directory (two levels up from this file: app/core/config.py).
BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Strongly-typed application settings."""

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Google Gemini
    google_api_key: str = Field(default="", alias="GOOGLE_API_KEY")
    gemini_chat_model: str = Field(default="gemini-2.0-flash", alias="GEMINI_CHAT_MODEL")
    gemini_embedding_model: str = Field(
        default="gemini-embedding-001", alias="GEMINI_EMBEDDING_MODEL"
    )
    gemini_embedding_dimension: int = Field(
        default=768, alias="GEMINI_EMBEDDING_DIMENSION"
    )

    # Clerk / auth
    clerk_secret_key: str = Field(default="", alias="CLERK_SECRET_KEY")
    clerk_jwks_url: str = Field(default="", alias="CLERK_JWKS_URL")
    clerk_issuer: str = Field(default="", alias="CLERK_ISSUER")
    clerk_audience: str = Field(default="", alias="CLERK_AUDIENCE")
    auth_disabled: bool = Field(default=False, alias="AUTH_DISABLED")

    # CORS / frontend
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")

    # Storage (relative paths are resolved against the backend root)
    faiss_index_dir: str = Field(default="faiss_index", alias="FAISS_INDEX_DIR")
    upload_dir: str = Field(default="uploads", alias="UPLOAD_DIR")

    # RAG tuning
    top_k: int = Field(default=5, alias="TOP_K")
    chunk_size: int = Field(default=1000, alias="CHUNK_SIZE")
    chunk_overlap: int = Field(default=150, alias="CHUNK_OVERLAP")
    max_upload_mb: int = Field(default=25, alias="MAX_UPLOAD_MB")

    # App
    app_version: str = Field(default="1.0.0", alias="APP_VERSION")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    @property
    def faiss_index_path(self) -> Path:
        path = Path(self.faiss_index_dir)
        return path if path.is_absolute() else BACKEND_ROOT / path

    @property
    def upload_path(self) -> Path:
        path = Path(self.upload_dir)
        return path if path.is_absolute() else BACKEND_ROOT / path

    @property
    def allowed_origins(self) -> list[str]:
        origins = {self.frontend_url, "http://localhost:3000"}
        return [origin for origin in origins if origin]

    def ensure_dirs(self) -> None:
        """Create storage directories if they do not exist."""
        self.faiss_index_path.mkdir(parents=True, exist_ok=True)
        self.upload_path.mkdir(parents=True, exist_ok=True)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached settings singleton."""
    settings = Settings()
    settings.ensure_dirs()
    return settings
