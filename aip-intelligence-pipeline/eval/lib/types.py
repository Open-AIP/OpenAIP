from __future__ import annotations

from dataclasses import dataclass
from typing import Any


REFUSAL_REASONS = {
    "document_limitation",
    "retrieval_failure",
    "missing_required_parameter",
    "ambiguous_scope",
    "unsupported_request",
}


@dataclass(frozen=True)
class ExpectedSpec:
    answerable: bool
    supported_type: str
    target_field: str | None
    expected_status: str
    expected_refusal_reason: str | None


@dataclass(frozen=True)
class GoldenQuestion:
    id: str
    audience: str
    scope_mode: str
    lgu_hint: dict[str, Any]
    fiscal_year_hint: int | None
    question: str
    expected: ExpectedSpec


@dataclass
class EvalResult:
    id: str
    request: dict[str, Any]
    response: dict[str, Any]
    observed_status: str | None
    observed_refusal_reason: str | None
    route_intent: str | None
    route_name: str | None
    pass_fail: bool
    errors: list[str]
    timing_ms: float
    attempts: int

