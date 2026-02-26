from __future__ import annotations

import re
from collections import Counter, defaultdict
from dataclasses import asdict
from typing import Any

from eval.lib.types import EvalResult, GoldenQuestion, REFUSAL_REASONS

CURRENCY_PATTERN = re.compile(r"(PHP|₱)\s?\d[\d,]*(?:\.\d{1,2})?|\b\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?\b")


def extract_observed_fields(
    response_json: dict[str, Any] | None,
) -> tuple[str | None, str | None, str | None, str | None]:
    if not response_json:
        return None, None, None, None

    assistant = response_json.get("assistantMessage")
    retrieval_meta = None
    if isinstance(assistant, dict):
        candidate_meta = assistant.get("retrievalMeta")
        if isinstance(candidate_meta, dict):
            retrieval_meta = candidate_meta

    observed_status = _as_str(response_json.get("status"))
    if not observed_status and retrieval_meta:
        observed_status = _as_str(retrieval_meta.get("status"))

    observed_refusal_reason = _extract_refusal_reason(retrieval_meta, observed_status)
    route_intent = _as_str(retrieval_meta.get("intent")) if retrieval_meta else None
    route_name = _as_str(retrieval_meta.get("route")) if retrieval_meta else None
    return observed_status, observed_refusal_reason, route_intent, route_name


def evaluate_result(question: GoldenQuestion, result: EvalResult) -> EvalResult:
    errors: list[str] = list(result.errors)
    expected = question.expected

    if result.observed_status != expected.expected_status:
        errors.append(
            f"Status mismatch: expected '{expected.expected_status}', observed '{result.observed_status}'."
        )

    if expected.expected_status == "refusal":
        if result.observed_refusal_reason != expected.expected_refusal_reason:
            errors.append(
                "Refusal reason mismatch: "
                f"expected '{expected.expected_refusal_reason}', observed '{result.observed_refusal_reason}'."
            )
    else:
        if result.observed_refusal_reason is not None:
            errors.append(
                f"Unexpected refusal reason for non-refusal status: '{result.observed_refusal_reason}'."
            )

    content = _extract_assistant_content(result.response.get("json_body"))

    if expected.supported_type == "totals" and expected.expected_status == "answer" and result.observed_status == "answer":
        if not _contains_currency(content):
            errors.append("Totals answer missing currency-like value (PHP/amount pattern).")
        if not _passes_totals_route_check(result, content):
            errors.append("Totals SQL-first route check failed (no metadata or heuristic evidence).")

    if (
        expected.supported_type == "aggregate_compare_years"
        and expected.expected_status == "answer"
        and result.observed_status == "answer"
    ):
        if "2025" not in content or "2026" not in content:
            errors.append("Compare-years answer must mention both 2025 and 2026.")
        if not _passes_compare_years_route_check(result):
            errors.append("Compare-years aggregate route check failed (no metadata or heuristic evidence).")

    if (
        expected.supported_type == "line_item_fact"
        and expected.target_field == "amount"
        and expected.expected_status == "answer"
        and result.observed_status == "answer"
    ):
        if not _contains_currency(content):
            errors.append("Line-item amount answer missing currency-like value (PHP/amount pattern).")

    if expected.expected_status == "clarification" and result.observed_status != "clarification":
        errors.append("Clarification contract failed: expected clarification status.")

    if result.response.get("http_status") != 200:
        errors.append(f"HTTP status was {result.response.get('http_status')}, expected 200.")

    result.errors = errors
    result.pass_fail = len(errors) == 0
    return result


def build_summary(questions: list[GoldenQuestion], results: list[EvalResult]) -> dict[str, Any]:
    total = len(results)
    pass_count = sum(1 for row in results if row.pass_fail)
    fail_count = total - pass_count

    observed_status_counts = Counter(_status_bucket(row.observed_status) for row in results)
    acceptance_rate = _safe_rate(observed_status_counts.get("answer", 0), total)
    clarification_rate = _safe_rate(observed_status_counts.get("clarification", 0), total)
    refusal_rate = _safe_rate(observed_status_counts.get("refusal", 0), total)

    expected_vs_observed: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    refusal_confusion: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    failures_by_error: Counter[str] = Counter()

    question_map = {q.id: q for q in questions}
    for row in results:
        expected = question_map[row.id].expected
        expected_status = expected.expected_status
        observed_status = row.observed_status or "missing"
        expected_vs_observed[expected_status][observed_status] += 1

        if expected.expected_status == "refusal":
            expected_reason = expected.expected_refusal_reason or "missing"
            observed_reason = row.observed_refusal_reason or "missing"
            refusal_confusion[expected_reason][observed_reason] += 1

        if not row.pass_fail and row.errors:
            failures_by_error[row.errors[0]] += 1

    grouped = {
        "scope_mode": _build_group_metrics(questions, results, lambda q: q.scope_mode),
        "audience": _build_group_metrics(questions, results, lambda q: q.audience),
        "supported_type": _build_group_metrics(questions, results, lambda q: q.expected.supported_type),
        "target_field": _build_group_metrics(
            questions, results, lambda q: q.expected.target_field or "null"
        ),
    }

    return {
        "totals": {
            "total": total,
            "pass": pass_count,
            "fail": fail_count,
            "pass_rate": _safe_rate(pass_count, total),
            "acceptance_rate": acceptance_rate,
            "clarification_rate": clarification_rate,
            "refusal_rate": refusal_rate,
            "status_counts": {
                "answer": observed_status_counts.get("answer", 0),
                "clarification": observed_status_counts.get("clarification", 0),
                "refusal": observed_status_counts.get("refusal", 0),
                "unknown": observed_status_counts.get("unknown", 0),
            },
        },
        "confusion": {
            "expected_status_vs_observed_status": {
                key: dict(value) for key, value in expected_vs_observed.items()
            },
            "expected_refusal_reason_vs_observed_refusal_reason": {
                key: dict(value) for key, value in refusal_confusion.items()
            },
        },
        "group_breakdown": grouped,
        "failure_counts_by_first_error": dict(failures_by_error),
    }


