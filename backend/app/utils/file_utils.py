"""Filesystem helpers for uploaded documents."""

from __future__ import annotations

import re
import unicodedata
from pathlib import Path

from app.core.exceptions import UnsupportedFileError

ALLOWED_EXTENSIONS: set[str] = {".pdf", ".txt", ".md", ".markdown"}

_SAFE_NAME_RE = re.compile(r"[^A-Za-z0-9._-]+")


def get_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def validate_extension(filename: str) -> str:
    """Return the lowercase extension or raise if unsupported."""
    ext = get_extension(filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise UnsupportedFileError(
            f"Unsupported file type '{ext or 'unknown'}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    return ext


def safe_filename(filename: str) -> str:
    """Produce a filesystem-safe version of an arbitrary filename."""
    name = unicodedata.normalize("NFKD", filename).encode("ascii", "ignore").decode()
    name = _SAFE_NAME_RE.sub("_", name).strip("._")
    return name or "document"


def stored_filename(document_id: str, original: str) -> str:
    """Disk filename combining the document id and a safe original name."""
    return f"{document_id}__{safe_filename(original)}"


def save_bytes(directory: Path, filename: str, data: bytes) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / filename
    path.write_bytes(data)
    return path


def delete_file(path: Path) -> bool:
    try:
        path.unlink()
        return True
    except FileNotFoundError:
        return False
