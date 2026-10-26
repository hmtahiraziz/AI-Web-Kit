"""Conversation-scoped image context for vision follow-ups.

Strategy
--------
1. **Key** — ``user_id:conversation_id``. Follow-ups must send the same
   ``conversationId`` as the turn that uploaded the image.
2. **Hot path** — in-memory map for fast reuse within the process.
3. **Durable path** — mirror bytes + metadata under a temp directory so a
   single-worker reload (or brief restart) still serves follow-ups within TTL.
4. **Sliding TTL** — successful ``get`` refreshes expiry so an active Q&A
   thread does not lose the image mid-conversation.
5. **Postgres** — never stores image bytes; only a ``[Image]`` text marker on
   the user message for history UI.

Retention defaults to ``CHAT_IMAGE_CONTEXT_TTL_SECONDS`` (1 hour). Cleared when
the conversation is deleted.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import tempfile
import threading
import time
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class CachedChatImage:
    data: bytes
    mime_type: str
    width: int
    height: int
    created_at: float
    expires_at: float


def _default_dir() -> Path:
    override = (os.environ.get("CHAT_IMAGE_CONTEXT_DIR") or "").strip()
    if override:
        return Path(override)
    return Path(tempfile.gettempdir()) / "ragmob_chat_image_context"


class ImageContextCache:
    def __init__(
        self,
        *,
        ttl_seconds: int = 3600,
        max_entries: int = 256,
        storage_dir: Path | None = None,
    ) -> None:
        self._ttl = max(60, ttl_seconds)
        self._max_entries = max(8, max_entries)
        self._lock = threading.Lock()
        self._items: dict[str, CachedChatImage] = {}
        self._dir = storage_dir or _default_dir()
        try:
            self._dir.mkdir(parents=True, exist_ok=True)
        except OSError:
            logger.warning("Image context dir unavailable: %s", self._dir)

    @staticmethod
    def key(user_id: str, conversation_id: str) -> str:
        return f"{user_id}:{conversation_id}"

    def _paths(self, key: str) -> tuple[Path, Path]:
        digest = hashlib.sha256(key.encode("utf-8")).hexdigest()[:40]
        base = self._dir / digest
        return base.with_suffix(".bin"), base.with_suffix(".meta.json")

    def put(
        self,
        user_id: str,
        conversation_id: str,
        *,
        data: bytes,
        mime_type: str,
        width: int,
        height: int,
    ) -> None:
        if not conversation_id:
            logger.warning(
                "Skipping image context put — conversation_id missing (user=%s)",
                user_id,
            )
            return
        now = time.monotonic()
        entry = CachedChatImage(
            data=data,
            mime_type=mime_type,
            width=width,
            height=height,
            created_at=now,
            expires_at=now + self._ttl,
        )
        k = self.key(user_id, conversation_id)
        with self._lock:
            self._purge_locked()
            self._items[k] = entry
            self._write_disk_locked(k, entry)
            self._evict_overflow_locked()
        logger.info(
            "Image context stored user=%s conversation=%s bytes=%d ttl=%ds",
            user_id,
            conversation_id,
            len(data),
            self._ttl,
        )

    def get(self, user_id: str, conversation_id: str) -> CachedChatImage | None:
        if not conversation_id:
            return None
        k = self.key(user_id, conversation_id)
        with self._lock:
            self._purge_locked()
            entry = self._items.get(k)
            if entry is None:
                entry = self._read_disk_locked(k)
                if entry is not None:
                    self._items[k] = entry
            if entry is None:
                return None
            # Sliding TTL — keep active follow-up threads warm.
            refreshed = CachedChatImage(
                data=entry.data,
                mime_type=entry.mime_type,
                width=entry.width,
                height=entry.height,
                created_at=entry.created_at,
                expires_at=time.monotonic() + self._ttl,
            )
            self._items[k] = refreshed
            self._write_disk_locked(k, refreshed)
            return refreshed

    def clear(self, user_id: str, conversation_id: str) -> None:
        k = self.key(user_id, conversation_id)
        with self._lock:
            self._items.pop(k, None)
            self._delete_disk_locked(k)

    # ---- Pending uploads (POST /chat/images → imageId) ----

    @staticmethod
    def pending_conversation_id(image_id: str) -> str:
        """Namespace pending uploads away from real conversation ids."""
        return f"__pending__:{image_id}"

    def put_pending(
        self,
        user_id: str,
        image_id: str,
        *,
        data: bytes,
        mime_type: str,
        width: int,
        height: int,
    ) -> None:
        self.put(
            user_id,
            self.pending_conversation_id(image_id),
            data=data,
            mime_type=mime_type,
            width=width,
            height=height,
        )

    def get_pending(self, user_id: str, image_id: str) -> CachedChatImage | None:
        return self.get(user_id, self.pending_conversation_id(image_id))

    def bind_pending_to_conversation(
        self,
        user_id: str,
        image_id: str,
        conversation_id: str,
    ) -> CachedChatImage | None:
        """Copy a pending upload into the conversation image context."""
        entry = self.get_pending(user_id, image_id)
        if entry is None or not conversation_id:
            return entry
        self.put(
            user_id,
            conversation_id,
            data=entry.data,
            mime_type=entry.mime_type,
            width=entry.width,
            height=entry.height,
        )
        return entry

    def _purge_locked(self) -> None:
        now = time.monotonic()
        expired = [
            key
            for key, value in self._items.items()
            if now >= value.expires_at
        ]
        for key in expired:
            del self._items[key]
            self._delete_disk_locked(key)

    def _evict_overflow_locked(self) -> None:
        if len(self._items) <= self._max_entries:
            return
        ordered = sorted(self._items.items(), key=lambda item: item[1].expires_at)
        overflow = len(self._items) - self._max_entries
        for key, _ in ordered[:overflow]:
            del self._items[key]
            self._delete_disk_locked(key)

    def _write_disk_locked(self, key: str, entry: CachedChatImage) -> None:
        bin_path, meta_path = self._paths(key)
        try:
            self._dir.mkdir(parents=True, exist_ok=True)
            tmp_bin = bin_path.with_suffix(".bin.tmp")
            tmp_bin.write_bytes(entry.data)
            tmp_bin.replace(bin_path)
            # Persist wall-clock expiry so restarts can still enforce TTL.
            wall_ttl_left = max(1.0, entry.expires_at - time.monotonic())
            meta = {
                "key": key,
                "mime_type": entry.mime_type,
                "width": entry.width,
                "height": entry.height,
                "expires_wall": time.time() + wall_ttl_left,
                "byte_length": len(entry.data),
            }
            tmp_meta = meta_path.with_suffix(".meta.json.tmp")
            tmp_meta.write_text(json.dumps(meta), encoding="utf-8")
            tmp_meta.replace(meta_path)
        except OSError as exc:
            logger.warning("Failed to persist image context for %s: %s", key, exc)

    def _read_disk_locked(self, key: str) -> CachedChatImage | None:
        bin_path, meta_path = self._paths(key)
        try:
            if not bin_path.is_file() or not meta_path.is_file():
                return None
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            expires_wall = float(meta.get("expires_wall") or 0)
            if time.time() >= expires_wall:
                self._delete_disk_locked(key)
                return None
            data = bin_path.read_bytes()
            if not data:
                self._delete_disk_locked(key)
                return None
            ttl_left = max(1.0, expires_wall - time.time())
            now = time.monotonic()
            return CachedChatImage(
                data=data,
                mime_type=str(meta.get("mime_type") or "image/jpeg"),
                width=int(meta.get("width") or 0),
                height=int(meta.get("height") or 0),
                created_at=now,
                expires_at=now + ttl_left,
            )
        except (OSError, ValueError, TypeError, json.JSONDecodeError) as exc:
            logger.warning("Failed to load image context for %s: %s", key, exc)
            self._delete_disk_locked(key)
            return None

    def _delete_disk_locked(self, key: str) -> None:
        bin_path, meta_path = self._paths(key)
        for path in (bin_path, meta_path):
            try:
                path.unlink(missing_ok=True)
            except OSError:
                pass


_cache: ImageContextCache | None = None
_cache_lock = threading.Lock()


def get_image_context_cache(ttl_seconds: int = 3600) -> ImageContextCache:
    """Process-wide singleton (TTL applied on first create)."""
    global _cache
    with _cache_lock:
        if _cache is None:
            _cache = ImageContextCache(ttl_seconds=ttl_seconds)
        return _cache


def reset_image_context_cache() -> None:
    """Test helper — drop the singleton."""
    global _cache
    with _cache_lock:
        _cache = None
