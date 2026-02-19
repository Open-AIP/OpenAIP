from __future__ import annotations

import json
import os
import time
import tempfile
import re
from typing import Callable, List, Optional, Union, Tuple, Dict, Any

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, Field, field_validator
from pypdf import PdfReader, PdfWriter


# ----------------------------
# 0) Client / config
# ----------------------------
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY not found. Put it in your .env file.")

client = OpenAI(api_key=api_key)


# ----------------------------
# helpers
# ----------------------------
def extract_single_page_pdf(original_pdf_path: str, page_index: int) -> str:
    reader = PdfReader(original_pdf_path)
    if len(reader.pages) == 0:
        raise ValueError("PDF has no pages")
    if page_index < 0 or page_index >= len(reader.pages):
        raise IndexError(f"page_index out of range: {page_index}")

    writer = PdfWriter()
    writer.add_page(reader.pages[page_index])

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    with open(temp_file.name, "wb") as f:
        writer.write(f)

    return temp_file.name


def _to_float_or_none(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)

    s = str(v).strip()
    s = s.replace("\u00A0", " ").replace("\u202F", " ").strip()

    if s == "" or s.lower() in {"n/a", "na", "none"} or s in {"-", "—", "–"}:
        return None

    m = re.fullmatch(r"\(?\s*([0-9]+(?:\.[0-9]+)?)\s*%\s*\)?", s)
    if m:
        return float(m.group(1))

    s = (
        s.replace("₱", "")
        .replace("PHP", "")
        .replace("Php", "")
        .replace(",", "")
        .replace(" ", "")
        .strip()
    )

    neg = s.startswith("(") and s.endswith(")")
    if neg:
        s = s[1:-1].strip()

    try:
        x = float(s)
        return -x if neg else x
    except ValueError:
        return None


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


# ----------------------------
# 1) Schema
# ----------------------------
AmountLike = Optional[Union[float, int, str]]


class BrgyAIPProjectRow(BaseModel):
    aip_ref_code: Optional[str] = None
    program_project_description: Optional[str] = None
    implementing_agency: Optional[str] = None
    start_date: Optional[str] = None
    completion_date: Optional[str] = None
    expected_output: Optional[str] = None
    source_of_funds: Optional[str] = None

    personal_services: AmountLike = None
    maintenance_and_other_operating_expenses: AmountLike = None
    financial_expenses: AmountLike = None
    capital_outlay: AmountLike = None
    total: AmountLike = None

    errors: Optional[None] = None
    category: Optional[None] = None

    @field_validator(
        "personal_services",
        "maintenance_and_other_operating_expenses",
        "financial_expenses",
        "capital_outlay",
        "total",
        mode="before",
    )
    @classmethod
    def _coerce_amounts(cls, v):
        return _to_float_or_none(v)

    @field_validator("errors", mode="before")
    @classmethod
    def _force_errors_null(cls, v):
        return None

    @field_validator("category", mode="before")
    @classmethod
    def _force_category_null(cls, v):
        return None


class BrgyAIPExtraction(BaseModel):
    projects: List[BrgyAIPProjectRow] = Field(default_factory=list)


# ----------------------------
# 2) Extractor (returns object + dict + json string)
# ----------------------------
class ExtractionResult(BaseModel):
    """
    Standardized payload you can pass to validation/summarization/categorization.
    """
    job_id: Optional[str] = None
    model: str
    source_pdf: str
    extracted: BrgyAIPExtraction
    usage: Dict[str, Any]
    payload: Dict[str, Any]
    json_str: str


def _enforce_nulls(payload: Dict[str, Any]) -> Dict[str, Any]:
    for row in payload.get("projects", []):
        row["errors"] = None
        row["category"] = None
    return payload


