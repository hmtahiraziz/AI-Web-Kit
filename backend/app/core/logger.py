"""Centralized logging configuration.

Use ``get_logger(__name__)`` anywhere a logger is needed. The root handler is
configured exactly once, on first use, at the level from ``Settings``.
"""

from __future__ import annotations

import logging
import sys

from app.core.config import get_settings

_CONFIGURED = False
_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"


def _configure_root() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return

    settings = get_settings()
    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(_LOG_FORMAT))

    root = logging.getLogger()
    root.setLevel(level)
    # Avoid duplicate handlers when uvicorn reloads modules.
    if not any(isinstance(h, logging.StreamHandler) for h in root.handlers):
        root.addHandler(handler)

    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Return a configured logger for ``name``."""
    _configure_root()
    return logging.getLogger(name)
