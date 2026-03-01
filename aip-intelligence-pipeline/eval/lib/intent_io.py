from __future__ import annotations

import csv
import json
import random
import subprocess
from datetime import datetime
from pathlib import Path

from openaip_pipeline.services.intent.types import IntentType

_INTENT_VALUES = {intent.value for intent in IntentType}
_PREDICTIONS_HEADER = [
    "text",
    "expected_intent",
    "predicted_intent",
    "confidence",
    "method",
    "top2_intent",
    "top2_confidence",
    "margin",
]


def load_intent_rows(dataset_path: Path) -> list[dict[str, str]]:
    with dataset_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise ValueError("Dataset is missing a header row.")

        missing_columns = {"text", "expected_intent"} - set(reader.fieldnames)
        if missing_columns:
            missing = ", ".join(sorted(missing_columns))
            raise ValueError(f"Dataset is missing required columns: {missing}")

        rows: list[dict[str, str]] = []
        for index, raw_row in enumerate(reader, start=2):
            text = str(raw_row.get("text", "")).strip()
            expected_intent = str(raw_row.get("expected_intent", "")).strip()

            if not text and not expected_intent:
                continue
            if not text:
                raise ValueError(f"Row {index} has an empty text value.")
            if expected_intent not in _INTENT_VALUES:
                raise ValueError(
                    f"Row {index} has invalid expected_intent '{expected_intent}'."
                )

            rows.append(
                {
                    "text": text,
                    "expected_intent": expected_intent,
                }
            )

    return rows


def select_rows(
    rows: list[dict[str, str]],
    limit: int | None,
    seed: int | None,
) -> list[dict[str, str]]:
    if limit is None or limit >= len(rows):
        return list(rows)
    if limit <= 0:
        raise ValueError("limit must be greater than 0 when provided.")
    if seed is None:
        return list(rows[:limit])
    return random.Random(seed).sample(rows, limit)


def build_intent_eval_run_dir(results_root: Path) -> Path:
    run_id = datetime.now().strftime("%Y%m%d-%H%M%S-intent-eval")
    run_dir = results_root / run_id
    run_dir.mkdir(parents=True, exist_ok=False)
    return run_dir


def write_pretty_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def write_predictions_csv(path: Path, rows: list[dict[str, str | float | None]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=_PREDICTIONS_HEADER)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def resolve_git_commit(repo_root: Path) -> str | None:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            check=False,
        )
    except Exception:
        return None

    if result.returncode != 0:
        return None

    value = result.stdout.strip()
    return value or None
