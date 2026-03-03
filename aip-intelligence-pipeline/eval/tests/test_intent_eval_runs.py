from __future__ import annotations

import csv
import json
from pathlib import Path

from eval.lib.intent_eval import run_intent_eval
from openaip_pipeline.services.intent.types import IntentResult, IntentType


class FakeRouter:
    def route(self, text: str) -> IntentResult:
        normalized = text.lower()
        if "hello" in normalized:
            return IntentResult(
                intent=IntentType.GREETING,
                confidence=0.9,
                top2_intent=None,
                top2_confidence=None,
                margin=0.9,
                method="semantic",
            )
        if "total" in normalized:
            return IntentResult(
                intent=IntentType.TOTAL_AGGREGATION,
                confidence=0.9,
                top2_intent=None,
                top2_confidence=None,
                margin=0.9,
                method="rule",
            )
        return IntentResult(
            intent=IntentType.UNKNOWN,
            confidence=0.0,
            top2_intent=None,
            top2_confidence=None,
            margin=0.0,
            method="none",
        )


def test_run_intent_eval_writes_expected_artifacts_and_metrics(tmp_path: Path) -> None:
    dataset_path = _write_dataset(
        tmp_path / "dataset.csv",
        [
            ("hello there", "GREETING"),
            ("what is the total budget", "TOTAL_AGGREGATION"),
            ("weird phrase", "UNKNOWN"),
            ("another odd phrase", "UNKNOWN"),
        ],
    )
    results_root = tmp_path / "results"

    run_dir = run_intent_eval(
        dataset_path=dataset_path,
        results_root=results_root,
        router=FakeRouter(),
    )

    assert run_dir.parent == results_root
    assert run_dir.name.endswith("-intent-eval")
    assert (run_dir / "metrics.json").exists()
    assert (run_dir / "confusion.json").exists()
    assert (run_dir / "predictions.csv").exists()
    assert (run_dir / "config.json").exists()

    metrics = json.loads((run_dir / "metrics.json").read_text(encoding="utf-8"))
    assert metrics["total"] == 4
    assert metrics["correct"] == 4
    assert metrics["overall_accuracy"] == 1.0
    assert metrics["unknown_rate"] == 0.5

    confusion = json.loads((run_dir / "confusion.json").read_text(encoding="utf-8"))
    assert confusion["top_confusions"] == []

    with (run_dir / "predictions.csv").open("r", encoding="utf-8", newline="") as handle:
        reader = csv.reader(handle)
        header = next(reader)

    assert header == [
        "text",
        "expected_intent",
        "predicted_intent",
        "confidence",
        "method",
        "top2_intent",
        "top2_confidence",
        "margin",
    ]


def test_run_intent_eval_limit_applies_to_selected_rows(tmp_path: Path) -> None:
    dataset_path = _write_dataset(
        tmp_path / "dataset_limit.csv",
        [
            ("hello there", "GREETING"),
            ("what is the total budget", "TOTAL_AGGREGATION"),
            ("weird phrase", "UNKNOWN"),
            ("another odd phrase", "UNKNOWN"),
            ("hello again", "GREETING"),
        ],
    )
    results_root = tmp_path / "results_limit"

    run_dir = run_intent_eval(
        dataset_path=dataset_path,
        results_root=results_root,
        router=FakeRouter(),
        limit=2,
    )

    metrics = json.loads((run_dir / "metrics.json").read_text(encoding="utf-8"))
    assert metrics["total"] == 2


def _write_dataset(path: Path, rows: list[tuple[str, str]]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["text", "expected_intent"])
        writer.writerows(rows)
    return path
