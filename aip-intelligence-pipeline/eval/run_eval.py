from __future__ import annotations

import argparse
import os
import shlex
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

from eval.lib.http_client import WebsiteChatClient
from eval.lib.io import (
    build_run_id,
    ensure_run_dir,
    load_and_validate_questions,
    sha256_file,
)
from eval.lib.metrics import build_summary, evaluate_result, extract_observed_fields
from eval.lib.reporting import build_summary_payload, write_artifacts
from eval.lib.types import EvalResult, GoldenQuestion


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run OpenAIP golden set evaluation against website API.")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("eval/questions/v2/questions.jsonl"),
        help="Path to golden question JSONL.",
    )
    parser.add_argument(
        "--base-url",
        type=str,
        default=None,
        help="Website base URL (fallback env OPENAIP_WEBSITE_BASE_URL).",
    )
    parser.add_argument(
        "--token",
        type=str,
        default=None,
        help="Bearer token (fallback env OPENAIP_EVAL_BEARER_TOKEN).",
    )
    parser.add_argument("--max", type=int, default=None, help="Run first N questions after validation.")
    parser.add_argument("--concurrency", type=int, default=3, help="Concurrent request workers (1..10).")
    parser.add_argument("--dry-run", action="store_true", help="Validate input only; do not call network.")
    parser.add_argument(
        "--stateful",
        action="store_true",
        help="Reuse one session per (audience, scope_mode) bucket.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    eval_root = Path(__file__).resolve().parent
    schema_path = eval_root / "schema" / "golden-question.schema.json"
    input_path = _resolve_input_path(args.input)

    if args.max is not None and args.max <= 0:
        print("Configuration error: --max must be greater than 0 when provided.")
        return 1

    concurrency = max(1, min(int(args.concurrency), 10))

    try:
        questions, validation_info = load_and_validate_questions(
            input_path=input_path,
            schema_path=schema_path,
            enforce_full_constraints=True,
        )
    except RuntimeError as exc:
        print(f"Validation failed: {exc}")
        return 1

    if args.max is not None:
        questions = questions[: args.max]

    input_sha256 = sha256_file(input_path)

    if args.dry_run:
        _print_dry_run_summary(validation_info, len(questions), input_path)
        return 0

    base_url = args.base_url or os.getenv("OPENAIP_WEBSITE_BASE_URL")
    token = args.token or os.getenv("OPENAIP_EVAL_BEARER_TOKEN")
    cookie_header = os.getenv("OPENAIP_EVAL_COOKIE_HEADER")
    if not base_url:
        print("Configuration error: --base-url or OPENAIP_WEBSITE_BASE_URL is required.")
        return 1

    auth_mode = _resolve_auth_mode(token, cookie_header)
    run_id = build_run_id(input_sha256)
    run_dir = ensure_run_dir(eval_root, run_id)
    command_used = _reconstruct_command(sys.argv)

    session_map: dict[tuple[str, str], str] = {}
    session_lock = threading.Lock()

    with WebsiteChatClient(
        base_url=base_url,
        bearer_token=token,
        cookie_header=cookie_header,
    ) as client:
        results = _run_requests(
            client=client,
            questions=questions,
            concurrency=concurrency,
            stateful=args.stateful,
            session_map=session_map,
            session_lock=session_lock,
        )

    summary_metrics = build_summary(questions, results)
    summary_payload = build_summary_payload(
        summary_metrics=summary_metrics,
        run_id=run_id,
        command_used=command_used,
        base_url=base_url,
        auth_mode=auth_mode,
        input_path=str(input_path),
        input_sha256=input_sha256,
        total_questions=len(questions),
    )
    write_artifacts(
        run_dir=run_dir,
        questions=questions,
        results=results,
        summary_payload=summary_payload,
        command_used=command_used,
        base_url=base_url,
        auth_mode=auth_mode,
        input_path=str(input_path),
        input_sha256=input_sha256,
    )

    _print_run_summary(results, run_dir, summary_metrics)
    failures = sum(1 for row in results if not row.pass_fail)
    return 0 if failures == 0 else 2


def _run_requests(
    client: WebsiteChatClient,
    questions: list[GoldenQuestion],
    concurrency: int,
    stateful: bool,
    session_map: dict[tuple[str, str], str],
    session_lock: threading.Lock,
) -> list[EvalResult]:
    indexed_results: list[tuple[int, EvalResult]] = []

    def worker(index: int, question: GoldenQuestion) -> tuple[int, EvalResult]:
        bucket_key = (question.audience, question.scope_mode)
        session_id_used: str | None = None
        if stateful:
            with session_lock:
                session_id_used = session_map.get(bucket_key)

        http_result = client.post_message(content=question.question, session_id=session_id_used)
        response_json = http_result.json_body

        if stateful and response_json and isinstance(response_json.get("sessionId"), str):
            response_session_id = response_json["sessionId"]
            with session_lock:
                session_map[bucket_key] = session_map.get(bucket_key, response_session_id)

        observed_status, observed_refusal_reason, route_intent, route_name = extract_observed_fields(
            response_json
        )

        eval_result = EvalResult(
            id=question.id,
            request={
                "question": question.question,
                "payload": (
                    {"content": question.question, "sessionId": session_id_used}
                    if session_id_used
                    else {"content": question.question}
                ),
                "audience": question.audience,
                "scope_mode": question.scope_mode,
                "stateful": stateful,
                "session_id_used": session_id_used,
            },
            response={
                "http_status": http_result.http_status,
                "json_body": response_json,
                "raw_text": http_result.raw_text,
                "error": http_result.error,
            },
            observed_status=observed_status,
            observed_refusal_reason=observed_refusal_reason,
            route_intent=route_intent,
            route_name=route_name,
            pass_fail=False,
            errors=[],
            timing_ms=http_result.timing_ms,
            attempts=http_result.attempts,
        )
        if http_result.error:
            eval_result.errors.append(f"HTTP transport error: {http_result.error}")

        eval_result = evaluate_result(question, eval_result)
        return index, eval_result

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(worker, idx, question) for idx, question in enumerate(questions)]
        for future in as_completed(futures):
            indexed_results.append(future.result())

    indexed_results.sort(key=lambda row: row[0])
    return [row[1] for row in indexed_results]


