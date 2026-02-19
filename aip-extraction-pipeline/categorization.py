from __future__ import annotations

import json
import os
import time
from typing import List, Optional, Literal, Tuple, Dict, Any

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, Field, field_validator


# ----------------------------
# ENV + CLIENT
# ----------------------------
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY not found. Put it in your .env file.")

client = OpenAI(api_key=api_key)


# ----------------------------
# Schema
# ----------------------------
Category = Literal["Infrastructure", "Healthcare", "Other"]

class ProjectForCategorization(BaseModel):
    aip_ref_code: Optional[str] = None
    program_project_description: Optional[str] = None
    implementing_agency: Optional[str] = None
    expected_output: Optional[str] = None
    source_of_funds: Optional[str] = None

class CategorizedItem(BaseModel):
    index: int
    category: Category

class CategorizationResponse(BaseModel):
    items: List[CategorizedItem] = Field(default_factory=list)

    @field_validator("items")
    @classmethod
    def _unique_indices(cls, v):
        idxs = [it.index for it in v]
        if len(set(idxs)) != len(idxs):
            raise ValueError("Duplicate indices in categorization response.")
        return v


# ----------------------------
# helpers
# ----------------------------
def _safe_usage_dict(response: Any) -> Dict[str, Any]:
    usage = getattr(response, "usage", None)
    if not usage:
        return {"input_tokens": None, "output_tokens": None, "total_tokens": None}

    def pick(*names):
        for n in names:
            if hasattr(usage, n):
                return getattr(usage, n)
        return None

    return {
        "input_tokens": pick("input_tokens", "prompt_tokens"),
        "output_tokens": pick("output_tokens", "completion_tokens"),
        "total_tokens": pick("total_tokens"),
    }

def _build_classification_text(p: ProjectForCategorization) -> str:
    parts = []
    if p.aip_ref_code:
        parts.append(f"RefCode: {p.aip_ref_code}")
    if p.program_project_description:
        parts.append(f"Description: {p.program_project_description}")
    if p.implementing_agency:
        parts.append(f"ImplementingAgency: {p.implementing_agency}")
    if p.expected_output:
        parts.append(f"ExpectedOutput: {p.expected_output}")
    if p.source_of_funds:
        parts.append(f"SourceOfFunds: {p.source_of_funds}")
    return "\n".join(parts).strip() or "No details provided."


def categorize_batch(
    batch: List[ProjectForCategorization],
    model: str = "gpt-5.2",
    batch_no: Optional[int] = None,
    total_batches: Optional[int] = None,
) -> Tuple[CategorizationResponse, Dict[str, Any]]:
    """
    Categorize a batch with timing + logs.
    """
    # Build numbered items for strict alignment
    numbered = []
    for i, proj in enumerate(batch):
        numbered.append(f"ITEM {i}\n{_build_classification_text(proj)}")

    user_text = (
        "You are categorizing Annual Investment Plan (AIP) project rows.\n\n"
        "Return ONLY structured output matching the schema.\n\n"
        "Categories:\n"
        "- Infrastructure: roads, drainage, buildings, facilities, utilities, equipment for public works, construction/rehab, transport, similar.\n"
        "- Healthcare: health services, clinics, medical programs, disease prevention, medicines, health manpower/training, public health activities, similar.\n"
        "- Other: anything that is not clearly Infrastructure or Healthcare.\n\n"
        "Rules:\n"
        "- Choose exactly ONE category per item.\n"
        "- If info is insufficient/ambiguous, choose Other.\n"
        "- Indices must match the item numbers.\n\n"
        "Items:\n\n"
        + "\n\n---\n\n".join(numbered)
    )

    tag = ""
    if batch_no is not None and total_batches is not None:
        tag = f" (batch {batch_no}/{total_batches})"

    print(f"[CATEGORIZATION] Calling model{tag} for {len(batch)} item(s)...", flush=True)
    t0 = time.perf_counter()

    response = client.responses.parse(
        model=model,
        input=[
            {
                "role": "system",
                "content": "Classify each item into exactly one category. Output must match the schema.",
            },
            {"role": "user", "content": user_text},
        ],
        text_format=CategorizationResponse,
        temperature=0,
    )

    elapsed = time.perf_counter() - t0

    parsed: CategorizationResponse = response.output_parsed
    usage = _safe_usage_dict(response)

    print(
        f"[CATEGORIZATION] Batch done{tag}. Returned {len(parsed.items)} item(s). "
        f"elapsed={elapsed:.2f}s",
        flush=True,
    )
    return parsed, usage


