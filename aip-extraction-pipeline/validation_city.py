from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from openai import OpenAI

# ----------------------------
# ENV / CLIENT
# ----------------------------
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY not found. Put it in your .env file.")

client = OpenAI(api_key=api_key)

# ----------------------------
# SYSTEM PROMPT (RULE BASE)
# ----------------------------
SYSTEM_PROMPT = """
You are a strict rule-based JSON validator for a City/Municipality Annual Investment Program (AIP) table (Annex B format).

INPUT
- You will receive a JSON object with top-level key: "projects": [ ... ].
- Each project is one AIP row already extracted into JSON keys.

OUTPUT
- Return the FULL JSON exactly as received, but update ONLY the "errors" field of each project.
- If NO violations → errors = null
- If HAS violations → errors = array of strings ("R### short message")
- Do NOT modify any other keys/values.
- Output JSON only.

CITY AIP COLUMN ALIGNMENT (Annex B)
(1) aip_ref_code
(2) program_project_description
(3) implementing_agency
(4) start_date
(5) completion_date
(6) expected_output
(7) source_of_funds
(8) personal_services (PS)
(9) maintenance_and_other_operating_expenses (MOOE)
(10) capital_outlay (CO)
(11) total
(12) climate_change_adaptation
(13) climate_change_mitigation
(14) cc_topology_code
(15) prm_ncr_lgu_rm_objective_results_indicator_code  (may appear as prm_ncr_lgu or rm_objective or results_indicator)

VALIDATION RULES (evaluate EACH project)

R001 Required columns (must exist and not be empty string):
- aip_ref_code
- program_project_description
- implementing_agency
- start_date
- completion_date
- expected_output
- source_of_funds
- total

R002 Date validity (start_date and completion_date):
Accept either:
A) Month-only or month-name formats (case-insensitive): "Jan", "January", "Jan 2026", "Sep 1 2026", "Sep 1, 2026"
B) Numeric format: M/D/YYYY or MM/DD/YYYY with Month 1–12, Day 1–31, Year 4 digits
Do NOT flag month-only values like "Jan" or "Dec".

R003 Numeric columns must be number or null (not strings like "1,000"):
- personal_services
- maintenance_and_other_operating_expenses
- capital_outlay
- total
- climate_change_adaptation
- climate_change_mitigation

R004 Total arithmetic consistency:
total must equal personal_services + maintenance_and_other_operating_expenses + capital_outlay
Treat null as 0.
Allow tolerance of 1.00 peso.

R005 Climate expenditure bounds:
(climate_change_adaptation + climate_change_mitigation) <= total
Treat null as 0.
Allow tolerance of 1.00 peso.

R006 CC typology code format:
cc_topology_code must be null OR match pattern: A###-## (example: A214-04)

R007 PRM/NCR results indicator code presence (column 15):
If any of these keys exist, they must be either null or a non-empty string:
- prm_ncr_lgu_rm_objective_results_indicator_code
- prm_ncr_lgu
- rm_objective
- results_indicator
Do NOT require the field if it is not present in the extracted JSON.

R008 Non-negative money:
All numeric budget fields (PS/MOOE/CO/total/climate fields) must be >= 0 if not null.

ERROR STRING FORMAT
- Each error string must start with the rule ID, e.g.:
"R004 total mismatch: expected 12345.00 but got 12000.00"
"""



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


def _split_into_n_chunks(items: List[Any], n: int) -> List[List[Any]]:
    """
    Split list into n chunks as evenly as possible.
    Example: 10 items into 4 -> [3,3,2,2]
    """
    if n <= 0:
        raise ValueError("n must be >= 1")

    total = len(items)
    if total == 0:
        return [[] for _ in range(n)]

    base = total // n
    rem = total % n
    chunks = []
    start = 0
    for i in range(n):
        size = base + (1 if i < rem else 0)
        chunks.append(items[start : start + size])
        start += size
    return chunks


class ValidationResult:
    """
    Container class.
    """
    def __init__(
        self,
        validated_obj: Dict[str, Any],
        validated_json_str: str,
        usage: Dict[str, Any],
        elapsed_seconds: float,
        model: str,
        chunk_usages: Optional[List[Dict[str, Any]]] = None,
        chunk_elapsed_seconds: Optional[List[float]] = None,
    ):
        self.validated_obj = validated_obj
        self.validated_json_str = validated_json_str
        self.usage = usage
        self.elapsed_seconds = elapsed_seconds
        self.model = model
        self.chunk_usages = chunk_usages or []
        self.chunk_elapsed_seconds = chunk_elapsed_seconds or []


