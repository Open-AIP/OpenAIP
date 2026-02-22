from __future__ import annotations

import os
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable

from openaip_pipeline.adapters.supabase.repositories import PipelineRepository


HEARTBEAT_INTERVAL_SECONDS = 5.0
HEARTBEAT_STAGE_CAP_PCT = 95


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


def run_with_heartbeat(
    *,
    repo: PipelineRepository,
    run_id: str,
    stage: str,
    expected_seconds: float,
    message_prefix: str,
    fn: Callable[[], Any],
) -> Any:
    expected_seconds = max(1.0, expected_seconds)
    heartbeat_interval = read_positive_float_env("PIPELINE_PROGRESS_HEARTBEAT_SECONDS", HEARTBEAT_INTERVAL_SECONDS)
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
                repo.set_run_progress(
                    run_id=run_id,
                    stage=stage,
                    stage_progress_pct=stage_pct,
                    progress_message=f"{message_prefix} ({stage_pct}%)",
                )
                last_write = now
            time.sleep(0.5)
        result = future.result()
    repo.set_run_progress(run_id=run_id, stage=stage, stage_progress_pct=100, progress_message=f"{message_prefix} complete.")
    return result

