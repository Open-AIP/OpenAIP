from __future__ import annotations

import json
from typing import Any

from openaip_pipeline.adapters.supabase.client import SupabaseRestClient


def persist_json_payload(
    *,
    client: SupabaseRestClient,
    bucket_id: str,
    object_prefix: str,
    payload: dict[str, Any],
    inline_max_bytes: int,
) -> tuple[dict[str, Any] | None, str | None]:
    encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    if len(encoded) <= inline_max_bytes:
        return payload, None
    object_name = f"{object_prefix}.json"
    storage_path = client.upload_bytes(
        bucket_id=bucket_id,
        object_name=object_name,
        content=encoded,
        content_type="application/json",
    )
    return None, storage_path

