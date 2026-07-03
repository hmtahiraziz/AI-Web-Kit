"""Text helpers used during ingestion."""

from __future__ import annotations

import re

_WHITESPACE_RE = re.compile(r"[ \t]+")
_MULTI_NEWLINE_RE = re.compile(r"\n{3,}")
_MD_HEADING_RE = re.compile(r"^\s{0,3}(#{1,6})\s+(.*\S)\s*$")


def normalize_whitespace(text: str) -> str:
    """Collapse runs of spaces/tabs and excessive blank lines."""
    text = _WHITESPACE_RE.sub(" ", text)
    text = _MULTI_NEWLINE_RE.sub("\n\n", text)
    return text.strip()


def detect_section(text: str) -> str | None:
    """Best-effort section title from the first markdown heading or first line.

    Used to populate the ``section`` field of chunk metadata so citations can
    point at a meaningful location within a document.
    """
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        heading = _MD_HEADING_RE.match(raw_line)
        if heading:
            return heading.group(2).strip()
        # Treat a short, title-like first line as a section heading.
        if len(line) <= 80 and not line.endswith(('.', ',', ';', ':')):
            return line
        return None
    return None
