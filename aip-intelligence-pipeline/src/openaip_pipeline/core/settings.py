from __future__ import annotations

import os
from dataclasses import dataclass

from openaip_pipeline.core.errors import ConfigurationError


def _required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ConfigurationError(f"{name} is not set.")
    return value


def _optional(name: str, default: str) -> str:
    value = os.getenv(name, "").strip()
    return value if value else default


def _optional_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _optional_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        parsed = int(value)
    except ValueError:
        return default
    return parsed


@dataclass(frozen=True)
class Settings:
    openai_api_key: str
    supabase_url: str
    supabase_service_key: str
    supabase_storage_artifact_bucket: str
    pipeline_model: str
    embedding_model: str
    batch_size: int
    worker_poll_seconds: float
    worker_run_once: bool
    artifact_inline_max_bytes: int
    enable_rag: bool
    dev_routes: bool

    @classmethod
    def load(cls, *, require_supabase: bool = True, require_openai: bool = True) -> "Settings":
        openai_key = _required("OPENAI_API_KEY") if require_openai else _optional("OPENAI_API_KEY", "")
        supabase_url = _required("SUPABASE_URL") if require_supabase else _optional("SUPABASE_URL", "")
        supabase_key = _required("SUPABASE_SERVICE_KEY") if require_supabase else _optional("SUPABASE_SERVICE_KEY", "")
        poll_raw = _optional("PIPELINE_WORKER_POLL_SECONDS", "3")
        try:
            poll_seconds = float(poll_raw)
        except ValueError:
            poll_seconds = 3.0
        return cls(
            openai_api_key=openai_key,
            supabase_url=supabase_url.rstrip("/"),
            supabase_service_key=supabase_key,
            supabase_storage_artifact_bucket=_optional("SUPABASE_STORAGE_ARTIFACT_BUCKET", "aip-artifacts"),
            pipeline_model=_optional("PIPELINE_MODEL", "gpt-5.2"),
            embedding_model=_optional("PIPELINE_EMBEDDING_MODEL", "text-embedding-3-large"),
            batch_size=max(1, _optional_int("PIPELINE_BATCH_SIZE", 25)),
            worker_poll_seconds=max(1.0, poll_seconds),
            worker_run_once=_optional_bool("PIPELINE_WORKER_RUN_ONCE", False),
            artifact_inline_max_bytes=max(1024, _optional_int("PIPELINE_ARTIFACT_INLINE_MAX_BYTES", 32768)),
            enable_rag=_optional_bool("PIPELINE_ENABLE_RAG", False),
            dev_routes=_optional_bool("PIPELINE_DEV_ROUTES", False),
        )

