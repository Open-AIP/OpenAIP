from __future__ import annotations

import json
import time
from typing import Any, Callable

from openai import OpenAI

from openaip_pipeline.core.resources import read_text
from openaip_pipeline.services.openai_utils import build_openai_client, safe_usage_dict


def _split_into_n_chunks(items: list[Any], n: int) -> list[list[Any]]:
    if n <= 0:
        raise ValueError("n must be >= 1")
    total = len(items)
    if total == 0:
        return [[] for _ in range(n)]
    base = total // n
    rem = total % n
    chunks: list[list[Any]] = []
    start = 0
    for index in range(n):
        size = base + (1 if index < rem else 0)
        chunks.append(items[start : start + size])
        start += size
    return chunks


class ValidationResult:
    def __init__(
        self,
        validated_obj: dict[str, Any],
        validated_json_str: str,
        usage: dict[str, Any],
        elapsed_seconds: float,
        model: str,
        chunk_usages: list[dict[str, Any]] | None = None,
        chunk_elapsed_seconds: list[float] | None = None,
    ):
        self.validated_obj = validated_obj
        self.validated_json_str = validated_json_str
        self.usage = usage
        self.elapsed_seconds = elapsed_seconds
        self.model = model
        self.chunk_usages = chunk_usages or []
        self.chunk_elapsed_seconds = chunk_elapsed_seconds or []


def _sum_usage(usages: list[dict[str, Any]]) -> dict[str, Any]:
    def s(key: str) -> int | None:
        vals = [u.get(key) for u in usages if isinstance(u.get(key), int)]
        return sum(vals) if vals else None

    return {"input_tokens": s("input_tokens"), "output_tokens": s("output_tokens"), "total_tokens": s("total_tokens")}


def validate_projects_json_str(
    extraction_json_str: str,
    model: str = "gpt-5.2",
    num_batches: int = 4,
    on_progress: Callable[[int, int, int, int, str], None] | None = None,
    client: OpenAI | None = None,
) -> ValidationResult:
    try:
        extraction_obj = json.loads(extraction_json_str)
    except json.JSONDecodeError as error:
        raise ValueError(f"Input is not valid JSON string: {error}") from error

    if not isinstance(extraction_obj, dict):
        raise ValueError("Top-level JSON must be an object/dict.")
    projects = extraction_obj.get("projects")
    if not isinstance(projects, list):
        raise ValueError('Top-level key "projects" must be a list.')

    total_projects = len(projects)
    if total_projects == 0:
        merged_obj = dict(extraction_obj)
        merged_obj["projects"] = []
        if on_progress:
            on_progress(0, 0, 1, 1, "No projects to validate.")
        return ValidationResult(
            validated_obj=merged_obj,
            validated_json_str=json.dumps(merged_obj, ensure_ascii=False, indent=2),
            usage={"input_tokens": None, "output_tokens": None, "total_tokens": None},
            elapsed_seconds=0.0,
            model=model,
        )

    chunks = _split_into_n_chunks(projects, num_batches)
    merged_obj = dict(extraction_obj)
    merged_projects = list(projects)
    merged_obj["projects"] = merged_projects
    overall_start = time.perf_counter()
    chunk_usages: list[dict[str, Any]] = []
    chunk_times: list[float] = []
    cursor = 0

    resolved_client = client or build_openai_client()
    system_prompt = read_text("prompts/validation/barangay_system.txt")

    for batch_index, chunk in enumerate(chunks, start=1):
        chunk_size = len(chunk)
        if chunk_size == 0:
            continue
        batch_start = time.perf_counter()
        payload_obj = {"projects": chunk}
        response = resolved_client.responses.create(
            model=model,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(payload_obj, ensure_ascii=False)},
            ],
            text={"format": {"type": "json_object"}},
        )
        batch_elapsed = round(time.perf_counter() - batch_start, 4)
        usage = safe_usage_dict(response)
        validated_chunk_obj = json.loads(response.output_text)
        validated_chunk_projects = validated_chunk_obj.get("projects")
        if not isinstance(validated_chunk_projects, list) or len(validated_chunk_projects) != chunk_size:
            raise RuntimeError(
                f"Batch {batch_index}: invalid model output. expected={chunk_size}, got={len(validated_chunk_projects) if isinstance(validated_chunk_projects, list) else type(validated_chunk_projects)}"
            )
        for local_idx in range(chunk_size):
            original_idx = cursor + local_idx
            merged_projects[original_idx]["errors"] = validated_chunk_projects[local_idx].get("errors", None)
        cursor += chunk_size
        chunk_usages.append(usage)
        chunk_times.append(batch_elapsed)
        done_projects = min(cursor, total_projects)
        if on_progress:
            on_progress(
                done_projects,
                total_projects,
                batch_index,
                num_batches,
                f"Validating projects {done_projects}/{total_projects} (batch {batch_index}/{num_batches})...",
            )

    overall_elapsed = round(time.perf_counter() - overall_start, 4)
    return ValidationResult(
        validated_obj=merged_obj,
        validated_json_str=json.dumps(merged_obj, ensure_ascii=False, indent=2),
        usage=_sum_usage(chunk_usages),
        elapsed_seconds=overall_elapsed,
        model=model,
        chunk_usages=chunk_usages,
        chunk_elapsed_seconds=chunk_times,
    )

