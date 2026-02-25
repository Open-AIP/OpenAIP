from __future__ import annotations

import time

from dotenv import load_dotenv

from openaip_pipeline.adapters.supabase.client import SupabaseRestClient
from openaip_pipeline.adapters.supabase.repositories import PipelineRepository
from openaip_pipeline.core.logging import configure_logging
from openaip_pipeline.core.settings import Settings
from openaip_pipeline.worker.processor import process_run


def run_worker() -> None:
    settings = Settings.load(require_supabase=True, require_openai=True)
    client = SupabaseRestClient.from_settings(settings)
    repo = PipelineRepository(client)
    repo.assert_progress_tracking_ready()
    print("[WORKER] started")
    while True:
        run = repo.claim_next_queued_run()
        if not run:
            if settings.worker_run_once:
                print("[WORKER] no queued runs; exiting (run once)")
                return
            time.sleep(settings.worker_poll_seconds)
            continue
        print(f"[WORKER] claimed run {run.id}")
        process_run(repo=repo, settings=settings, run=run.__dict__)
        if settings.worker_run_once:
            return


def main() -> None:
    # Prefer project-local developer config while still allowing .env defaults.
    load_dotenv(".env.local")
    load_dotenv()
    configure_logging()
    run_worker()


if __name__ == "__main__":
    main()

