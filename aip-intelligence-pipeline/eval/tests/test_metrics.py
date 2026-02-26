from __future__ import annotations

from eval.lib.metrics import build_summary, evaluate_result, extract_observed_fields
from eval.lib.types import EvalResult, ExpectedSpec, GoldenQuestion


def test_status_and_refusal_reason_matching() -> None:
    question = _question(
        supported_type="unsupported",
        target_field=None,
        expected_status="refusal",
        expected_refusal_reason="document_limitation",
    )
    result = _result(
        json_body={
            "status": "refusal",
            "assistantMessage": {
                "content": "Cannot provide contractor data.",
                "retrievalMeta": {"status": "refusal", "refusalReason": "document_limitation"},
            },
        }
    )
    status, refusal, intent, route = extract_observed_fields(result.response["json_body"])
    result.observed_status = status
    result.observed_refusal_reason = refusal
    result.route_intent = intent
    result.route_name = route

    scored = evaluate_result(question, result)
    assert scored.pass_fail is True
    assert scored.errors == []


def test_compare_years_requires_both_years() -> None:
    question = _question(
        supported_type="aggregate_compare_years",
        target_field="compare_years",
        expected_status="answer",
        expected_refusal_reason=None,
    )
    result = _result(
        json_body={
            "status": "answer",
            "assistantMessage": {
                "content": "Coverage FY2025 is available.",
                "citations": [
                    {
                        "metadata": {
                            "aggregate_type": "compare_years_verbose",
                            "aggregation_source": "aip_totals_total_investment_program",
                        }
                    }
                ],
            },
        },
        observed_status="answer",
    )
    scored = evaluate_result(question, result)
    assert scored.pass_fail is False
    assert any("must mention both 2025 and 2026" in error for error in scored.errors)


def test_totals_currency_check_and_route_heuristic() -> None:
    question = _question(
        supported_type="totals",
        target_field="total_investment_program",
        expected_status="answer",
        expected_refusal_reason=None,
    )
    result = _result(
        json_body={
            "status": "answer",
            "assistantMessage": {
                "content": "Total Investment Program is PHP 1,000,000.00.",
                "citations": [{"metadata": {"type": "aip_total"}}],
            },
        },
        observed_status="answer",
    )
    scored = evaluate_result(question, result)
    assert scored.pass_fail is True


def test_clarification_contract() -> None:
    question = _question(
        supported_type="totals",
        target_field="total_investment_program",
        expected_status="clarification",
        expected_refusal_reason=None,
    )
    result = _result(
        json_body={"status": "answer", "assistantMessage": {"content": "Here is the answer."}},
        observed_status="answer",
    )
    scored = evaluate_result(question, result)
    assert scored.pass_fail is False
    assert any("Clarification contract failed" in error for error in scored.errors)


def test_build_summary_group_breakdown() -> None:
    question = _question(
        supported_type="line_item_fact",
        target_field="amount",
        expected_status="answer",
        expected_refusal_reason=None,
    )
    result = _result(
        json_body={"status": "answer", "assistantMessage": {"content": "Amount is PHP 100.00"}},
        observed_status="answer",
    )
    scored = evaluate_result(question, result)
    summary = build_summary([question], [scored])

    assert summary["totals"]["pass"] == 1
    assert summary["group_breakdown"]["scope_mode"]["global"]["acceptance_rate"] == 1.0
    assert summary["group_breakdown"]["supported_type"]["line_item_fact"]["total"] == 1


def _question(
    supported_type: str,
    target_field: str | None,
    expected_status: str,
    expected_refusal_reason: str | None,
) -> GoldenQuestion:
    return GoldenQuestion(
        id="Q0001",
        audience="citizen",
        scope_mode="global",
        lgu_hint={"city": "City of Cabuyao", "barangay": None},
        fiscal_year_hint=2026,
        question="Sample question",
        expected=ExpectedSpec(
            answerable=expected_status != "refusal",
            supported_type=supported_type,
            target_field=target_field,
            expected_status=expected_status,
            expected_refusal_reason=expected_refusal_reason,
        ),
    )


def _result(
    json_body: dict,
    observed_status: str | None = None,
) -> EvalResult:
    return EvalResult(
        id="Q0001",
        request={"question": "Sample question", "payload": {"content": "Sample question"}},
        response={"http_status": 200, "json_body": json_body, "raw_text": None, "error": None},
        observed_status=observed_status,
        observed_refusal_reason=None,
        route_intent=None,
        route_name=None,
        pass_fail=False,
        errors=[],
        timing_ms=12.0,
        attempts=1,
    )

