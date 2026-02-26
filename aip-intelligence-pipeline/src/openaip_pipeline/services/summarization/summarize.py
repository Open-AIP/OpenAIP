from __future__ import annotations

import json
import time
from typing import Any

from openai import OpenAI

from openaip_pipeline.core.artifact_contract import (
    SCHEMA_VERSION,
    collect_summary_evidence,
    make_stage_root,
)
from openaip_pipeline.core.clock import now_utc_iso
from openaip_pipeline.core.resources import read_text
from openaip_pipeline.services.openai_utils import build_openai_client, safe_usage_dict


class SummarizationResult:
    def __init__(
        self,
        summary_text: str,
        summary_obj: dict[str, Any],
        summary_json_str: str,
        usage: dict[str, Any],
        elapsed_seconds: float,
        model: str,
    ):
        self.summary_text = summary_text
        self.summary_obj = summary_obj
        self.summary_json_str = summary_json_str
        self.usage = usage
        self.elapsed_seconds = elapsed_seconds
        self.model = model


def _fallback_document() -> dict[str, Any]:
    year = int(now_utc_iso()[:4])
    return {
        "lgu": {"name": "Unknown LGU", "type": "unknown"},
        "fiscal_year": year,
        "source": {"document_type": "unknown", "page_count": None},
    }


def summarize_aip_overall_json_str(
    validated_json_str: str,
    model: str = "gpt-5.2",
    heartbeat_seconds: float = 5.0,
    client: OpenAI | None = None,
) -> SummarizationResult:
    try:
        validated_obj = json.loads(validated_json_str)
    except json.JSONDecodeError as error:
        raise ValueError(f"Input is not valid JSON string: {error}") from error
    projects = validated_obj.get("projects")
    if not isinstance(projects, list):
        raise ValueError("Input JSON must contain top-level 'projects' array.")

    start_ts = time.perf_counter()
    last_beat = start_ts

    def beat(msg: str) -> None:
        nonlocal last_beat
        now = time.perf_counter()
        if now - last_beat >= heartbeat_seconds:
            print(f"[SUMMARY] {msg} | elapsed={now - start_ts:.1f}s", flush=True)
            last_beat = now

    resolved_client = client or build_openai_client()
    system_prompt = read_text("prompts/summarization/system.txt")

    beat("Preparing request")
    response = resolved_client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(validated_obj, ensure_ascii=False)},
        ],
        text={"format": {"type": "json_object"}},
    )
    beat("Response received")
    elapsed = round(time.perf_counter() - start_ts, 4)
    output_obj = json.loads(response.output_text)
    summary_text = str(output_obj.get("summary") or "").strip()
    summary_refs, evidence_keys = collect_summary_evidence(projects, summary_text=summary_text)
    summary_block = {
        "text": summary_text or "No summary generated.",
        "source_refs": summary_refs,
        "evidence_project_keys": evidence_keys or None,
    }
    summary_artifact = make_stage_root(
        stage="summarize",
        aip_id=str(validated_obj.get("aip_id") or "unknown-aip"),
        uploaded_file_id=str(validated_obj.get("uploaded_file_id")) if validated_obj.get("uploaded_file_id") else None,
        document=validated_obj.get("document") if isinstance(validated_obj.get("document"), dict) else _fallback_document(),
        projects=projects,
        totals=validated_obj.get("totals") if isinstance(validated_obj.get("totals"), list) else [],
        summary=summary_block,
        warnings=validated_obj.get("warnings") if isinstance(validated_obj.get("warnings"), list) else [],
        quality=validated_obj.get("quality") if isinstance(validated_obj.get("quality"), dict) else None,
        generated_at=now_utc_iso(),
        schema_version=str(validated_obj.get("schema_version") or SCHEMA_VERSION),
    )
    return SummarizationResult(
        summary_text=summary_block["text"],
        summary_obj=summary_artifact,
        summary_json_str=json.dumps(summary_artifact, ensure_ascii=False, indent=2),
        usage=safe_usage_dict(response),
        elapsed_seconds=elapsed,
        model=model,
    )


def attach_summary_to_validated_json_str(validated_json_str: str, summary_text: str) -> str:
    parsed = json.loads(validated_json_str)
    projects = parsed.get("projects") if isinstance(parsed.get("projects"), list) else []
    refs, evidence_keys = collect_summary_evidence(projects, summary_text=summary_text)
    summary_block = {
        "text": summary_text.strip() or "No summary generated.",
        "source_refs": refs,
        "evidence_project_keys": evidence_keys or None,
    }
    merged = make_stage_root(
        stage="summarize",
        aip_id=str(parsed.get("aip_id") or "unknown-aip"),
        uploaded_file_id=str(parsed.get("uploaded_file_id")) if parsed.get("uploaded_file_id") else None,
        document=parsed.get("document") if isinstance(parsed.get("document"), dict) else _fallback_document(),
        projects=projects,
        totals=parsed.get("totals") if isinstance(parsed.get("totals"), list) else [],
        summary=summary_block,
        warnings=parsed.get("warnings") if isinstance(parsed.get("warnings"), list) else [],
        quality=parsed.get("quality") if isinstance(parsed.get("quality"), dict) else None,
        generated_at=now_utc_iso(),
        schema_version=str(parsed.get("schema_version") or SCHEMA_VERSION),
    )
    return json.dumps(merged, ensure_ascii=False, indent=2)
