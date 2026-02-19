from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, Optional

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
) -> ValidationResult:
    """
    Accepts extraction output as a JSON string.
    Returns validated JSON as both dict + JSON string (errors updated only).

    Adds progress monitoring prints + elapsed timer for visibility.
    """
    # Ensure it's valid JSON before sending
    try:
        extraction_obj = json.loads(extraction_json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Input is not valid JSON string: {e}") from e

    start_ts = time.perf_counter()
    last_beat = start_ts

    def beat(msg: str):
        nonlocal last_beat
        now = time.perf_counter()
        if now - last_beat >= heartbeat_seconds:
            print(f"[VALIDATION] {msg} | elapsed={now - start_ts:.1f}s", flush=True)
            last_beat = now

    print(f"[VALIDATION] Started (model={model})", flush=True)
    beat("Preparing request")

    print("[VALIDATION] Sending request to OpenAI...", flush=True)

    # NOTE: This call is blocking; heartbeat cannot print during the in-flight request
    response = client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(extraction_obj, ensure_ascii=False)},
        ],
        text={"format": {"type": "json_object"}},
    )

    beat("Response received")

    elapsed = round(time.perf_counter() - start_ts, 4)

    # Responses API returns JSON as text; parse into dict
    validated_obj = json.loads(response.output_text)

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
