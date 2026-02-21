from __future__ import annotations

import os
from typing import Any

from openai import OpenAI

from openaip_pipeline.core.errors import ConfigurationError


def build_openai_client(api_key: str | None = None) -> OpenAI:
    resolved = (api_key or os.getenv("OPENAI_API_KEY", "")).strip()
    if not resolved:
        raise ConfigurationError("OPENAI_API_KEY not found.")
    return OpenAI(api_key=resolved)


def safe_usage_dict(response: Any) -> dict[str, int | None]:
    usage = getattr(response, "usage", None)
    if not usage:
        return {"input_tokens": None, "output_tokens": None, "total_tokens": None}

    def pick(*names: str) -> int | None:
        for name in names:
            if hasattr(usage, name):
                value = getattr(usage, name)
                if isinstance(value, int):
                    return value
        return None

    return {
        "input_tokens": pick("input_tokens", "prompt_tokens"),
        "output_tokens": pick("output_tokens", "completion_tokens"),
        "total_tokens": pick("total_tokens"),
    }

