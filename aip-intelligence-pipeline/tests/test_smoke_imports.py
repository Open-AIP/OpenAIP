def test_smoke_imports() -> None:
    import openaip_pipeline.api.app  # noqa: F401
    import openaip_pipeline.cli.main  # noqa: F401
    import openaip_pipeline.worker.runner  # noqa: F401

