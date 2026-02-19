from __future__ import annotations

import os
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional

from dotenv import load_dotenv

from categorization import categorize_from_summarized_json_str
from extraction import run_extraction
from rule_based_validation import validate_projects_json_str
from summarization import (
    attach_summary_to_validated_json_str,
    summarize_aip_overall_json_str,
)
from supabase_client import SupabaseRestClient

load_dotenv()

ACTIVE_STAGE_ORDER = ["extract", "validate", "summarize", "categorize"]
STAGE_WEIGHTS: Dict[str, int] = {
    "extract": 40,
    "validate": 20,
    "summarize": 15,
    "categorize": 25,
}
STAGE_START_MESSAGES: Dict[str, str] = {
    "extract": "Starting extraction...",
    "validate": "Starting validation...",
    "summarize": "Starting summarization...",
    "categorize": "Starting categorization...",
}
HEARTBEAT_INTERVAL_SECONDS = 5.0
HEARTBEAT_STAGE_CAP_PCT = 95


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_positive_float_env(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        value = float(raw)
    except ValueError:
        return default
    return value if value > 0 else default


def clamp_pct(value: float) -> int:
    return max(0, min(100, int(round(value))))


def compute_overall_pct(stage: str, stage_progress_pct: int) -> int:
    stage_progress_pct = clamp_pct(stage_progress_pct)
    if stage not in STAGE_WEIGHTS:
        return 100 if stage_progress_pct >= 100 else 0

    completed_weight = 0.0
    for ordered_stage in ACTIVE_STAGE_ORDER:
        if ordered_stage == stage:
            break
        completed_weight += STAGE_WEIGHTS[ordered_stage]

    current_weight = STAGE_WEIGHTS[stage]
    overall = completed_weight + (current_weight * (stage_progress_pct / 100.0))
    return clamp_pct(overall)


def set_run_progress(
    client: SupabaseRestClient,
    run_id: str,
    stage: str,
    stage_progress_pct: int,
    progress_message: Optional[str] = None,
) -> None:
    patch: Dict[str, Any] = {
        "stage": stage,
        "status": "running",
        "stage_progress_pct": clamp_pct(stage_progress_pct),
        "overall_progress_pct": compute_overall_pct(stage, stage_progress_pct),
        "progress_updated_at": now_utc_iso(),
    }
    if progress_message is not None:
        patch["progress_message"] = progress_message
    client.update("extraction_runs", patch, filters={"id": f"eq.{run_id}"})


def assert_progress_tracking_ready(client: SupabaseRestClient) -> None:
    # Fail fast if progress columns are unavailable on the target database.
    try:
        client.select(
            "extraction_runs",
            select=(
                "id,overall_progress_pct,stage_progress_pct,progress_message,"
                "progress_updated_at"
            ),
            order="created_at.desc",
            limit=1,
        )
    except Exception as error:
        raise RuntimeError(
            "Progress tracking columns are unavailable or unreadable in extraction_runs. "
            "Apply migration website/docs/sql/2026-02-19_extraction_run_progress.sql "
            "before starting the worker."
        ) from error


def to_float_or_none(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    if not s:
        return None
    s = s.replace("\u20b1", "").replace(",", "").replace(" ", "")
    if s.startswith("(") and s.endswith(")"):
        s = "-" + s[1:-1]
    try:
        return float(s)
    except ValueError:
        return None


def map_category(value: Any) -> str:
    if not isinstance(value, str):
        return "other"
    lowered = value.strip().lower()
    if lowered == "healthcare":
        return "health"
    if lowered == "infrastructure":
        return "infrastructure"
    return "other"


def normalize_errors(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, list):
        return [str(x) for x in value]
    if isinstance(value, str):
        return [value]
    return value


def claim_next_queued_run(client: SupabaseRestClient) -> Optional[Dict[str, Any]]:
    rows = client.select(
        "extraction_runs",
        select="id,aip_id,uploaded_file_id,model_name,status,stage,created_at",
        filters={"status": "eq.queued"},
        order="created_at.asc",
        limit=1,
    )
    if not rows:
        return None

    candidate = rows[0]
    claimed = client.update(
        "extraction_runs",
        {
            "status": "running",
            "stage": "extract",
            "started_at": now_utc_iso(),
            "finished_at": None,
            "error_code": None,
            "error_message": None,
            "overall_progress_pct": 0,
            "stage_progress_pct": 0,
            "progress_message": "Starting extraction...",
            "progress_updated_at": now_utc_iso(),
        },
        filters={"id": f"eq.{candidate['id']}", "status": "eq.queued"},
        select="id,aip_id,uploaded_file_id,model_name,status,stage,created_at",
    )
    if not claimed:
        return None
    return claimed[0]


def get_uploaded_file(client: SupabaseRestClient, run: Dict[str, Any]) -> Dict[str, Any]:
    uploaded_file_id = run.get("uploaded_file_id")
    if uploaded_file_id:
        rows = client.select(
            "uploaded_files",
            select="id,aip_id,bucket_id,object_name,original_file_name",
            filters={"id": f"eq.{uploaded_file_id}"},
            limit=1,
        )
        if rows:
            return rows[0]

    aip_id = run["aip_id"]
    rows = client.select(
        "uploaded_files",
        select="id,aip_id,bucket_id,object_name,original_file_name,created_at",
        filters={"aip_id": f"eq.{aip_id}", "is_current": "eq.true"},
        order="created_at.desc",
        limit=1,
    )
    if not rows:
        raise RuntimeError("No uploaded file found for extraction run.")
    return rows[0]


def set_run_failed(client: SupabaseRestClient, run_id: str, stage: str, error: Exception) -> None:
    client.update(
        "extraction_runs",
        {
            "status": "failed",
            "stage": stage,
            "finished_at": now_utc_iso(),
            "error_message": str(error),
            "progress_message": str(error),
            "progress_updated_at": now_utc_iso(),
        },
        filters={"id": f"eq.{run_id}"},
    )


def set_run_succeeded(client: SupabaseRestClient, run_id: str) -> None:
    client.update(
        "extraction_runs",
        {
            "status": "succeeded",
            "stage": "categorize",
            "finished_at": now_utc_iso(),
            "error_code": None,
            "error_message": None,
            "overall_progress_pct": 100,
            "stage_progress_pct": 100,
            "progress_message": None,
            "progress_updated_at": now_utc_iso(),
        },
        filters={"id": f"eq.{run_id}"},
    )


def set_run_stage(client: SupabaseRestClient, run_id: str, stage: str) -> None:
    set_run_progress(
        client,
        run_id,
        stage,
        0,
        STAGE_START_MESSAGES.get(stage, f"Starting {stage}..."),
    )


def run_with_heartbeat(
    *,
    client: SupabaseRestClient,
    run_id: str,
    stage: str,
    expected_seconds: float,
    message_prefix: str,
    fn: Callable[[], Any],
) -> Any:
    expected_seconds = max(1.0, expected_seconds)
    heartbeat_interval = read_positive_float_env(
        "PIPELINE_PROGRESS_HEARTBEAT_SECONDS",
        HEARTBEAT_INTERVAL_SECONDS,
    )
    heartbeat_interval = max(1.0, heartbeat_interval)

    started = time.perf_counter()
    last_write = 0.0

    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(fn)
        while not future.done():
            now = time.perf_counter()
            elapsed = now - started
            estimated = (elapsed / expected_seconds) * HEARTBEAT_STAGE_CAP_PCT
            stage_pct = clamp_pct(max(1, min(HEARTBEAT_STAGE_CAP_PCT, estimated)))

            if now - last_write >= heartbeat_interval:
                set_run_progress(
                    client,
                    run_id,
                    stage,
                    stage_pct,
                    f"{message_prefix} ({stage_pct}%)",
                )
                last_write = now

            time.sleep(0.5)

        result = future.result()

    set_run_progress(client, run_id, stage, 100, f"{message_prefix} complete.")
    return result


def insert_artifact(
    client: SupabaseRestClient,
    *,
    run_id: str,
    aip_id: str,
    artifact_type: str,
    artifact_json: Any,
    artifact_text: Optional[str] = None,
) -> str:
    rows = client.insert(
        "extraction_artifacts",
        {
            "run_id": run_id,
            "aip_id": aip_id,
            "artifact_type": artifact_type,
            "artifact_json": artifact_json,
            "artifact_text": artifact_text,
        },
        select="id",
    )
    if not rows:
        raise RuntimeError(f"Failed to insert artifact: {artifact_type}")
    return rows[0]["id"]


def upsert_projects(
    client: SupabaseRestClient,
    *,
    aip_id: str,
    extraction_artifact_id: str,
    projects: Any,
) -> None:
    if not isinstance(projects, list):
        return

    existing_rows = client.select(
        "projects",
        select="id,aip_ref_code,is_human_edited",
        filters={"aip_id": f"eq.{aip_id}"},
    )
    existing_by_ref = {
        row["aip_ref_code"]: row
        for row in existing_rows
        if isinstance(row.get("aip_ref_code"), str) and row.get("aip_ref_code")
    }

    for raw in projects:
        if not isinstance(raw, dict):
            continue
        ref_code = str(raw.get("aip_ref_code") or "").strip()
        if not ref_code:
            continue

        existing = existing_by_ref.get(ref_code)
        if existing and bool(existing.get("is_human_edited")):
            # Preserve human-edited rows on rerun.
            continue

        payload = {
            "extraction_artifact_id": extraction_artifact_id,
            "aip_ref_code": ref_code,
            "program_project_description": str(
                raw.get("program_project_description") or "Unspecified project"
            ),
            "implementing_agency": raw.get("implementing_agency"),
            "start_date": raw.get("start_date"),
            "completion_date": raw.get("completion_date"),
            "expected_output": raw.get("expected_output"),
            "source_of_funds": raw.get("source_of_funds"),
            "personal_services": to_float_or_none(raw.get("personal_services")),
            "maintenance_and_other_operating_expenses": to_float_or_none(
                raw.get("maintenance_and_other_operating_expenses")
            ),
            "financial_expenses": to_float_or_none(raw.get("financial_expenses")),
            "capital_outlay": to_float_or_none(raw.get("capital_outlay")),
            "total": to_float_or_none(raw.get("total")),
            "climate_change_adaptation": raw.get("climate_change_adaptation"),
            "climate_change_mitigation": raw.get("climate_change_mitigation"),
            "cc_topology_code": raw.get("cc_topology_code"),
            "errors": normalize_errors(raw.get("errors")),
            "category": map_category(raw.get("category")),
        }

        if existing:
            client.update(
                "projects",
                payload,
                filters={"id": f"eq.{existing['id']}"},
            )
            continue

        create_payload = dict(payload)
        create_payload["aip_id"] = aip_id
        client.insert("projects", create_payload)


def process_run(client: SupabaseRestClient, run: Dict[str, Any]) -> None:
    run_id = run["id"]
    aip_id = run["aip_id"]
    model_name = run.get("model_name") or os.getenv("PIPELINE_MODEL", "gpt-5.2")

    current_stage = "extract"
    tmp_pdf_path = None
    try:
        uploaded = get_uploaded_file(client, run)
        signed_url = client.create_signed_url(uploaded["bucket_id"], uploaded["object_name"], expires_in=600)
        pdf_bytes = client.download_bytes(signed_url)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_bytes)
            tmp_pdf_path = tmp.name

        set_run_stage(client, run_id, "extract")

        def extraction_progress(done_pages: int, total_pages: int) -> None:
            if total_pages <= 0:
                return
            pct = clamp_pct((done_pages * 100) / total_pages)
            set_run_progress(
                client,
                run_id,
                "extract",
                pct,
                f"Extracting page {done_pages}/{total_pages}...",
            )

        extraction_res = run_extraction(
            tmp_pdf_path,
            model=model_name,
            job_id=run_id,
            on_progress=extraction_progress,
        )
        set_run_progress(client, run_id, "extract", 100, "Extraction complete.")
        insert_artifact(
            client,
            run_id=run_id,
            aip_id=aip_id,
            artifact_type="extract",
            artifact_json=extraction_res.payload,
        )

        current_stage = "validate"
        set_run_stage(client, run_id, current_stage)

        def validation_progress(
            done_projects: int,
            total_projects: int,
            batch_no: int,
            total_batches: int,
            message: str,
        ) -> None:
            pct = 100 if total_projects <= 0 else clamp_pct((done_projects * 100) / total_projects)
            set_run_progress(client, run_id, current_stage, pct, message)

        validation_res = validate_projects_json_str(
            extraction_res.json_str,
            model=model_name,
            num_batches=4,
            on_progress=validation_progress,
        )
        set_run_progress(client, run_id, current_stage, 100, "Validation complete.")
        insert_artifact(
            client,
            run_id=run_id,
            aip_id=aip_id,
            artifact_type="validate",
            artifact_json=validation_res.validated_obj,
        )

        current_stage = "summarize"
        set_run_stage(client, run_id, current_stage)
        summary_res = run_with_heartbeat(
            client=client,
            run_id=run_id,
            stage=current_stage,
            expected_seconds=read_positive_float_env("PIPELINE_SUMMARIZE_EXPECTED_SECONDS", 60.0),
            message_prefix="Generating summary",
            fn=lambda: summarize_aip_overall_json_str(validation_res.validated_json_str, model=model_name),
        )
        insert_artifact(
            client,
            run_id=run_id,
            aip_id=aip_id,
            artifact_type="summarize",
            artifact_json=summary_res.summary_obj,
            artifact_text=summary_res.summary_text,
        )

        current_stage = "categorize"
        set_run_stage(client, run_id, current_stage)
        summarized_doc = attach_summary_to_validated_json_str(
            validation_res.validated_json_str,
            summary_res.summary_text,
        )

        def categorize_progress(
            categorized_count: int,
            total_count: int,
            batch_no: int,
            total_batches: int,
        ) -> None:
            if total_count <= 0:
                pct = 100
            else:
                pct = clamp_pct((categorized_count * 100) / total_count)
            set_run_progress(
                client,
                run_id,
                current_stage,
                pct,
                (
                    f"Categorizing projects {categorized_count}/{total_count} "
                    f"(batch {batch_no}/{total_batches})..."
                ),
            )

        categorized_res = categorize_from_summarized_json_str(
            summarized_doc,
            model=model_name,
            batch_size=int(os.getenv("PIPELINE_BATCH_SIZE", "25")),
            on_progress=categorize_progress,
        )
        set_run_progress(client, run_id, current_stage, 100, "Categorization complete.")

        categorize_artifact_id = insert_artifact(
            client,
            run_id=run_id,
            aip_id=aip_id,
            artifact_type="categorize",
            artifact_json=categorized_res.categorized_obj,
            artifact_text=summary_res.summary_text,
        )

        upsert_projects(
            client,
            aip_id=aip_id,
            extraction_artifact_id=categorize_artifact_id,
            projects=categorized_res.categorized_obj.get("projects", []),
        )

        set_run_succeeded(client, run_id)
        print(f"[WORKER] run {run_id} succeeded")
    except Exception as error:
        set_run_failed(client, run_id, current_stage, error)
        print(f"[WORKER] run {run_id} failed: {error}")
    finally:
        if tmp_pdf_path and os.path.exists(tmp_pdf_path):
            try:
                os.remove(tmp_pdf_path)
            except OSError:
                pass


def run_worker() -> None:
    poll_seconds = float(os.getenv("PIPELINE_WORKER_POLL_SECONDS", "3"))
    run_once = os.getenv("PIPELINE_WORKER_RUN_ONCE", "false").lower() == "true"

    client = SupabaseRestClient()
    assert_progress_tracking_ready(client)
    print("[WORKER] started")

    while True:
        run = claim_next_queued_run(client)
        if not run:
            if run_once:
                print("[WORKER] no queued runs; exiting (run once)")
                return
            time.sleep(poll_seconds)
            continue

        print(f"[WORKER] claimed run {run['id']}")
        process_run(client, run)

        if run_once:
            return


if __name__ == "__main__":
    run_worker()