def extract_brgy_aip_from_pdf_page(
    pdf_path: str,
    page_index: int,
    total_pages: int,
    model: str = "gpt-5.2",
) -> Tuple[BrgyAIPExtraction, Dict[str, Any]]:
    t0 = time.time()

    def stamp(msg: str):
        print(f"[EXTRACTION] [{time.time() - t0:6.1f}s] {msg}", flush=True)

    stamp(f"Preparing page {page_index + 1}/{total_pages}...")

    page_pdf = extract_single_page_pdf(pdf_path, page_index)

    stamp(f"Uploading page {page_index + 1}/{total_pages}...")
    with open(page_pdf, "rb") as f:
        uploaded = client.files.create(file=f, purpose="user_data")
    stamp(f"Upload done (file_id={uploaded.id})")

    stamp(f"Calling model for page {page_index + 1}/{total_pages}...")
    response = client.responses.parse(
        model=model,
        input=[
            {
                "role": "system",
                "content": (
                    "Extract ONLY what is explicitly present in the PDF page. "
                    "If missing/unreadable, set null. Do not invent values."
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "input_file", "file_id": uploaded.id},
                    {
                        "type": "input_text",
                        "text": (
                            "Extract ONLY the AIP PROJECT rows from the table on this page.\n"
                            "BARANGAY TABLE NOTE: This table ends at Total and includes Financial Expenses (FE) between MOOE and CO.\n\n"
                            "Return projects with fields (MUST match exactly):\n"
                            "aip_ref_code, program_project_description, implementing_agency, start_date, completion_date, "
                            "expected_output, source_of_funds, personal_services, maintenance_and_other_operating_expenses, "
                            "financial_expenses, capital_outlay, total, errors, category.\n\n"
                            "PROJECT-ONLY RULES (STRICT):\n"
                            "- Output ONLY rows that represent a real project entry.\n"
                            "- EXCLUDE headers/labels/section titles, repeated headings, totals/subtotals/grand totals, continuation notes.\n\n"
                            "ANTI-COLUMN-SWITCHING RULES (VERY IMPORTANT):\n"
                            "- DO NOT shift values between columns. Preserve the table's column boundaries exactly.\n"
                            "- Column order for amounts is STRICT and must be read left-to-right:\n"
                            "  PS -> MOOE -> FINANCIAL EXPENSES (FE) -> CAPITAL OUTLAY (CO) -> TOTAL\n"
                            "- Map ONLY by the printed column headers/grid:\n"
                            "  • personal_services <- PS ONLY\n"
                            "  • maintenance_and_other_operating_expenses <- MOOE ONLY\n"
                            "  • financial_expenses <- Financial Expenses / FE ONLY\n"
                            "  • capital_outlay <- CO / Capital Outlay ONLY\n"
                            "  • total <- Total ONLY\n"
                            "- If FE exists on this page, DO NOT place FE amounts into MOOE or CO.\n"
                            "- If any of the MOOE/FE/CO placements are unclear due to scan/blur, set ALL THREE (MOOE, FE, CO) to null.\n"
                            "- Never guess the correct column based on arithmetic.\n"
                            "- Dates must come ONLY from Start Date / Completion Date columns; do not swap.\n\n"
                            "OTHER RULES:\n"
                            "- errors MUST always be null.\n"
                            "- category MUST always be null.\n"
                            "- If there is no project table on this page, return an empty projects array.\n"
                        ),
                    },
                ],
            },
        ],
        text_format=BrgyAIPExtraction,
        temperature=0,
    )

    try:
        os.remove(page_pdf)
    except Exception:
        pass

    parsed: BrgyAIPExtraction = response.output_parsed
    usage_dict = _safe_usage_dict(response)

    stamp(f"Page {page_index + 1}/{total_pages} done. Extracted {len(parsed.projects)} project(s).")
    return parsed, usage_dict


def extract_brgy_aip_from_pdf_all_pages(
    pdf_path: str,
    model: str = "gpt-5.2",
    on_progress: Optional[Callable[[int, int], None]] = None,
) -> Tuple[BrgyAIPExtraction, Dict[str, Any]]:
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    if total_pages == 0:
        raise ValueError("PDF has no pages")

    print(f"[EXTRACTION] PDF pages detected: {total_pages}", flush=True)

    merged = BrgyAIPExtraction(projects=[])
    usage_total: Dict[str, Any] = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}

    for i in range(total_pages):
        page_data, page_usage = extract_brgy_aip_from_pdf_page(
            pdf_path,
            page_index=i,
            total_pages=total_pages,
            model=model,
        )
        merged.projects.extend(page_data.projects)

        for k in ["input_tokens", "output_tokens", "total_tokens"]:
            v = page_usage.get(k)
            if isinstance(v, int) and isinstance(usage_total.get(k), int):
                usage_total[k] += v
            else:
                usage_total[k] = None

        print(f"[EXTRACTION] Completed page {i + 1}/{total_pages}", flush=True)
        if on_progress:
            on_progress(i + 1, total_pages)

    return merged, usage_total


def run_extraction(
    pdf_path: str,
    model: str = "gpt-5.2",
    job_id: Optional[str] = None,
    on_progress: Optional[Callable[[int, int], None]] = None,
) -> ExtractionResult:
    """
    Main entrypoint for other pipeline stages.
    Returns:
      - extracted: Pydantic object
      - payload: dict
      - json_str: JSON string
      - usage: token usage
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    start_ts = time.perf_counter()
    print(f"[EXTRACTION] Started (model={model})", flush=True)

    extracted, usage = extract_brgy_aip_from_pdf_all_pages(
        pdf_path,
        model=model,
        on_progress=on_progress,
    )

    payload = extracted.model_dump()
    payload = _enforce_nulls(payload)
    json_str = json.dumps(payload, indent=2, ensure_ascii=False)

    elapsed = round(time.perf_counter() - start_ts, 4)
    print(f"[EXTRACTION] Done ✅ | elapsed={elapsed:.2f}s | projects={len(payload.get('projects', []))}", flush=True)

    return ExtractionResult(
        job_id=job_id,
        model=model,
        source_pdf=pdf_path,
        extracted=extracted,
        usage=usage,
        payload=payload,
        json_str=json_str,
    )
