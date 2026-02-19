from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from openai import OpenAI


# ----------------------------
# ENV + CLIENT
# ----------------------------
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY not found. Put it in your .env file.")

client = OpenAI(api_key=api_key)


# ----------------------------
# SYSTEM PROMPT (₱ FORMATTING ENFORCED)
# ----------------------------
SYSTEM_PROMPT = """
You are generating a TABLE-GROUNDED summary of an Annual Investment Plan (AIP)
based strictly on the provided JSON extracted from official AIP tables.

CRITICAL GROUNDING RULES:

* Use ONLY information present in the JSON.
* Do NOT invent projects, amounts, dates, or findings.
* If a required aspect is not supported by the data, explicitly state that it is not observed.
* Do NOT copy or restate validator rule codes (e.g., “R001…”) or error-message phrasing in the summary.
* When describing issues, use plain-language observations (e.g., “some records lack completion dates”) without enumerating per-field error flags.
* ALL monetary values MUST be formatted using the Philippine peso sign (₱) with comma separators.
* Do NOT compute or report the overall TOTAL AIP budget amount.

SUMMARY OBJECTIVE:
Generate ONE concise overall summary that enables quantitative evaluation
using Data-QuestEval.

The summary MUST explicitly address ALL of the following aspects:

1. Overall Budget Direction

   * Describe how the budget appears to be distributed (e.g., infrastructure-focused, mixed-sector)
     based on observed projects and/or listed amounts.
   * Do NOT mention or infer the total budget amount.

2. Major Investments

   * Identify dominant project types or sectors (e.g., road infrastructure, agriculture, health).
   * Reference relative prominence based on counts or observed project amounts
     (avoid exact percentages unless explicitly present in the JSON).

3. Observed Issues

   * Note data-level or planning issues evident in the table, such as:
     • missing values (e.g., absent dates or blank categories)
     • uneven budget distribution across projects
     • concentration in a single sector
   * If no issues are evident, state that explicitly.
   * Do NOT quote or paraphrase structured “errors” fields verbatim; summarize them neutrally.

4. Climate Change Relevance

   * Indicate whether climate change adaptation and/or mitigation allocations are present.
   * Mention their apparent significance relative to other listed project amounts
     (without computing totals).
   * If absent or minimal, state that clearly.

STYLE AND FORMAT:

* 4–6 sentences
* Maximum 140 words
* Formal, neutral, analytical tone
* Citizen-readable but evaluation-focused
* Avoid vague statements

OUTPUT FORMAT (STRICT):
Return JSON only, using this schema:

{
"summary": "string"
}
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


class SummarizationResult:
    """
    Importable container for pipeline chaining.
    """
    def __init__(
        self,
        summary_text: str,
        summary_obj: Dict[str, Any],
        summary_json_str: str,
        usage: Dict[str, Any],
        elapsed_seconds: float,
        model: str,
    ):
        self.summary_text = summary_text
        self.summary_obj = summary_obj
        self.summary_json_str = summary_json_str
        self.usage = usage
        self.elapsed_seconds = elapsed_seconds
        self.model = model


# ----------------------------
# main callable: STRING IN -> SUMMARY OUT
# ----------------------------
def summarize_aip_overall_json_str(
    validated_json_str: str,
    model: str = "gpt-5.2",
    heartbeat_seconds: float = 5.0,  # prints status every N seconds (best-effort)
) -> SummarizationResult:
    """
    Accepts VALIDATED AIP JSON as a string.
    Returns summary as text + JSON string using {"summary": "..."} schema.

    Adds progress monitoring prints + elapsed timer for visibility.
    """
    # Ensure valid JSON before sending
    try:
        validated_obj = json.loads(validated_json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Input is not valid JSON string: {e}") from e

    # Basic shape check (your summary expects projects list)
    if "projects" not in validated_obj or not isinstance(validated_obj["projects"], list):
        raise ValueError("Input JSON must contain top-level 'projects' array.")

    start_ts = time.perf_counter()
    last_beat = start_ts

    def beat(msg: str):
        nonlocal last_beat
        now = time.perf_counter()
        if now - last_beat >= heartbeat_seconds:
            print(f"[SUMMARY] {msg} | elapsed={now - start_ts:.1f}s", flush=True)
            last_beat = now

    print(f"[SUMMARY] Started (model={model})", flush=True)
    beat("Preparing request")

    print("[SUMMARY] Sending request to OpenAI...", flush=True)

    # NOTE: This call is blocking; heartbeat cannot print during the in-flight request
    resp = client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(validated_obj, ensure_ascii=False)},
        ],
        text={"format": {"type": "json_object"}},
    )

    beat("Response received")

    elapsed = round(time.perf_counter() - start_ts, 4)

    out = json.loads(resp.output_text)
    summary_text = (out.get("summary") or "").strip()

    summary_obj = {"summary": summary_text}
    summary_json_str = json.dumps(summary_obj, ensure_ascii=False, indent=2)

    usage = _safe_usage_dict(resp)

    print(f"[SUMMARY] Done ✅ | elapsed={elapsed:.2f}s", flush=True)

    return SummarizationResult(
        summary_text=summary_text,
        summary_obj=summary_obj,
        summary_json_str=summary_json_str,
        usage=usage,
        elapsed_seconds=elapsed,
        model=model,
    )


def attach_summary_to_validated_json_str(
    validated_json_str: str,
    summary_text: str,
) -> str:
    """
    Utility: merges the summary into the validated document, returning a NEW JSON string:
      {"projects": [...], "summary": "..."}
    This mimics your previous file output, but returns a string.
    """
    obj = json.loads(validated_json_str)
    return json.dumps(
        {
            "projects": obj.get("projects", []),
            "summary": summary_text,
        },
        ensure_ascii=False,
        indent=2,
    )
