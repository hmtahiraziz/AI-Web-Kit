"""Validate chat image uploads for vision requests.

Images are processed in memory and are not permanently stored.
Do not log raw image bytes.
"""

from __future__ import annotations

import io
from dataclasses import dataclass

from PIL import Image, UnidentifiedImageError

from app.core.exceptions import PayloadTooLargeError, UnsupportedFileError

ALLOWED_IMAGE_MIME: set[str] = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}

# Normalize aliases Gemini / clients may send.
_MIME_NORMALIZE: dict[str, str] = {
    "image/jpg": "image/jpeg",
}

_FORMAT_TO_MIME: dict[str, str] = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
}


@dataclass(frozen=True, slots=True)
class ValidatedImage:
    """Validated image bytes ready for the vision model."""

    data: bytes
    mime_type: str
    width: int
    height: int
    byte_length: int


def normalize_image_mime(mime: str | None) -> str | None:
    if not mime:
        return None
    cleaned = mime.split(";", 1)[0].strip().lower()
    if not cleaned:
        return None
    return _MIME_NORMALIZE.get(cleaned, cleaned)


def validate_chat_image(
    data: bytes,
    *,
    declared_mime: str | None,
    max_bytes: int,
    max_dimension: int,
) -> ValidatedImage:
    """Validate MIME, size, and dimensions for a chat vision upload."""
    if not data:
        raise UnsupportedFileError("Image file is empty.")

    if len(data) > max_bytes:
        mb = max(1, int(max_bytes / (1024 * 1024)))
        raise PayloadTooLargeError(
            f"Image exceeds maximum size of {mb} MB. Try a smaller photo."
        )

    declared = normalize_image_mime(declared_mime)
    if declared and declared not in ALLOWED_IMAGE_MIME:
        raise UnsupportedFileError(
            "Unsupported image type. Use JPEG, PNG, or WebP."
        )

    try:
        with Image.open(io.BytesIO(data)) as img:
            img.verify()
        with Image.open(io.BytesIO(data)) as img:
            width, height = img.size
            fmt = (img.format or "").upper()
    except UnidentifiedImageError as exc:
        raise UnsupportedFileError(
            "Could not read that image. Use a valid JPEG, PNG, or WebP file."
        ) from exc
    except OSError as exc:
        raise UnsupportedFileError(
            "Could not read that image. The file may be corrupted."
        ) from exc

    detected = _FORMAT_TO_MIME.get(fmt)
    if detected is None:
        raise UnsupportedFileError(
            "Unsupported image type. Use JPEG, PNG, or WebP."
        )

    if declared and normalize_image_mime(declared) not in {detected, "image/jpg"}:
        # Allow jpeg/jpg alias mismatch; otherwise require agreement.
        if not (
            detected == "image/jpeg"
            and normalize_image_mime(declared) == "image/jpeg"
        ):
            raise UnsupportedFileError(
                "Image content does not match the declared file type."
            )

    if width <= 0 or height <= 0:
        raise UnsupportedFileError("Image has invalid dimensions.")

    if width > max_dimension or height > max_dimension:
        raise UnsupportedFileError(
            f"Image dimensions exceed {max_dimension}px. "
            "Resize the image and try again."
        )

    return ValidatedImage(
        data=data,
        mime_type=detected,
        width=width,
        height=height,
        byte_length=len(data),
    )
