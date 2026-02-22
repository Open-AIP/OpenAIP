from openaip_pipeline.core.settings import Settings
from openaip_pipeline.worker.processor import _sanitize_error


def test_sanitize_error_redacts_secrets() -> None:
    settings = Settings(
        openai_api_key="sk-test-openai",
        supabase_url="https://example.supabase.co",
        supabase_service_key="sb-test-service",
        supabase_storage_artifact_bucket="aip-artifacts",
        pipeline_model="gpt-5.2",
        embedding_model="text-embedding-3-large",
        batch_size=25,
        worker_poll_seconds=3.0,
        worker_run_once=False,
        artifact_inline_max_bytes=32768,
        enable_rag=False,
        dev_routes=False,
    )
    message = "OPENAI=sk-test-openai SUPABASE=sb-test-service"
    sanitized = _sanitize_error(message, settings)
    assert "sk-test-openai" not in sanitized
    assert "sb-test-service" not in sanitized
    assert "[REDACTED]" in sanitized