def _sum_usage(usages: List[Dict[str, Any]]) -> Dict[str, Any]:
    def s(key: str) -> Optional[int]:
        vals = [u.get(key) for u in usages if isinstance(u.get(key), int)]
        return sum(vals) if vals else None

    return {
        "input_tokens": s("input_tokens"),
        "output_tokens": s("output_tokens"),
        "total_tokens": s("total_tokens"),
    }


# ----------------------------
# main callable: STRING IN -> STRING OUT (BATCHED INTO 4)
# ----------------------------
def validate_projects_json_str(
    extraction_json_str: str,
    model: str = "gpt-5.2",
    num_batches: int = 4,
) -> ValidationResult:
    """
    Splits extraction_obj["projects"] into num_batches chunks (default 4),
    validates each chunk separately, then merges back by updating ONLY 'errors'.

    Returns:
      - validated_obj (full object)
      - validated_json_str (pretty JSON string)
      - usage (summed token usage if available)
      - chunk_usages + chunk_elapsed_seconds for per-batch visibility
    """
    # Validate input JSON
    try:
        extraction_obj = json.loads(extraction_json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Input is not valid JSON string: {e}") from e

    if not isinstance(extraction_obj, dict):
        raise ValueError("Top-level JSON must be an object/dict.")

    projects = extraction_obj.get("projects")
    if not isinstance(projects, list):
        raise ValueError('Top-level key "projects" must be a list.')

    # Prepare chunks
    chunks = _split_into_n_chunks(projects, num_batches)

    # We'll build a deep-ish copy of the full object to return
    # (projects are kept as original dict references; we only write errors)
    merged_obj = dict(extraction_obj)
    merged_projects = list(projects)  # preserve order
    merged_obj["projects"] = merged_projects

    overall_start = time.perf_counter()
    chunk_usages: List[Dict[str, Any]] = []
    chunk_times: List[float] = []

    cursor = 0  # index in the original project list

    print(f"[VALIDATION] Started batched validation (model={model}, batches={num_batches})", flush=True)
    print(f"[VALIDATION] Total projects: {len(projects)}", flush=True)

    for i, chunk in enumerate(chunks, start=1):
        chunk_size = len(chunk)
        if chunk_size == 0:
            print(f"[VALIDATION] Batch {i}/{num_batches}: empty (skipped)", flush=True)
            continue

        batch_start = time.perf_counter()
        print(f"[VALIDATION] Batch {i}/{num_batches}: validating {chunk_size} project(s)...", flush=True)

        # Important: send ONLY this chunk in the same expected shape
        payload_obj = {"projects": chunk}

        response = client.responses.create(
            model=model,
            input=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(payload_obj, ensure_ascii=False)},
            ],
            text={"format": {"type": "json_object"}},
        )

        batch_elapsed = round(time.perf_counter() - batch_start, 4)
        usage = _safe_usage_dict(response)

        # Parse output
        validated_chunk_obj = json.loads(response.output_text)
        validated_chunk_projects = validated_chunk_obj.get("projects")

        if not isinstance(validated_chunk_projects, list) or len(validated_chunk_projects) != chunk_size:
            raise RuntimeError(
                f"Batch {i}: Model returned invalid shape. "
                f"Expected projects list length {chunk_size}, got "
                f"{len(validated_chunk_projects) if isinstance(validated_chunk_projects, list) else type(validated_chunk_projects)}."
            )

        # Merge errors back ONLY
        for j in range(chunk_size):
            original_idx = cursor + j
            original_proj = merged_projects[original_idx]
            validated_proj = validated_chunk_projects[j]

            # Only overwrite "errors"
            original_proj["errors"] = validated_proj.get("errors", None)

        cursor += chunk_size

        chunk_usages.append(usage)
        chunk_times.append(batch_elapsed)

        print(
            f"[VALIDATION] Batch {i}/{num_batches}: done ✅ | elapsed={batch_elapsed:.2f}s | usage={usage}",
            flush=True,
        )

    overall_elapsed = round(time.perf_counter() - overall_start, 4)
    total_usage = _sum_usage(chunk_usages)

    validated_json_str = json.dumps(merged_obj, ensure_ascii=False, indent=2)

    print(f"[VALIDATION] All batches complete ✅ | total_elapsed={overall_elapsed:.2f}s", flush=True)

    return ValidationResult(
        validated_obj=merged_obj,
        validated_json_str=validated_json_str,
        usage=total_usage,
        elapsed_seconds=overall_elapsed,
        model=model,
        chunk_usages=chunk_usages,
        chunk_elapsed_seconds=chunk_times,
    )