def _print_dry_run_summary(validation_info: dict[str, Any], sliced_count: int, input_path: Path) -> None:
    scope = validation_info["scope_counts"]
    print("Dry run PASS")
    print(f"Input: {input_path}")
    print(f"Validated total: {validation_info['total']}")
    print(
        "Scope counts: "
        f"city={scope.get('city', 0)}, "
        f"barangay={scope.get('barangay', 0)}, "
        f"global={scope.get('global', 0)}"
    )
    print(f"Unsupported count: {validation_info['unsupported_count']}")
    print(f"Questions to execute after --max slicing: {sliced_count}")


def _print_run_summary(results: list[EvalResult], run_dir: Path, summary_metrics: dict[str, Any]) -> None:
    totals = summary_metrics["totals"]
    print(f"Total: {totals['total']}")
    print(f"Pass: {totals['pass']}")
    print(f"Fail: {totals['fail']}")
    print(f"Acceptance rate: {totals['acceptance_rate']:.2%}")
    print(f"Clarification rate: {totals['clarification_rate']:.2%}")
    print(f"Refusal rate: {totals['refusal_rate']:.2%}")

    failing = [row for row in results if not row.pass_fail]
    if failing:
        print("Top failing IDs:")
        for row in failing[:10]:
            first_error = row.errors[0] if row.errors else "Unknown failure"
            print(f"- {row.id}: {first_error}")
    print(f"Results written to: {run_dir}")


def _resolve_input_path(path_arg: Path) -> Path:
    path = path_arg
    if not path.is_absolute():
        path = Path.cwd() / path
    return path.resolve()


def _resolve_auth_mode(token: str | None, cookie_header: str | None) -> str:
    if token and cookie_header:
        return "bearer+cookie"
    if token:
        return "bearer"
    if cookie_header:
        return "cookie"
    return "unauthenticated"


def _reconstruct_command(argv: list[str]) -> str:
    return "python " + " ".join(shlex.quote(part) for part in argv)


if __name__ == "__main__":
    raise SystemExit(main())

