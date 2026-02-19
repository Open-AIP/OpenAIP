from __future__ import annotations

import json
import math
import os
import time
from typing import Any, Dict, List, Optional

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
You are a strict rule-based JSON validator.

For EACH project, evaluate the following rules:

R001 Required fields:
aip_ref_code, program_project_description, implementing_agency, start_date,
completion_date, source_of_funds, total

R002 start_date and completion_date must be valid dates in EITHER format:

A) Month name format (case-insensitive):
Accept either FULL month names or standard 3-letter abbreviations:
January/Jan, February/Feb, March/Mar, April/Apr, May/May, June/Jun,
July/Jul, August/Aug, September/Sep, October/Oct, November/Nov, December/Dec.

B) Numeric date format:
Accept common numeric date strings such as:
- M/D/YYYY (e.g., 1/1/2026, 12/31/2026)
- MM/DD/YYYY (e.g., 01/01/2026, 12/05/2026)

Rules for numeric dates:
- Month must be 1–12
- Day must be 1–31
- Year must be 4 digits (e.g., 2026)

Do NOT mark abbreviations like "Jan" or "Dec" as errors.

R003 Numeric fields must be number or null:
personal_services,
maintenance_and_other_operating_expenses,
financial_expenses,
capital_outlay,
total,

R004 cc_topology_code must be null or match pattern A###-##

R005 total must equal:
personal_services + maintenance_and_other_operating_expenses + capital_outlay
(null = 0)

R006 climate_change_adaptation + climate_change_mitigation ≤ total
(null = 0)

