from __future__ import annotations

import json
import os
import time
from typing import Any, Callable, Literal

from openai import OpenAI
from pydantic import BaseModel, Field, field_validator

from openaip_pipeline.core.resources import read_text
from openaip_pipeline.services.openai_utils import build_openai_client, safe_usage_dict


Category = Literal["Infrastructure", "Healthcare", "Other"]


class ProjectForCategorization(BaseModel):
    aip_ref_code: str | None = None
    program_project_description: str | None = None
    implementing_agency: str | None = None
    expected_output: str | None = None
    source_of_funds: str | None = None


class CategorizedItem(BaseModel):
    index: int
    category: Category


class CategorizationResponse(BaseModel):
    items: list[CategorizedItem] = Field(default_factory=list)

    @field_validator("items")
    @classmethod
    def _unique_indices(cls, value: list[CategorizedItem]) -> list[CategorizedItem]:
        indices = [item.index for item in value]
        if len(set(indices)) != len(indices):
            raise ValueError("Duplicate indices in categorization response.")
        return value


class CategorizationResult:
    def __init__(
        self,
        categorized_obj: dict[str, Any],
        categorized_json_str: str,
        usage: dict[str, Any],
        elapsed_seconds: float,
        model: str,
    ):
        self.categorized_obj = categorized_obj
        self.categorized_json_str = categorized_json_str
        self.usage = usage
        self.elapsed_seconds = elapsed_seconds
        self.model = model


def _build_classification_text(project: ProjectForCategorization) -> str:
    parts: list[str] = []
    if project.aip_ref_code:
        parts.append(f"RefCode: {project.aip_ref_code}")
    if project.program_project_description:
        parts.append(f"Description: {project.program_project_description}")
    if project.implementing_agency:
        parts.append(f"ImplementingAgency: {project.implementing_agency}")
    if project.expected_output:
        parts.append(f"ExpectedOutput: {project.expected_output}")
    if project.source_of_funds:
        parts.append(f"SourceOfFunds: {project.source_of_funds}")
    return "\n".join(parts).strip() or "No details provided."


def categorize_batch(
    *,
    batch: list[ProjectForCategorization],
    model: str,
    client: OpenAI,
    batch_no: int | None = None,
    total_batches: int | None = None,
) -> tuple[CategorizationResponse, dict[str, Any]]:
    numbered = [f"ITEM {idx}\n{_build_classification_text(project)}" for idx, project in enumerate(batch)]
    user_text = (
        "Categorize Annual Investment Plan project rows.\n\n"
        "Categories:\n"
        "- Infrastructure\n"
        "- Healthcare\n"
        "- Other\n\n"
        "Rules:\n"
        "- Exactly one category per item.\n"
        "- If ambiguous, choose Other.\n"
        "- Output indices must match item numbers.\n\n"
        "Items:\n\n"
        + "\n\n---\n\n".join(numbered)
    )
    system_prompt = read_text("prompts/categorization/system.txt")
    response = client.responses.parse(
        model=model,
        input=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text},
        ],
        text_format=CategorizationResponse,
        temperature=0,
    )
    parsed: CategorizationResponse = response.output_parsed
    usage = safe_usage_dict(response)
    tag = ""
    if batch_no is not None and total_batches is not None:
        tag = f" batch={batch_no}/{total_batches}"
    print(f"[CATEGORIZATION]{tag} count={len(batch)}", flush=True)
    return parsed, usage


def categorize_all_projects(
    *,
    projects_raw: list[dict[str, Any]],
    model: str,
    batch_size: int,
    on_progress: Callable[[int, int, int, int], None] | None,
    client: OpenAI,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    total = len(projects_raw)
    usage_total: dict[str, Any] = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}
    minimal = [
        ProjectForCategorization(
            aip_ref_code=row.get("aip_ref_code"),
            program_project_description=row.get("program_project_description"),
            implementing_agency=row.get("implementing_agency"),
            expected_output=row.get("expected_output"),
            source_of_funds=row.get("source_of_funds"),
        )
        for row in projects_raw
    ]
    if total == 0:
        return projects_raw, usage_total
    total_batches = (total + batch_size - 1) // batch_size
    for batch_index, start in enumerate(range(0, total, batch_size), start=1):
        end = min(start + batch_size, total)
        parsed, usage = categorize_batch(
            batch=minimal[start:end],
            model=model,
            client=client,
            batch_no=batch_index,
            total_batches=total_batches,
        )
        idx_to_cat = {item.index: item.category for item in parsed.items}
        for local_idx in range(end - start):
            global_idx = start + local_idx
            projects_raw[global_idx]["category"] = idx_to_cat.get(local_idx, "Other")
        for key in ["input_tokens", "output_tokens", "total_tokens"]:
            value = usage.get(key)
            if isinstance(value, int) and isinstance(usage_total.get(key), int):
                usage_total[key] += value
            else:
                usage_total[key] = None
        if on_progress:
            on_progress(end, total, batch_index, total_batches)
    return projects_raw, usage_total


def categorize_from_summarized_json_str(
    summarized_json_str: str,
    model: str = "gpt-5.2",
    batch_size: int = 25,
    heartbeat_seconds: float = 10.0,
    on_progress: Callable[[int, int, int, int], None] | None = None,
    client: OpenAI | None = None,
) -> CategorizationResult:
    try:
        doc = json.loads(summarized_json_str)
    except json.JSONDecodeError as error:
        raise ValueError(f"Input is not valid JSON string: {error}") from error
    projects = doc.get("projects", [])
    if not isinstance(projects, list):
        raise ValueError("Invalid input: top-level 'projects' must be a list.")
    resolved_client = client or build_openai_client()
    started = time.perf_counter()
    last_beat = started

    def beat(message: str) -> None:
        nonlocal last_beat
        now = time.perf_counter()
        if now - last_beat >= heartbeat_seconds:
            print(f"[CATEGORIZATION] {message}", flush=True)
            last_beat = now

    beat("Starting categorization")
    updated_projects, usage = categorize_all_projects(
        projects_raw=projects,
        model=model,
        batch_size=batch_size,
        on_progress=on_progress,
        client=resolved_client,
    )
    doc["projects"] = updated_projects
    elapsed = round(time.perf_counter() - started, 4)
    return CategorizationResult(
        categorized_obj=doc,
        categorized_json_str=json.dumps(doc, ensure_ascii=False, indent=2),
        usage=usage,
        elapsed_seconds=elapsed,
        model=model,
    )


def write_categorized_json_file(categorized_json_str: str, out_path: str) -> str:
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as file_handle:
        file_handle.write(categorized_json_str)
    return out_path

