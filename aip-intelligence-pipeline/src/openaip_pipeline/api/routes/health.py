from __future__ import annotations

from fastapi import APIRouter

from openaip_pipeline import __version__

router = APIRouter(tags=["health"])


@router.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "message": "OpenAIP pipeline API is running"}


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": __version__}

