from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from eval.lib.io import write_json, write_jsonl
from eval.lib.metrics import result_to_detailed_row
from eval.lib.types import EvalResult, GoldenQuestion


def write_artifacts(
    run_dir: Path,
    questions: list[GoldenQuestion],
    results: list[EvalResult],
    summary_payload: dict[str, Any],
    command_used: str,
    base_url: str | None,
    auth_mode: str,
    input_path: str,
    input_sha256: str,
) -> None:
    detailed_rows = []
    question_map = {q.id: q for q in questions}
    for result in results:
        detailed_rows.append(result_to_detailed_row(question_map[result.id], result))

    failure_rows = [row for row in detailed_rows if not row["pass"]]

    write_json(run_dir / "summary.json", summary_payload)
    _write_summary_csv(run_dir / "summary.csv", questions, results)
    write_jsonl(run_dir / "detailed.jsonl", detailed_rows)
    write_jsonl(run_dir / "failures.jsonl", failure_rows)
    _write_run_readme(
        path=run_dir / "README.md",
        command_used=command_used,
        base_url=base_url,
        auth_mode=auth_mode,
        input_path=input_path,
        input_sha256=input_sha256,
    )


def build_summary_payload(
    summary_metrics: dict[str, Any],
    run_id: str,
    command_used: str,
    base_url: str | None,
    auth_mode: str,
    input_path: str,
    input_sha256: str,
    total_questions: int,
) -> dict[str, Any]:
    return {
        "run": {
            "run_id": run_id,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "command": command_used,
            "base_url": base_url,
            "auth_mode": auth_mode,
            "input_path": input_path,
            "input_sha256": input_sha256,
            "total_questions_evaluated": total_questions,
        },
        **summary_metrics,
    }


def _write_summary_csv(
    path: Path, questions: list[GoldenQuestion], results: list[EvalResult]
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    question_map = {q.id: q for q in questions}
    fieldnames = [
        "id",
        "expected_status",
        "observed_status",
        "expected_refusal_reason",
        "observed_refusal_reason",
        "pass",
        "supported_type",
        "scope_mode",
        "audience",
        "timing_ms",
        "http_status",
    ]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for result in results:
            question = question_map[result.id]
            writer.writerow(
                {
                    "id": result.id,
                    "expected_status": question.expected.expected_status,
                    "observed_status": result.observed_status,
                    "expected_refusal_reason": question.expected.expected_refusal_reason,
                    "observed_refusal_reason": result.observed_refusal_reason,
                    "pass": str(result.pass_fail).lower(),
                    "supported_type": question.expected.supported_type,
                    "scope_mode": question.scope_mode,
                    "audience": question.audience,
                    "timing_ms": f"{result.timing_ms:.2f}",
                    "http_status": result.response.get("http_status"),
                }
            )


def _write_run_readme(
    path: Path,
    command_used: str,
    base_url: str | None,
    auth_mode: str,
    input_path: str,
    input_sha256: str,
) -> None:
    lines = [
        "# Eval Run Artifact",
        "",
        "## Reproduce",
        "",
        "```powershell",
        command_used,
        "```",
        "",
        "## Run Context",
        "",
        f"- Input path: `{input_path}`",
        f"- Input SHA256: `{input_sha256}`",
        f"- Base URL: `{base_url or 'N/A (dry-run)'}`",
        f"- Auth mode: `{auth_mode}`",
        "",
        "## Environment Variables",
        "",
        "- `OPENAIP_WEBSITE_BASE_URL`",
        "- `OPENAIP_EVAL_BEARER_TOKEN` (optional)",
        "- `OPENAIP_EVAL_COOKIE_HEADER` (optional)",
        "",
        "## Notes",
        "",
        "- Route checks are heuristic-strict when route metadata is absent.",
        "- Missing optional response fields are treated as mismatches, not runner crashes.",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")

