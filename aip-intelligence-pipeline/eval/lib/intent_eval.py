from __future__ import annotations

import argparse
import sys
from collections import Counter
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
SRC_ROOT = REPO_ROOT / "src"
if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

from eval.lib.intent_io import (  # noqa: E402
    build_intent_eval_run_dir,
    load_intent_rows,
    resolve_git_commit,
    select_rows,
    write_predictions_csv,
    write_pretty_json,
)
from openaip_pipeline.services.intent.router import IntentRouter  # noqa: E402
from openaip_pipeline.services.intent.thresholds import (  # noqa: E402
    DEFAULT_MIN_MARGIN,
    DEFAULT_MIN_TOP1,
)
from openaip_pipeline.services.intent.types import IntentResult, IntentType  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run offline intent routing evaluation.")
    parser.add_argument("--dataset", type=Path, required=True, help="Path to labeled intent CSV.")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("eval/results"),
        help="Results root directory.",
    )
    parser.add_argument("--min_top1", type=float, default=None, help="Override top1 threshold.")
    parser.add_argument("--min_margin", type=float, default=None, help="Override margin threshold.")
    parser.add_argument("--limit", type=int, default=None, help="Limit rows evaluated.")
    parser.add_argument("--seed", type=int, default=None, help="Seed for deterministic sampling.")
    parser.add_argument(
        "--no_semantic",
        action="store_true",
        help="Evaluate the router in rules-only mode.",
    )
    return parser.parse_args()


def build_metrics_payload(predictions: list[dict[str, str | float | None]]) -> dict[str, Any]:
    total = len(predictions)
    correct = sum(
        1 for row in predictions if row["expected_intent"] == row["predicted_intent"]
    )
    unknown_predictions = sum(
        1 for row in predictions if row["predicted_intent"] == IntentType.UNKNOWN.value
    )

    per_intent: dict[str, dict[str, int | float]] = {}
    grouped: dict[str, list[dict[str, str | float | None]]] = {}
    for row in predictions:
        grouped.setdefault(str(row["expected_intent"]), []).append(row)

    for intent_name in sorted(grouped):
        rows = grouped[intent_name]
        intent_correct = sum(
            1 for row in rows if row["expected_intent"] == row["predicted_intent"]
        )
        count = len(rows)
        per_intent[intent_name] = {
            "count": count,
            "correct": intent_correct,
            "accuracy": (intent_correct / count) if count else 0.0,
        }

    return {
        "total": total,
        "correct": correct,
        "overall_accuracy": (correct / total) if total else 0.0,
        "unknown_rate": (unknown_predictions / total) if total else 0.0,
        "per_intent": per_intent,
    }


def build_confusion_payload(predictions: list[dict[str, str | float | None]]) -> dict[str, Any]:
    counts: Counter[tuple[str, str]] = Counter()
    for row in predictions:
        expected = str(row["expected_intent"])
        predicted = str(row["predicted_intent"])
        if expected != predicted:
            counts[(expected, predicted)] += 1

    top_confusions = [
        {
            "expected_intent": expected,
            "predicted_intent": predicted,
            "count": count,
        }
        for (expected, predicted), count in sorted(
            counts.items(),
            key=lambda item: (-item[1], item[0][0], item[0][1]),
        )
    ]
    return {"top_confusions": top_confusions}


def evaluate_dataset(
    router,
    rows: list[dict[str, str]],
) -> dict[str, Any]:
    predictions: list[dict[str, str | float | None]] = []

    for row in rows:
        result: IntentResult = router.route(row["text"])
        predictions.append(
            {
                "text": row["text"],
                "expected_intent": row["expected_intent"],
                "predicted_intent": result.intent.value,
                "confidence": result.confidence,
                "method": result.method,
                "top2_intent": result.top2_intent.value if result.top2_intent else "",
                "top2_confidence": (
                    result.top2_confidence if result.top2_confidence is not None else ""
                ),
                "margin": result.margin,
            }
        )

    metrics = build_metrics_payload(predictions)
    confusion = build_confusion_payload(predictions)
    return {
        "metrics": metrics,
        "confusion": confusion,
        "predictions": predictions,
    }


def run_intent_eval(
    *,
    dataset_path: Path,
    results_root: Path,
    router: Any | None = None,
    min_top1: float | None = None,
    min_margin: float | None = None,
    limit: int | None = None,
    seed: int | None = None,
    no_semantic: bool = False,
) -> Path:
    rows = load_intent_rows(dataset_path)
    selected_rows = select_rows(rows, limit=limit, seed=seed)

    if router is None:
        router = IntentRouter(
            semantic_enabled=not no_semantic,
            min_top1=min_top1,
            min_margin=min_margin,
        )

    evaluation = evaluate_dataset(router, selected_rows)
    run_dir = build_intent_eval_run_dir(results_root)

    effective_min_top1 = DEFAULT_MIN_TOP1 if min_top1 is None else min_top1
    effective_min_margin = DEFAULT_MIN_MARGIN if min_margin is None else min_margin
    config = {
        "dataset_path": str(dataset_path),
        "results_root": str(results_root),
        "row_count": len(selected_rows),
        "limit": limit,
        "seed": seed,
        "no_semantic": no_semantic,
        "min_top1": effective_min_top1,
        "min_margin": effective_min_margin,
        "git_commit": resolve_git_commit(REPO_ROOT),
    }

    write_pretty_json(run_dir / "metrics.json", evaluation["metrics"])
    write_pretty_json(run_dir / "confusion.json", evaluation["confusion"])
    write_predictions_csv(run_dir / "predictions.csv", evaluation["predictions"])
    write_pretty_json(run_dir / "config.json", config)

    metrics = evaluation["metrics"]
    print(f"Dataset: {dataset_path}")
    print(f"Rows evaluated: {metrics['total']}")
    print(f"Overall accuracy: {metrics['overall_accuracy']:.2%}")
    print(f"Unknown rate: {metrics['unknown_rate']:.2%}")
    print(f"Results written to: {run_dir}")

    return run_dir


def main() -> int:
    args = parse_args()
    run_intent_eval(
        dataset_path=args.dataset,
        results_root=args.out,
        min_top1=args.min_top1,
        min_margin=args.min_margin,
        limit=args.limit,
        seed=args.seed,
        no_semantic=args.no_semantic,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
