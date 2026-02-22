from __future__ import annotations

import os

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI

from openaip_pipeline.api.routes.health import router as health_router
from openaip_pipeline.api.routes.runs import router as runs_router
from openaip_pipeline.core.logging import configure_logging


def create_app() -> FastAPI:
    app = FastAPI(title="OpenAIP Pipeline Service", version="1.0.0")
    app.include_router(health_router)
    app.include_router(runs_router)
    return app


app = create_app()


def main() -> None:
    load_dotenv()
    configure_logging(os.getenv("LOG_LEVEL", "INFO"))
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("openaip_pipeline.api.app:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    main()

