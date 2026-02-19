from __future__ import annotations

import os
import time
import uuid
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from extraction import run_extraction
from rule_based_validation import validate_projects_json_str
from summarization import summarize_aip_overall_json_str, attach_summary_to_validated_json_str
from categorization import categorize_from_summarized_json_str, write_categorized_json_file


app = FastAPI(title="AIP Pipeline Service", version="1.0.0")


# ----------------------------
# Models
# ----------------------------
class PipelineRequest(BaseModel):
    pdf_path: str = Field(..., description="Local file path to the PDF on this server.")
    batch_size: int = Field(25, ge=1, le=200)
    model: str = Field("gpt-5.2", description="Model name used across stages.")
    output_dir: str = Field("outputs", description="Directory where final categorized JSON is saved.")


class PipelineResponse(BaseModel):
    job_id: str
    status: str
    output_file: str
    usage: Dict[str, Any]
    timings: Dict[str, float]
    summary: str


# ----------------------------
# Health
# ----------------------------
@app.get("/")
def root():
    return {"status": "ok", "message": "Pipeline API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# ----------------------------
# Run pipeline (sync)
# ----------------------------
@app.post("/v1/pipeline/run", response_model=PipelineResponse)
def run_pipeline(req: PipelineRequest):
    pdf_path = req.pdf_path

    # Validate path exists (server-side)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail=f"PDF not found: {pdf_path}")

    job_id = str(uuid.uuid4())
    t0 = time.perf_counter()

    timings: Dict[str, float] = {}
    usage: Dict[str, Any] = {}

    # 1) Extraction
    t_stage = time.perf_counter()
    extraction_res = run_extraction(pdf_path, model=req.model, job_id=job_id)
    timings["extraction_s"] = round(time.perf_counter() - t_stage, 4)
    usage["extraction"] = extraction_res.usage
    extraction_json_str = extraction_res.json_str

    # 2) Validation
    t_stage = time.perf_counter()
    validation_res = validate_projects_json_str(extraction_json_str, model=req.model)
    timings["validation_s"] = round(time.perf_counter() - t_stage, 4)
    usage["validation"] = validation_res.usage
    validated_json_str = validation_res.validated_json_str

    # 3) Summarization
    t_stage = time.perf_counter()
    summary_res = summarize_aip_overall_json_str(validated_json_str, model=req.model)
    timings["summarization_s"] = round(time.perf_counter() - t_stage, 4)
    usage["summarization"] = summary_res.usage

    summarized_doc_str = attach_summary_to_validated_json_str(
        validated_json_str,
        summary_res.summary_text
    )

    # 4) Categorization
    t_stage = time.perf_counter()
    cat_res = categorize_from_summarized_json_str(
        summarized_doc_str,
        model=req.model,
        batch_size=req.batch_size
    )
    timings["categorization_s"] = round(time.perf_counter() - t_stage, 4)
    usage["categorization"] = cat_res.usage

    # 5) Write final JSON
    out_dir = Path(req.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"aip_categorized.{job_id}.json"
    write_categorized_json_file(cat_res.categorized_json_str, str(out_path))

    timings["total_s"] = round(time.perf_counter() - t0, 4)

    return PipelineResponse(
        job_id=job_id,
        status="done",
        output_file=str(out_path),
        usage=usage,
        timings=timings,
        summary=summary_res.summary_text,
    )
