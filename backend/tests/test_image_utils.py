"""Unit tests for chat image validation and ephemeral context cache."""

from __future__ import annotations

from io import BytesIO

import pytest
from PIL import Image

from app.core.exceptions import PayloadTooLargeError, UnsupportedFileError
from app.services.image_context_cache import ImageContextCache
from app.utils.image_utils import validate_chat_image


def _jpeg_bytes(width: int = 64, height: int = 48) -> bytes:
    buf = BytesIO()
    Image.new("RGB", (width, height), color=(10, 20, 30)).save(buf, format="JPEG")
    return buf.getvalue()


def test_validate_jpeg_ok() -> None:
    data = _jpeg_bytes()
    result = validate_chat_image(
        data,
        declared_mime="image/jpeg",
        max_bytes=1_000_000,
        max_dimension=4096,
    )
    assert result.mime_type == "image/jpeg"
    assert result.width == 64
    assert result.height == 48


def test_reject_mime_mismatch() -> None:
    with pytest.raises(UnsupportedFileError):
        validate_chat_image(
            _jpeg_bytes(),
            declared_mime="image/png",
            max_bytes=1_000_000,
            max_dimension=4096,
        )


def test_reject_oversized() -> None:
    with pytest.raises(PayloadTooLargeError):
        validate_chat_image(
            _jpeg_bytes(),
            declared_mime="image/jpeg",
            max_bytes=10,
            max_dimension=4096,
        )


def test_reject_huge_dimensions() -> None:
    with pytest.raises(UnsupportedFileError):
        validate_chat_image(
            _jpeg_bytes(800, 600),
            declared_mime="image/jpeg",
            max_bytes=5_000_000,
            max_dimension=100,
        )


def test_image_context_cache_roundtrip(tmp_path) -> None:
    cache = ImageContextCache(ttl_seconds=60, storage_dir=tmp_path)
    cache.put("u1", "c1", data=b"abc", mime_type="image/jpeg", width=1, height=1)
    hit = cache.get("u1", "c1")
    assert hit is not None
    assert hit.data == b"abc"
    cache.clear("u1", "c1")
    assert cache.get("u1", "c1") is None


def test_image_context_cache_disk_reload(tmp_path) -> None:
    """Follow-ups survive process restart via disk mirror within TTL."""
    cache_a = ImageContextCache(ttl_seconds=3600, storage_dir=tmp_path)
    cache_a.put("u1", "c1", data=b"photo-bytes", mime_type="image/jpeg", width=2, height=2)

    cache_b = ImageContextCache(ttl_seconds=3600, storage_dir=tmp_path)
    hit = cache_b.get("u1", "c1")
    assert hit is not None
    assert hit.data == b"photo-bytes"
    assert hit.mime_type == "image/jpeg"


def test_image_context_cache_sliding_ttl(tmp_path) -> None:
    cache = ImageContextCache(ttl_seconds=60, storage_dir=tmp_path)
    cache.put("u1", "c1", data=b"x", mime_type="image/jpeg", width=1, height=1)
    first = cache.get("u1", "c1")
    assert first is not None
    second = cache.get("u1", "c1")
    assert second is not None
    assert second.expires_at >= first.expires_at
