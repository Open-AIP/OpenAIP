from __future__ import annotations

import os
from typing import Any, Literal

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from openaip_pipeline.core.settings import Settings
from openaip_pipeline.services.openai_utils import build_openai_client
from openaip_pipeline.services.rag.rag import answer_with_rag

router = APIRouter(prefix="/v1/chat", tags=["chat"])


class RetrievalScopeTarget(BaseModel):
    scope_type: Literal["barangay", "city", "municipality"]
    scope_id: str = Field(min_length=1)
    scope_name: str = Field(min_length=1, max_length=200)


class RetrievalScope(BaseModel):
    mode: Literal["global", "own_barangay", "named_scopes"] = "global"
    targets: list[RetrievalScopeTarget] = Field(default_factory=list)


class ChatAnswerRequest(BaseModel):
    question: str = Field(min_length=1, max_length=12000)
    retrieval_scope: RetrievalScope = Field(default_factory=RetrievalScope)
    model_name: str | None = None
    top_k: int = Field(default=8, ge=1, le=30)
    min_similarity: float = Field(default=0.3, ge=0.0, le=1.0)


class ChatAnswerResponse(BaseModel):
    question: str
    answer: str
    refused: bool
    citations: list[dict[str, Any]]
    retrieval_meta: dict[str, Any]
    context_count: int


class QueryEmbeddingRequest(BaseModel):
    text: str = Field(min_length=1, max_length=12000)
    model_name: str | None = None


class QueryEmbeddingResponse(BaseModel):
    embedding: list[float]
    model: str
    dimensions: int


def _require_internal_token(provided_token: str | None) -> None:
    expected = os.getenv("PIPELINE_INTERNAL_TOKEN", "").strip()
    if not expected:
        raise HTTPException(status_code=500, detail="PIPELINE_INTERNAL_TOKEN is not configured.")
    if (provided_token or "").strip() != expected:
        raise HTTPException(status_code=401, detail="Unauthorized internal token.")


@router.post("/answer", response_model=ChatAnswerResponse)
def chat_answer(
    req: ChatAnswerRequest,
    x_pipeline_token: str | None = Header(default=None),
) -> ChatAnswerResponse:
    _require_internal_token(x_pipeline_token)
    settings = Settings.load(require_supabase=True, require_openai=True)
    model_name = (req.model_name or settings.pipeline_model).strip() or settings.pipeline_model

    result = answer_with_rag(
        supabase_url=settings.supabase_url,
        supabase_service_key=settings.supabase_service_key,
        openai_api_key=settings.openai_api_key,
        embeddings_model=settings.embedding_model,
        chat_model=model_name,
        question=req.question,
        retrieval_scope=req.retrieval_scope.model_dump(),
        top_k=req.top_k,
        min_similarity=req.min_similarity,
    )

    return ChatAnswerResponse(
        question=str(result.get("question") or req.question),
        answer=str(result.get("answer") or ""),
        refused=bool(result.get("refused")),
        citations=list(result.get("citations") or []),
        retrieval_meta=dict(result.get("retrieval_meta") or {}),
        context_count=int(result.get("context_count") or 0),
    )


@router.post("/embed-query", response_model=QueryEmbeddingResponse)
def embed_query(
    req: QueryEmbeddingRequest,
    x_pipeline_token: str | None = Header(default=None),
) -> QueryEmbeddingResponse:
    _require_internal_token(x_pipeline_token)
    settings = Settings.load(require_supabase=False, require_openai=True)
    model_name = (req.model_name or settings.embedding_model).strip() or settings.embedding_model

    client = build_openai_client(settings.openai_api_key)
    response = client.embeddings.create(model=model_name, input=req.text)
    data = list(getattr(response, "data", []) or [])
    if not data:
        raise HTTPException(status_code=500, detail="Embedding response is empty.")

    embedding = getattr(data[0], "embedding", None)
    if not isinstance(embedding, list) or not embedding:
        raise HTTPException(status_code=500, detail="Embedding vector missing in response.")
    if not all(isinstance(value, (int, float)) for value in embedding):
        raise HTTPException(status_code=500, detail="Embedding vector contains invalid values.")

    normalized = [float(value) for value in embedding]
    return QueryEmbeddingResponse(
        embedding=normalized,
        model=model_name,
        dimensions=len(normalized),
    )
