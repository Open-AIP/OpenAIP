from __future__ import annotations

import os
import tempfile
import traceback
from typing import Any

from openaip_pipeline.adapters.supabase.repositories import PipelineRepository
from openaip_pipeline.core.settings import Settings
from openaip_pipeline.services.categorization.categorize import categorize_from_summarized_json_str
from openaip_pipeline.services.extraction.barangay import run_extraction as run_barangay_extraction
from openaip_pipeline.services.extraction.city import run_extraction as run_city_extraction
from openaip_pipeline.services.rag.rag import answer_with_rag
from openaip_pipeline.services.summarization.summarize import summarize_aip_overall_json_str
from openaip_pipeline.services.validation.barangay import validate_projects_json_str as validate_barangay
from openaip_pipeline.services.validation.city import validate_projects_json_str as validate_city
from openaip_pipeline.worker.progress import clamp_pct, read_positive_float_env, run_with_heartbeat


def _sanitize_error(message: str, settings: Settings) -> str:
    sanitized = message
    for secret in [settings.openai_api_key, settings.supabase_service_key]:
        if secret:
            sanitized = sanitized.replace(secret, "[REDACTED]")
    return sanitized


def _persist_stage_artifact(
    *,
    repo: PipelineRepository,
    run_id: str,
    aip_id: str,
    stage: str,
    payload: dict[str, Any],
    text: str | None,
) -> str:
    return repo.insert_artifact(
        run_id=run_id,
        aip_id=aip_id,
        artifact_type=stage,
        artifact_json=payload,
        artifact_text=text,
    )


