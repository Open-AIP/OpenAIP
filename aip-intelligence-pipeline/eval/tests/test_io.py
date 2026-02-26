from __future__ import annotations

import json
from pathlib import Path

from eval.lib.io import load_and_validate_questions
from eval.lib.reporting import build_summary_payload, write_artifacts
from eval.lib.types import EvalResult


def test_load_questions_parses_jsonl_to_dataclasses(tmp_path: Path) -> None:
    row = {
        "id": "Q0001",
        "audience": "citizen",
        "scope_mode": "global",
        "lgu_hint": {"city": "City of Cabuyao", "barangay": None},
        "fiscal_year_hint": 2026,
        "question": "What fund sources exist in FY 2026 across all barangays?",
        "expected": {
            "answerable": True,
            "supported_type": "fund_sources_exist",
            "target_field": "fund_sources_list",
            "expected_status": "answer",
            "expected_refusal_reason": None,
        },
    }
    input_path = tmp_path / "questions.jsonl"
    input_path.write_text(json.dumps(row) + "\n", encoding="utf-8")
    schema_path = (
        Path(__file__).resolve().parents[1] / "schema" / "golden-question.schema.json"
    )

    questions, info = load_and_validate_questions(
        input_path=input_path,
        schema_path=schema_path,
        enforce_full_constraints=False,
    )

    assert len(questions) == 1
    assert questions[0].id == "Q0001"
    assert questions[0].expected.supported_type == "fund_sources_exist"
    assert info["scope_counts"]["global"] == 1


def test_reporting_writes_expected_artifacts(tmp_path: Path) -> None:
    schema_row = {
        "id": "Q0001",
        "audience": "citizen",
        "scope_mode": "global",
        "lgu_hint": {"city": "City of Cabuyao", "barangay": None},
        "fiscal_year_hint": 2026,
        "question": "What fund sources exist in FY 2026 across all barangays?",
        "expected": {
            "answerable": True,
            "supported_type": "fund_sources_exist",
            "target_field": "fund_sources_list",
            "expected_status": "answer",
            "expected_refusal_reason": None,
        },
    }
    questions, _ = load_and_validate_questions(
        input_path=_write_jsonl(tmp_path / "questions.jsonl", [schema_row]),
        schema_path=Path(__file__).resolve().parents[1] / "schema" / "golden-question.schema.json",
        enforce_full_constraints=False,
    )

    result = EvalResult(
        id="Q0001",
        request={"question": questions[0].question, "payload": {"content": questions[0].question}},
        response={"http_status": 200, "json_body": {"status": "answer"}, "raw_text": None, "error": None},
        observed_status="answer",
        observed_refusal_reason=None,
        route_intent=None,
        route_name=None,
        pass_fail=True,
        errors=[],
        timing_ms=10.0,
        attempts=1,
    )
    summary_payload = build_summary_payload(
        summary_metrics={"totals": {"total": 1, "pass": 1, "fail": 0}},
        run_id="20260101-000000-deadbeef",
        command_used="python -m eval.run_eval --dry-run",
        base_url="http://localhost:3000",
        auth_mode="bearer",
        input_path="eval/questions/v2/questions.jsonl",
        input_sha256="deadbeef",
        total_questions=1,
    )

    run_dir = tmp_path / "results" / "run1"
    run_dir.mkdir(parents=True)
    write_artifacts(
        run_dir=run_dir,
        questions=questions,
        results=[result],
        summary_payload=summary_payload,
        command_used="python -m eval.run_eval --dry-run",
        base_url="http://localhost:3000",
        auth_mode="bearer",
        input_path="eval/questions/v2/questions.jsonl",
        input_sha256="deadbeef",
    )

    assert (run_dir / "summary.json").exists()
    assert (run_dir / "summary.csv").exists()
    assert (run_dir / "detailed.jsonl").exists()
    assert (run_dir / "failures.jsonl").exists()
    assert (run_dir / "README.md").exists()

    csv_text = (run_dir / "summary.csv").read_text(encoding="utf-8")
    assert "expected_status,observed_status" in csv_text


def _write_jsonl(path: Path, rows: list[dict]) -> Path:
    path.write_text("\n".join(json.dumps(row) for row in rows) + "\n", encoding="utf-8")
    return path

