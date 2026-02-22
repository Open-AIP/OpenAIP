from __future__ import annotations

import json
import os
import traceback
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from openaip_pipeline.adapters.supabase.client import SupabaseRestClient
from openaip_pipeline.adapters.supabase.repositories import PipelineRepository
from openaip_pipeline.core.settings import Settings
from openaip_pipeline.services.categorization.categorize import (
    categorize_from_summarized_json_str,
    write_categorized_json_file,
)
from openaip_pipeline.services.extraction.barangay import run_extraction as run_barangay_extraction
from openaip_pipeline.services.extraction.city import run_extraction as run_city_extraction
from openaip_pipeline.services.summarization.summarize import (
    attach_summary_to_validated_json_str,
    summarize_aip_overall_json_str,
)
from openaip_pipeline.services.validation.barangay import validate_projects_json_str as validate_barangay
from openaip_pipeline.services.validation.city import validate_projects_json_str as validate_city

router = APIRouter(prefix="/v1/runs", tags=["runs"])


class EnqueueRunRequest(BaseModel):
    aip_id: str
    uploaded_file_id: str | None = None
    model_name: str = "gpt-5.2"
    created_by: str | None = None


class EnqueueRunResponse(BaseModel):
    run_id: str
    status: str


class LocalRunRequest(BaseModel):
    pdf_path: str
    scope: str = Field("barangay", pattern="^(barangay|city)$")
    model: str = "gpt-5.2"
    batch_size: int = Field(25, ge=1, le=200)


class LocalRunResponse(BaseModel):
    run_id: str
    output_file: str
    summary: str
    usage: dict[str, Any]


def _repo() -> PipelineRepository:
    settings = Settings.load(require_supabase=True, require_openai=False)
    client = SupabaseRestClient.from_settings(settings)
    return PipelineRepository(client)


@router.post("/enqueue", response_model=EnqueueRunResponse)
def enqueue_run(req: EnqueueRunRequest) -> EnqueueRunResponse:
    try:
        row = _repo().enqueue_run(
            aip_id=req.aip_id,
            uploaded_file_id=req.uploaded_file_id,
            model_name=req.model_name,
            created_by=req.created_by,
        )
        return EnqueueRunResponse(run_id=row.id, status=row.status)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/{run_id}")
def get_run_status(run_id: str) -> dict[str, Any]:
    row = _repo().get_run(run_id)
    if not row:
        raise HTTPException(status_code=404, detail="Run not found.")
    return row


@router.post("/dev/local", response_model=LocalRunResponse)
def run_local(req: LocalRunRequest) -> LocalRunResponse:
    settings = Settings.load(require_openai=True, require_supabase=False)
    if not settings.dev_routes:
        raise HTTPException(status_code=403, detail="Dev routes are disabled.")
    if not os.path.exists(req.pdf_path):
        raise HTTPException(status_code=404, detail=f"PDF not found: {req.pdf_path}")
    run_id = str(uuid.uuid4())
    usage: dict[str, Any] = {}
    try:
        if req.scope == "city":
            extraction_res = run_city_extraction(req.pdf_path, model=req.model, job_id=run_id)
            validation_res = validate_city(extraction_res.json_str, model=req.model)
        else:
            extraction_res = run_barangay_extraction(req.pdf_path, model=req.model, job_id=run_id)
            validation_res = validate_barangay(extraction_res.json_str, model=req.model)
        usage["extraction"] = extraction_res.usage
        usage["validation"] = validation_res.usage
        summary_res = summarize_aip_overall_json_str(validation_res.validated_json_str, model=req.model)
        usage["summarization"] = summary_res.usage
        summarized_doc = attach_summary_to_validated_json_str(validation_res.validated_json_str, summary_res.summary_text)
        categorized_res = categorize_from_summarized_json_str(
            summarized_doc,
            model=req.model,
            batch_size=req.batch_size,
        )
        usage["categorization"] = categorized_res.usage
        out_dir = Path("data/outputs")
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"aip_categorized.{run_id}.json"
        write_categorized_json_file(categorized_res.categorized_json_str, str(out_path))
        return LocalRunResponse(
            run_id=run_id,
            output_file=str(out_path),
            summary=summary_res.summary_text,
            usage=usage,
        )
    except HTTPException:
        raise
    except Exception as error:
        traceback_text = "".join(traceback.format_exception(type(error), error, error.__traceback__))
        raise HTTPException(
            status_code=500,
            detail=json.dumps({"error": str(error), "traceback": traceback_text}),
        ) from error

