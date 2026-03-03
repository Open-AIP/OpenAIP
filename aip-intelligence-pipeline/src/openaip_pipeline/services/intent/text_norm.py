from __future__ import annotations

import re

_WHITESPACE_PATTERN = re.compile(r"\s+")


def normalize_text(text: str | None, max_chars: int = 384) -> str:
    value = "" if text is None else str(text)
    normalized = _WHITESPACE_PATTERN.sub(" ", value.lower().strip())
    if max_chars < 0:
        max_chars = 0
    return normalized[:max_chars]


def is_effectively_empty(text: str | None) -> bool:
    return normalize_text(text) == ""
