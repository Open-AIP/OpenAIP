from __future__ import annotations

import json
import os
import re
import tempfile
import time
from typing import Any, Callable

from openai import OpenAI
from pydantic import BaseModel, Field, field_validator
from pypdf import PdfReader, PdfWriter

from openaip_pipeline.core.resources import read_text
from openaip_pipeline.services.openai_utils import build_openai_client, safe_usage_dict


AmountLike = float | int | str | None


def _to_float_or_none(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if text == "" or text.lower() in {"n/a", "na", "none"} or text in {"-", "—", "–"}:
        return None
    percent_match = re.fullmatch(r"\(?\s*([0-9]+(?:\.[0-9]+)?)\s*%\s*\)?", text)
    if percent_match:
        return float(percent_match.group(1))
    text = (
        text.replace("₱", "")
        .replace("PHP", "")
        .replace("Php", "")
        .replace(",", "")
        .replace(" ", "")
        .strip()
    )
    neg = text.startswith("(") and text.endswith(")")
    if neg:
        text = text[1:-1].strip()
    try:
        parsed = float(text)
    except ValueError:
        return None
    return -parsed if neg else parsed


def _blank_to_none(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if text == "" or text.lower() in {"n/a", "na", "none"} or text in {"-", "—", "–"}:
        return None
    return text


class CityAIPProjectRow(BaseModel):
    aip_ref_code: str | None = None
    program_project_description: str | None = None
    implementing_agency: str | None = None
    start_date: str | None = None
    completion_date: str | None = None
    expected_output: str | None = None
    source_of_funds: str | None = None
    personal_services: AmountLike = None
    maintenance_and_other_operating_expenses: AmountLike = None
    capital_outlay: AmountLike = None
    total: AmountLike = None
    climate_change_adaptation: AmountLike = None
    climate_change_mitigation: AmountLike = None
    cc_topology_code: str | None = None
    prm_ncr_lgu_rm_objective_results_indicator: str | None = None
    errors: None = None
    category: None = None

    @field_validator(
        "personal_services",
        "maintenance_and_other_operating_expenses",
        "capital_outlay",
        "total",
        "climate_change_adaptation",
        "climate_change_mitigation",
        mode="before",
    )
    @classmethod
    def _coerce_amounts(cls, value: Any) -> float | None:
        return _to_float_or_none(value)

    @field_validator("cc_topology_code", mode="before")
    @classmethod
    def _coerce_cc_topology_code(cls, value: Any) -> str | None:
        return _blank_to_none(value)

    @field_validator("prm_ncr_lgu_rm_objective_results_indicator", mode="before")
    @classmethod
    def _coerce_combined(cls, value: Any) -> str | None:
        return _blank_to_none(value)

    @field_validator("errors", mode="before")
    @classmethod
    def _force_errors_null(cls, _value: Any) -> None:
        return None

    @field_validator("category", mode="before")
    @classmethod
    def _force_category_null(cls, _value: Any) -> None:
        return None


class CityAIPExtraction(BaseModel):
    projects: list[CityAIPProjectRow] = Field(default_factory=list)


class ExtractionResult(BaseModel):
    job_id: str | None = None
    model: str
    source_pdf: str
    extracted: CityAIPExtraction
    usage: dict[str, Any]
    payload: dict[str, Any]
    json_str: str


def extract_single_page_pdf(original_pdf_path: str, page_index: int) -> str:
    reader = PdfReader(original_pdf_path)
    if len(reader.pages) == 0:
        raise ValueError("PDF has no pages")
    if page_index < 0 or page_index >= len(reader.pages):
        raise IndexError(f"page_index out of range: {page_index}")
    writer = PdfWriter()
    writer.add_page(reader.pages[page_index])
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    with open(temp_file.name, "wb") as file_handle:
        writer.write(file_handle)
    return temp_file.name


def _enforce_nulls(payload: dict[str, Any]) -> dict[str, Any]:
    for row in payload.get("projects", []):
        row["errors"] = None
        row["category"] = None
    return payload


def extract_city_aip_from_pdf_page(
    *,
    client: OpenAI,
    pdf_path: str,
    page_index: int,
    total_pages: int,
    model: str,
    system_prompt: str,
    user_prompt: str,
) -> tuple[CityAIPExtraction, dict[str, Any]]:
    page_pdf = extract_single_page_pdf(pdf_path, page_index)
    with open(page_pdf, "rb") as file_handle:
        uploaded = client.files.create(file=file_handle, purpose="user_data")
    response = client.responses.parse(
        model=model,
        input=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "input_file", "file_id": uploaded.id},
                    {"type": "input_text", "text": user_prompt},
                ],
            },
        ],
        text_format=CityAIPExtraction,
        temperature=0,
    )
    try:
        os.remove(page_pdf)
    except OSError:
        pass
    parsed: CityAIPExtraction = response.output_parsed
    return parsed, safe_usage_dict(response)


def extract_city_aip_from_pdf_all_pages(
    *,
    client: OpenAI,
    pdf_path: str,
    model: str,
    on_progress: Callable[[int, int], None] | None,
) -> tuple[CityAIPExtraction, dict[str, Any]]:
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    if total_pages == 0:
        raise ValueError("PDF has no pages")
    merged = CityAIPExtraction(projects=[])
    usage_total: dict[str, Any] = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}
    system_prompt = read_text("prompts/extraction/city_system.txt")
    user_prompt = read_text("prompts/extraction/city_user.txt")
    for index in range(total_pages):
        page_data, page_usage = extract_city_aip_from_pdf_page(
            client=client,
            pdf_path=pdf_path,
            page_index=index,
            total_pages=total_pages,
            model=model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )
        merged.projects.extend(page_data.projects)
        for key in ["input_tokens", "output_tokens", "total_tokens"]:
            value = page_usage.get(key)
            if isinstance(value, int) and isinstance(usage_total.get(key), int):
                usage_total[key] += value
            else:
                usage_total[key] = None
        if on_progress:
            on_progress(index + 1, total_pages)
    return merged, usage_total


def run_extraction(
    pdf_path: str,
    model: str = "gpt-5.2",
    job_id: str | None = None,
    on_progress: Callable[[int, int], None] | None = None,
    client: OpenAI | None = None,
) -> ExtractionResult:
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    resolved_client = client or build_openai_client()
    start_ts = time.perf_counter()
    extracted, usage = extract_city_aip_from_pdf_all_pages(
        client=resolved_client,
        pdf_path=pdf_path,
        model=model,
        on_progress=on_progress,
    )
    payload = _enforce_nulls(extracted.model_dump(mode="python"))
    json_str = json.dumps(payload, indent=2, ensure_ascii=False)
    elapsed = round(time.perf_counter() - start_ts, 4)
    print(f"[EXTRACTION][CITY] elapsed={elapsed:.2f}s projects={len(payload.get('projects', []))}", flush=True)
    return ExtractionResult(
        job_id=job_id,
        model=model,
        source_pdf=pdf_path,
        extracted=extracted,
        usage=usage,
        payload=payload,
        json_str=json_str,
    )