def result_to_detailed_row(question: GoldenQuestion, result: EvalResult) -> dict[str, Any]:
    return {
        "id": result.id,
        "question": asdict(question),
        "request": result.request,
        "response": result.response,
        "observed": {
            "status": result.observed_status,
            "refusal_reason": result.observed_refusal_reason,
            "route_intent": result.route_intent,
            "route_name": result.route_name,
        },
        "timing_ms": result.timing_ms,
        "attempts": result.attempts,
        "pass": result.pass_fail,
        "errors": result.errors,
    }


def _extract_refusal_reason(
    retrieval_meta: dict[str, Any] | None, observed_status: str | None
) -> str | None:
    if not retrieval_meta:
        return None

    for key in ("refusalReason", "refusal_reason"):
        raw = retrieval_meta.get(key)
        if isinstance(raw, str) and raw in REFUSAL_REASONS:
            return raw

    if observed_status == "refusal":
        raw_reason = retrieval_meta.get("reason")
        if isinstance(raw_reason, str) and raw_reason in REFUSAL_REASONS:
            return raw_reason

    return None


def _as_str(value: Any) -> str | None:
    return value if isinstance(value, str) and value.strip() else None


def _extract_assistant_content(response_json: dict[str, Any] | None) -> str:
    if not response_json:
        return ""
    assistant = response_json.get("assistantMessage")
    if isinstance(assistant, dict):
        content = assistant.get("content")
        if isinstance(content, str):
            return content
    return ""


def _contains_currency(content: str) -> bool:
    return bool(CURRENCY_PATTERN.search(content))


def _citation_metadata_list(response_json: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not response_json:
        return []
    assistant = response_json.get("assistantMessage")
    if not isinstance(assistant, dict):
        return []
    citations = assistant.get("citations")
    if not isinstance(citations, list):
        return []

    metadata_rows: list[dict[str, Any]] = []
    for citation in citations:
        if not isinstance(citation, dict):
            continue
        metadata = citation.get("metadata")
        if isinstance(metadata, dict):
            metadata_rows.append(metadata)
    return metadata_rows


def _passes_totals_route_check(result: EvalResult, content: str) -> bool:
    if result.route_name == "sql_totals":
        return True

    metadata_rows = _citation_metadata_list(result.response.get("json_body"))
    for metadata in metadata_rows:
        if metadata.get("type") == "aip_total":
            return True
        if metadata.get("aggregation_source") == "aip_totals_total_investment_program":
            return True

    return "total investment program" in content.lower() and _contains_currency(content)


def _passes_compare_years_route_check(result: EvalResult) -> bool:
    if result.route_name == "aggregate_sql":
        return True

    metadata_rows = _citation_metadata_list(result.response.get("json_body"))
    for metadata in metadata_rows:
        if (
            metadata.get("aggregate_type") == "compare_years_verbose"
            and metadata.get("aggregation_source") == "aip_totals_total_investment_program"
        ):
            return True
    return False


def _status_bucket(status: str | None) -> str:
    if status in {"answer", "clarification", "refusal"}:
        return status
    return "unknown"


def _safe_rate(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return numerator / denominator


def _build_group_metrics(
    questions: list[GoldenQuestion],
    results: list[EvalResult],
    key_fn,
) -> dict[str, Any]:
    index = {q.id: q for q in questions}
    grouped_rows: dict[str, list[EvalResult]] = defaultdict(list)
    for row in results:
        grouped_rows[str(key_fn(index[row.id]))].append(row)

    output: dict[str, Any] = {}
    for key, rows in grouped_rows.items():
        total = len(rows)
        pass_count = sum(1 for row in rows if row.pass_fail)
        status_counts = Counter(_status_bucket(row.observed_status) for row in rows)
        output[key] = {
            "total": total,
            "pass": pass_count,
            "fail": total - pass_count,
            "pass_rate": _safe_rate(pass_count, total),
            "acceptance_rate": _safe_rate(status_counts.get("answer", 0), total),
            "clarification_rate": _safe_rate(status_counts.get("clarification", 0), total),
            "refusal_rate": _safe_rate(status_counts.get("refusal", 0), total),
            "status_counts": {
                "answer": status_counts.get("answer", 0),
                "clarification": status_counts.get("clarification", 0),
                "refusal": status_counts.get("refusal", 0),
                "unknown": status_counts.get("unknown", 0),
            },
        }
    return output