def process_run(*, repo: PipelineRepository, settings: Settings, run: dict[str, Any]) -> None:
    run_id = str(run["id"])
    aip_id = str(run["aip_id"])
    model_name = str(run.get("model_name") or settings.pipeline_model)
    current_stage = "extract"
    tmp_pdf_path: str | None = None
    try:
        aip_scope = repo.get_aip_scope(aip_id)
        extraction_fn = run_city_extraction if aip_scope == "city" else run_barangay_extraction
        validation_fn = validate_city if aip_scope == "city" else validate_barangay
        uploaded = repo.get_uploaded_file(run)
        signed_url = repo.client.create_signed_url(uploaded.bucket_id, uploaded.object_name, expires_in=600)
        pdf_bytes = repo.client.download_bytes(signed_url)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_bytes)
            tmp_pdf_path = tmp.name

        repo.set_run_stage(run_id=run_id, stage="extract")

        def extraction_progress(done_pages: int, total_pages: int) -> None:
            if total_pages <= 0:
                return
            pct = clamp_pct((done_pages * 100) / total_pages)
            repo.set_run_progress(
                run_id=run_id,
                stage="extract",
                stage_progress_pct=pct,
                progress_message=f"Extracting page {done_pages}/{total_pages}...",
            )

        extraction_res = extraction_fn(
            tmp_pdf_path,
            model=model_name,
            job_id=run_id,
            aip_id=aip_id,
            uploaded_file_id=uploaded.id,
            on_progress=extraction_progress,
        )
        repo.set_run_progress(run_id=run_id, stage="extract", stage_progress_pct=100, progress_message="Extraction complete.")
        _persist_stage_artifact(
            repo=repo,
            run_id=run_id,
            aip_id=aip_id,
            stage="extract",
            payload=extraction_res.payload,
            text=None,
        )
        repo.upsert_aip_totals(
            aip_id=aip_id,
            totals=extraction_res.payload.get("totals") if isinstance(extraction_res.payload, dict) else [],
        )

        current_stage = "validate"
        repo.set_run_stage(run_id=run_id, stage=current_stage)

        def validation_progress(
            done_projects: int,
            total_projects: int,
            batch_no: int,
            total_batches: int,
            message: str,
        ) -> None:
            pct = 100 if total_projects <= 0 else clamp_pct((done_projects * 100) / total_projects)
            repo.set_run_progress(run_id=run_id, stage=current_stage, stage_progress_pct=pct, progress_message=message)

        validation_res = validation_fn(
            extraction_res.json_str,
            model=model_name,
            num_batches=4,
            on_progress=validation_progress,
        )
        repo.set_run_progress(run_id=run_id, stage=current_stage, stage_progress_pct=100, progress_message="Validation complete.")
        _persist_stage_artifact(
            repo=repo,
            run_id=run_id,
            aip_id=aip_id,
            stage="validate",
            payload=validation_res.validated_obj,
            text=None,
        )

        current_stage = "summarize"
        repo.set_run_stage(run_id=run_id, stage=current_stage)
        summary_res = run_with_heartbeat(
            repo=repo,
            run_id=run_id,
            stage=current_stage,
            expected_seconds=read_positive_float_env("PIPELINE_SUMMARIZE_EXPECTED_SECONDS", 60.0),
            message_prefix="Generating summary",
            fn=lambda: summarize_aip_overall_json_str(validation_res.validated_json_str, model=model_name),
        )
        _persist_stage_artifact(
            repo=repo,
            run_id=run_id,
            aip_id=aip_id,
            stage="summarize",
            payload=summary_res.summary_obj,
            text=summary_res.summary_text,
        )

        current_stage = "categorize"
        repo.set_run_stage(run_id=run_id, stage=current_stage)

        def categorize_progress(
            categorized_count: int,
            total_count: int,
            batch_no: int,
            total_batches: int,
        ) -> None:
            pct = 100 if total_count <= 0 else clamp_pct((categorized_count * 100) / total_count)
            repo.set_run_progress(
                run_id=run_id,
                stage=current_stage,
                stage_progress_pct=pct,
                progress_message=(
                    f"Categorizing projects {categorized_count}/{total_count} "
                    f"(batch {batch_no}/{total_batches})..."
                ),
            )

        categorized_res = categorize_from_summarized_json_str(
            summary_res.summary_json_str,
            model=model_name,
            batch_size=settings.batch_size,
            on_progress=categorize_progress,
        )
        repo.set_run_progress(
            run_id=run_id,
            stage=current_stage,
            stage_progress_pct=100,
            progress_message="Categorization complete. Saving artifacts...",
        )
        categorize_artifact_id = _persist_stage_artifact(
            repo=repo,
            run_id=run_id,
            aip_id=aip_id,
            stage="categorize",
            payload=categorized_res.categorized_obj,
            text=summary_res.summary_text,
        )
        repo.upsert_projects(
            aip_id=aip_id,
            extraction_artifact_id=categorize_artifact_id,
            projects=categorized_res.categorized_obj.get("projects", []),
        )

        if settings.enable_rag:
            rag_query = os.getenv("PIPELINE_RAG_TRACE_QUERY", "").strip()
            if rag_query:
                rag_trace = answer_with_rag(
                    supabase_url=settings.supabase_url,
                    supabase_service_key=settings.supabase_service_key,
                    openai_api_key=settings.openai_api_key,
                    embeddings_model=settings.embedding_model,
                    chat_model=model_name,
                    question=rag_query,
                    metadata_filter={"aip_id": aip_id, "run_id": run_id},
                )
                _persist_stage_artifact(
                    repo=repo,
                    run_id=run_id,
                    aip_id=aip_id,
                    stage="embed",
                    payload={"rag_trace": rag_trace},
                    text=None,
                )

        repo.set_run_progress(
            run_id=run_id,
            stage=current_stage,
            stage_progress_pct=100,
            progress_message="Finalizing processing run. Redirecting shortly...",
        )
        repo.set_run_succeeded(run_id=run_id)
        print(f"[WORKER] run {run_id} succeeded")
    except Exception as error:
        trace_summary = "".join(traceback.format_exception(type(error), error, error.__traceback__))
        sanitized_trace = _sanitize_error(trace_summary, settings)
        sanitized_message = _sanitize_error(str(error), settings)
        try:
            _persist_stage_artifact(
                repo=repo,
                run_id=run_id,
                aip_id=aip_id,
                stage=current_stage if current_stage in {"extract", "validate", "summarize", "categorize", "embed"} else "extract",
                payload={
                    "error": sanitized_message,
                    "trace_summary": sanitized_trace[:8000],
                },
                text=None,
            )
        except Exception:
            pass
        repo.set_run_failed(run_id=run_id, stage=current_stage, error_message=sanitized_message)
        print(f"[WORKER] run {run_id} failed: {sanitized_message}")
    finally:
        if tmp_pdf_path and os.path.exists(tmp_pdf_path):
            try:
                os.remove(tmp_pdf_path)
            except OSError:
                pass
