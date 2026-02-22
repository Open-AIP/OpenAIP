from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class TokenUsage(BaseModel):
    input_tokens: int | None = None
    output_tokens: int | None = None
    total_tokens: int | None = None


class RunContext(BaseModel):
    pipeline_version: str
    prompt_set_version: str
    schema_version: str
    ruleset_version: str
    model_id: str
    embedding_model_id: str | None = None
    generation_params: dict[str, Any] = Field(default_factory=dict)


class ExtractionResultModel(BaseModel):
    job_id: str | None = None
    model: str
    source_pdf: str
    payload: dict[str, Any]
    json_str: str
    usage: TokenUsage


class ValidationResultModel(BaseModel):
    validated_obj: dict[str, Any]
    validated_json_str: str
    usage: TokenUsage
    elapsed_seconds: float
    model: str


class SummarizationResultModel(BaseModel):
    summary_text: str
    summary_obj: dict[str, Any]
    summary_json_str: str
    usage: TokenUsage
    elapsed_seconds: float
    model: str


class CategorizationResultModel(BaseModel):
    categorized_obj: dict[str, Any]
    categorized_json_str: str
    usage: TokenUsage
    elapsed_seconds: float
    model: str


class StageArtifactEnvelope(BaseModel):
    artifact_stage: str
    data: dict[str, Any] | None = None
    storage_path: str | None = None
    usage: TokenUsage | None = None
    meta: dict[str, Any] = Field(default_factory=dict)

