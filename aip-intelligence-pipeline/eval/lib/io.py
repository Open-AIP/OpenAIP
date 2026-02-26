from __future__ import annotations

import hashlib
import json
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from eval.lib.types import ExpectedSpec, GoldenQuestion
from eval.validate_questions import load_jsonl, load_schema, run_global_checks, validate_schema


def to_golden_questions(records: list[dict[str, Any]]) -> list[GoldenQuestion]:
    questions: list[GoldenQuestion] = []
    for record in records:
        expected = record["expected"]
        question = GoldenQuestion(
            id=str(record["id"]),
            audience=str(record["audience"]),
            scope_mode=str(record["scope_mode"]),
            lgu_hint=dict(record["lgu_hint"]),
            fiscal_year_hint=record.get("fiscal_year_hint"),
            question=str(record["question"]),
            expected=ExpectedSpec(
                answerable=bool(expected["answerable"]),
                supported_type=str(expected["supported_type"]),
                target_field=expected.get("target_field"),
                expected_status=str(expected["expected_status"]),
                expected_refusal_reason=expected.get("expected_refusal_reason"),
            ),
        )
        questions.append(question)
    return questions


def load_and_validate_questions(
    input_path: Path,
    schema_path: Path,
    enforce_full_constraints: bool = True,
) -> tuple[list[GoldenQuestion], dict[str, Any]]:
    schema = load_schema(schema_path)
    records = load_jsonl(input_path)
    validate_schema(records, schema)

    scope_counts: dict[str, int] = {}
    unsupported_count = sum(
        1
        for row in records
        if isinstance(row.get("expected"), dict) and row["expected"].get("answerable") is False
    )

    if enforce_full_constraints:
        counted_scopes, unsupported_count = run_global_checks(records)
        scope_counts = {
            "city": counted_scopes.get("city", 0),
            "barangay": counted_scopes.get("barangay", 0),
            "global": counted_scopes.get("global", 0),
        }
    else:
        scope_counts = {
            "city": sum(1 for row in records if row.get("scope_mode") == "city"),
            "barangay": sum(1 for row in records if row.get("scope_mode") == "barangay"),
            "global": sum(1 for row in records if row.get("scope_mode") == "global"),
        }

    questions = to_golden_questions(records)
    return questions, {
        "total": len(questions),
        "scope_counts": scope_counts,
        "unsupported_count": unsupported_count,
    }


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def build_run_id(input_sha256: str) -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return f"{timestamp}-{input_sha256[:8]}"


def ensure_run_dir(eval_root: Path, run_id: str) -> Path:
    run_dir = eval_root / "results" / run_id
    run_dir.mkdir(parents=True, exist_ok=False)
    return run_dir


def to_jsonable_question(question: GoldenQuestion) -> dict[str, Any]:
    return asdict(question)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