def categorize_all_projects(
    projects_raw: List[dict],
    model: str = "gpt-5.2",
    batch_size: int = 25,
) -> Tuple[List[dict], Dict[str, Any]]:
    """
    Returns:
      - updated projects list (category filled)
      - aggregated token usage (best-effort)
    Adds per-batch progress logs.
    """
    total = len(projects_raw)
    usage_total: Dict[str, Any] = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}

    minimal: List[ProjectForCategorization] = []
    for r in projects_raw:
        minimal.append(
            ProjectForCategorization(
                aip_ref_code=r.get("aip_ref_code"),
                program_project_description=r.get("program_project_description"),
                implementing_agency=r.get("implementing_agency"),
                expected_output=r.get("expected_output"),
                source_of_funds=r.get("source_of_funds"),
            )
        )

    if total == 0:
        print("[CATEGORIZATION] No projects to categorize.", flush=True)
        return projects_raw, usage_total

    total_batches = (total + batch_size - 1) // batch_size

    for batch_i, start in enumerate(range(0, total, batch_size), start=1):
        end = min(start + batch_size, total)
        batch = minimal[start:end]

        print(
            f"[CATEGORIZATION] Processing batch {batch_i}/{total_batches} "
            f"(items {start + 1}-{end} of {total})",
            flush=True,
        )

        parsed, usage = categorize_batch(
            batch,
            model=model,
            batch_no=batch_i,
            total_batches=total_batches,
        )

        idx_to_cat = {it.index: it.category for it in parsed.items}

        for local_i in range(len(batch)):
            global_i = start + local_i
            projects_raw[global_i]["category"] = idx_to_cat.get(local_i, "Other")

        for k in ["input_tokens", "output_tokens", "total_tokens"]:
            v = usage.get(k)
            if isinstance(v, int) and isinstance(usage_total.get(k), int):
                usage_total[k] += v
            else:
                usage_total[k] = None

        print(f"[CATEGORIZATION] Progress: categorized {end}/{total}", flush=True)

    return projects_raw, usage_total


# ----------------------------
# Importable result container
# ----------------------------
class CategorizationResult:
    def __init__(
        self,
        categorized_obj: Dict[str, Any],
        categorized_json_str: str,
        usage: Dict[str, Any],
        elapsed_seconds: float,
        model: str,
    ):
        self.categorized_obj = categorized_obj
        self.categorized_json_str = categorized_json_str
        self.usage = usage
        self.elapsed_seconds = elapsed_seconds
        self.model = model


# ----------------------------
# Main callable: STRING IN -> STRING OUT (+ optional write)
# ----------------------------
def categorize_from_summarized_json_str(
    summarized_json_str: str,
    model: str = "gpt-5.2",
    batch_size: int = 25,
    heartbeat_seconds: float = 10.0,  # best-effort heartbeat between batches
) -> CategorizationResult:
    """
    Input: summarized JSON string from summarization stage.
      Expected shape: {"projects":[...], "summary":"..."} OR at least {"projects":[...]}.
    Output: same doc with project categories filled.

    Adds timing + monitoring prints.
    """
    try:
        doc = json.loads(summarized_json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Input is not valid JSON string: {e}") from e

    projects = doc.get("projects", [])
    if not isinstance(projects, list):
        raise ValueError("Invalid input: top-level 'projects' must be a list.")

    start_ts = time.perf_counter()
    last_beat = start_ts

    def beat(msg: str):
        nonlocal last_beat
        now = time.perf_counter()
        if now - last_beat >= heartbeat_seconds:
            print(f"[CATEGORIZATION] {msg} | elapsed={now - start_ts:.1f}s", flush=True)
            last_beat = now

    print(f"[CATEGORIZATION] Started (model={model}, batch_size={batch_size})", flush=True)
    beat("Preparing projects")

    updated_projects, usage = categorize_all_projects(
        projects_raw=projects,
        model=model,
        batch_size=batch_size,
    )

    doc["projects"] = updated_projects

    categorized_json_str = json.dumps(doc, ensure_ascii=False, indent=2)
    elapsed = round(time.perf_counter() - start_ts, 4)

    print(f"[CATEGORIZATION] Done ✅ | elapsed={elapsed:.2f}s", flush=True)

    return CategorizationResult(
        categorized_obj=doc,
        categorized_json_str=categorized_json_str,
        usage=usage,
        elapsed_seconds=elapsed,
        model=model,
    )


def write_categorized_json_file(
    categorized_json_str: str,
    out_path: str,
) -> str:
    """
    Writes categorized JSON string to a file and returns the path.
    """
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(categorized_json_str)
    print(f"[CATEGORIZATION] Saved file: {out_path}", flush=True)
    return out_path
