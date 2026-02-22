from __future__ import annotations

import json
import time
from typing import Any

from openai import OpenAI

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
    if "projects" not in validated_obj or not isinstance(validated_obj["projects"], list):
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
    summary_obj = {"summary": summary_text}
    return SummarizationResult(
        summary_text=summary_text,
        summary_obj=summary_obj,
        summary_json_str=json.dumps(summary_obj, ensure_ascii=False, indent=2),
        usage=safe_usage_dict(response),
        elapsed_seconds=elapsed,
        model=model,
    )


def attach_summary_to_validated_json_str(validated_json_str: str, summary_text: str) -> str:
    parsed = json.loads(validated_json_str)
    return json.dumps({"projects": parsed.get("projects", []), "summary": summary_text}, ensure_ascii=False, indent=2)