OUTPUT RULE:
- If a project has NO violations → errors = null
- If a project HAS violations → errors = array of strings
- Do NOT modify any other field
- Return the FULL JSON with updated errors fields only
- Output JSON only
"""


# ----------------------------
# helpers
# ----------------------------
def _read_positive_float_env(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        value = float(raw)
    except ValueError:
        return default
    if not math.isfinite(value) or value <= 0:
        return default
    return value


def _read_positive_int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    if value <= 0:
        return default
    return value


def _normalize_errors(value: Any) -> Optional[List[str]]:
    if value is None:
        return None

    if isinstance(value, str):
        msg = value.strip()
        return [msg] if msg else None

    if isinstance(value, list):
        cleaned = [str(item).strip() for item in value if str(item).strip()]
        return cleaned or None

    msg = str(value).strip()
    return [msg] if msg else None


def _require_valid_input_shape(extraction_obj: Any) -> List[Dict[str, Any]]:
    if not isinstance(extraction_obj, dict):
        raise ValueError("Input JSON must be an object with top-level 'projects' array.")

    projects = extraction_obj.get("projects")
    if not isinstance(projects, list):
        raise ValueError("Input JSON must contain top-level 'projects' array.")

    for idx, row in enumerate(projects):
        if not isinstance(row, dict):
            raise ValueError(f"Input projects[{idx}] must be a JSON object.")

    return projects


def _merge_errors_only(
    extraction_obj: Dict[str, Any],
    response_obj: Any,
) -> Dict[str, Any]:
    if not isinstance(response_obj, dict):
        raise ValueError("Validation response must be a JSON object.")

    source_projects = extraction_obj.get("projects", [])
    candidate_projects = response_obj.get("projects")
    if not isinstance(candidate_projects, list):
        raise ValueError("Validation response must contain top-level 'projects' array.")

    if len(candidate_projects) != len(source_projects):
        raise ValueError(
            f"Validation response project count mismatch: expected {len(source_projects)}, "
            f"got {len(candidate_projects)}."
        )

    merged = dict(extraction_obj)
    merged_projects = []

    for idx, source_row in enumerate(source_projects):
        candidate_row = candidate_projects[idx]
        if not isinstance(candidate_row, dict):
            raise ValueError(f"Validation response projects[{idx}] must be a JSON object.")

        merged_row = dict(source_row)
        merged_row["errors"] = _normalize_errors(candidate_row.get("errors"))
        merged_projects.append(merged_row)

    merged["projects"] = merged_projects
    return merged


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


class ValidationResult:
    """
    Small container class (no Pydantic needed).
    Keeps the exact return shape for your pipeline.
    """
    def __init__(
        self,
        validated_obj: Dict[str, Any],
        validated_json_str: str,
        usage: Dict[str, Any],
        elapsed_seconds: float,
        model: str,
    ):
        self.validated_obj = validated_obj
        self.validated_json_str = validated_json_str
        self.usage = usage
        self.elapsed_seconds = elapsed_seconds
        self.model = model


# ----------------------------
# main callable: STRING IN -> STRING OUT
# ----------------------------
def validate_projects_json_str(
    extraction_json_str: str,
    model: str = "gpt-5.2",
    heartbeat_seconds: float = 5.0,  # prints status every N seconds (best-effort)
    request_timeout_seconds: float = _read_positive_float_env("VALIDATION_TIMEOUT_SECONDS", 180.0),
    max_input_chars: int = _read_positive_int_env("VALIDATION_MAX_INPUT_CHARS", 1_000_000),
    max_projects: int = _read_positive_int_env("VALIDATION_MAX_PROJECTS", 2_000),
) -> ValidationResult:
    """
    Accepts extraction output as a JSON string.
    Returns validated JSON as both dict + JSON string (errors updated only).

    Adds progress monitoring prints + elapsed timer for visibility.
    """
    if not isinstance(extraction_json_str, str) or not extraction_json_str.strip():
        raise ValueError("Input extraction_json_str must be a non-empty JSON string.")

    if not isinstance(model, str) or not model.strip():
        raise ValueError("model must be a non-empty string.")

    if not isinstance(heartbeat_seconds, (int, float)) or not math.isfinite(heartbeat_seconds) or heartbeat_seconds <= 0:
        raise ValueError("heartbeat_seconds must be a positive number.")

    if (
        not isinstance(request_timeout_seconds, (int, float))
        or not math.isfinite(request_timeout_seconds)
        or request_timeout_seconds <= 0
    ):
        raise ValueError("request_timeout_seconds must be a positive number.")

    if not isinstance(max_input_chars, int) or max_input_chars <= 0:
        raise ValueError("max_input_chars must be a positive integer.")

    if not isinstance(max_projects, int) or max_projects <= 0:
        raise ValueError("max_projects must be a positive integer.")

    if len(extraction_json_str) > max_input_chars:
        raise ValueError(
            f"Input JSON too large for validation: {len(extraction_json_str)} chars "
            f"(max {max_input_chars})."
        )

    # Ensure it's valid JSON before sending
    try:
        extraction_obj = json.loads(extraction_json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Input is not valid JSON string: {e}") from e

    projects = _require_valid_input_shape(extraction_obj)
    if len(projects) > max_projects:
        raise ValueError(f"Input has too many projects for validation: {len(projects)} (max {max_projects}).")

    start_ts = time.perf_counter()
    last_beat = start_ts

    def beat(msg: str):
        nonlocal last_beat
        now = time.perf_counter()
        if now - last_beat >= heartbeat_seconds:
            print(f"[VALIDATION] {msg} | elapsed={now - start_ts:.1f}s", flush=True)
            last_beat = now

    print(f"[VALIDATION] Started (model={model})", flush=True)
    print(
        f"[VALIDATION] Input sanity OK | projects={len(projects)} | chars={len(extraction_json_str)}",
        flush=True,
    )

    if not projects:
        elapsed = round(time.perf_counter() - start_ts, 4)
        print(f"[VALIDATION] No projects found; skipping model call | elapsed={elapsed:.2f}s", flush=True)
        return ValidationResult(
            validated_obj=extraction_obj,
            validated_json_str=json.dumps(extraction_obj, ensure_ascii=False, indent=2),
            usage={"input_tokens": None, "output_tokens": None, "total_tokens": None},
            elapsed_seconds=elapsed,
            model=model,
        )

    beat("Preparing request")

    print(f"[VALIDATION] Sending request to OpenAI... (timeout={request_timeout_seconds:.1f}s)", flush=True)

    # NOTE: This call is blocking; heartbeat cannot print during the in-flight request
    try:
        response = client.responses.create(
            model=model,
            input=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(extraction_obj, ensure_ascii=False)},
            ],
            text={"format": {"type": "json_object"}},
            timeout=request_timeout_seconds,
        )
    except Exception as e:
        elapsed = round(time.perf_counter() - start_ts, 4)
        raise RuntimeError(
            f"Validation request failed after {elapsed:.2f}s "
            f"(timeout={request_timeout_seconds:.1f}s): {e}"
        ) from e

    beat("Response received")

    elapsed = round(time.perf_counter() - start_ts, 4)

    output_text = getattr(response, "output_text", None)
    if not isinstance(output_text, str) or not output_text.strip():
        raise ValueError("Validation response was empty or missing output_text.")

    # Responses API returns JSON as text; parse into dict
    try:
        response_obj = json.loads(output_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Validation response is not valid JSON: {e}") from e

    # Enforce pipeline contract: only 'errors' may change.
    validated_obj = _merge_errors_only(extraction_obj, response_obj)

    # Make a canonical JSON string for downstream stages
    validated_json_str = json.dumps(validated_obj, ensure_ascii=False, indent=2)

    usage = _safe_usage_dict(response)

    print(f"[VALIDATION] Done ✅ | elapsed={elapsed:.2f}s", flush=True)

    return ValidationResult(
        validated_obj=validated_obj,
        validated_json_str=validated_json_str,
        usage=usage,
        elapsed_seconds=elapsed,
        model=model,
    )
