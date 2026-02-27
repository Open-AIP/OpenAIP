from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


def load_schema(schema_path: Path) -> dict[str, Any]:
    try:
        return json.loads(schema_path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise RuntimeError(f"Schema file not found: {schema_path}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Invalid schema JSON: {schema_path} ({exc})") from exc


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise RuntimeError(f"Questions file not found: {path}")

    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_no, raw_line in enumerate(handle, start=1):
            line = raw_line.rstrip("\n\r")
            if line.strip() == "":
                raise RuntimeError(f"Blank line detected at line {line_no}; blank lines are not allowed.")
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as exc:
                raise RuntimeError(f"Invalid JSON at line {line_no}: {exc.msg}") from exc
            if not isinstance(obj, dict):
                raise RuntimeError(f"Line {line_no} is not a JSON object.")
            records.append(obj)
    return records


def validate_schema(records: list[dict[str, Any]], schema: dict[str, Any]) -> None:
    validator = Draft202012Validator(schema)
    for line_no, obj in enumerate(records, start=1):
        errors = sorted(validator.iter_errors(obj), key=lambda err: list(err.absolute_path))
        if errors:
            err = errors[0]
            path = ".".join(str(part) for part in err.absolute_path) or "<root>"
            raise RuntimeError(f"Schema validation failed at line {line_no}, field {path}: {err.message}")


def run_global_checks(records: list[dict[str, Any]]) -> tuple[Counter[str], int]:
    errors: list[str] = []

    if len(records) != 200:
        errors.append(f"Expected exactly 200 objects, found {len(records)}.")

    expected_ids = [f"Q{idx:04d}" for idx in range(1, 201)]
    ids = [str(obj.get("id")) for obj in records]
    if ids != expected_ids:
        # Report first mismatch for readability.
        mismatch_index = None
        for idx, (actual, expected) in enumerate(zip(ids, expected_ids), start=1):
            if actual != expected:
                mismatch_index = idx
                errors.append(
                    f"ID sequence mismatch at position {idx}: expected {expected}, found {actual}."
                )
                break
        if mismatch_index is None and len(ids) != len(expected_ids):
            errors.append("ID sequence length mismatch against Q0001..Q0200.")

    scope_counts: Counter[str] = Counter(str(obj.get("scope_mode")) for obj in records)
    if scope_counts.get("city", 0) != 60:
        errors.append(f'Expected scope_mode "city" count = 60, found {scope_counts.get("city", 0)}.')
    if scope_counts.get("barangay", 0) != 110:
        errors.append(
            f'Expected scope_mode "barangay" count = 110, found {scope_counts.get("barangay", 0)}.'
        )
    if scope_counts.get("global", 0) != 30:
        errors.append(f'Expected scope_mode "global" count = 30, found {scope_counts.get("global", 0)}.')

    unsupported_count = 0
    barangay_counts: Counter[str] = Counter()

    for obj in records:
        qid = str(obj.get("id"))
        scope_mode = obj.get("scope_mode")
        lgu_hint = obj.get("lgu_hint", {})
        fiscal_year_hint = obj.get("fiscal_year_hint")
        expected = obj.get("expected", {})
        answerable = expected.get("answerable")
        supported_type = expected.get("supported_type")
        expected_status = expected.get("expected_status")
        expected_refusal_reason = expected.get("expected_refusal_reason")

        if answerable is False:
            unsupported_count += 1
            if supported_type != "unsupported":
                errors.append(
                    f"{qid}: answerable=false requires supported_type='unsupported', found {supported_type!r}."
                )
            if expected_status != "refusal":
                errors.append(
                    f"{qid}: answerable=false requires expected_status='refusal', found {expected_status!r}."
                )
            if expected_refusal_reason is None:
                errors.append(
                    f"{qid}: answerable=false requires expected_refusal_reason to be non-null."
                )
        elif answerable is True:
            if supported_type == "unsupported":
                errors.append(f"{qid}: answerable=true cannot use supported_type='unsupported'.")
            if expected_status not in {"answer", "clarification"}:
                errors.append(
                    f"{qid}: answerable=true requires expected_status in {{'answer','clarification'}}, "
                    f"found {expected_status!r}."
                )
            if expected_refusal_reason is not None:
                errors.append(f"{qid}: answerable=true requires expected_refusal_reason=null.")

        if scope_mode == "city":
            if fiscal_year_hint not in (2022, None):
                errors.append(
                    f"{qid}: city scope allows fiscal_year_hint only 2022 or null, found {fiscal_year_hint!r}."
                )
            if lgu_hint.get("city") != "City of Cabuyao":
                errors.append(
                    f"{qid}: city scope requires lgu_hint.city='City of Cabuyao', found {lgu_hint.get('city')!r}."
                )
            if lgu_hint.get("barangay") is not None:
                errors.append(f"{qid}: city scope requires lgu_hint.barangay=null.")

        if scope_mode in {"barangay", "global"}:
            if fiscal_year_hint == 2022:
                errors.append(
                    f"{qid}: {scope_mode} scope cannot use fiscal_year_hint=2022 (allowed: 2025, 2026, null)."
                )

        if scope_mode == "barangay":
            barangay_name = lgu_hint.get("barangay")
            if barangay_name not in {"Mamatid", "Pulo"}:
                errors.append(
                    f"{qid}: barangay scope requires lgu_hint.barangay in {{'Mamatid','Pulo'}}, found {barangay_name!r}."
                )
            elif isinstance(barangay_name, str):
                barangay_counts[barangay_name] += 1
            if lgu_hint.get("city") not in {None, "City of Cabuyao"}:
                errors.append(
                    f"{qid}: barangay scope allows lgu_hint.city only null or 'City of Cabuyao', "
                    f"found {lgu_hint.get('city')!r}."
                )

        if scope_mode == "global":
            if lgu_hint.get("barangay") is not None:
                errors.append(f"{qid}: global scope requires lgu_hint.barangay=null.")
            if lgu_hint.get("city") not in {None, "City of Cabuyao"}:
                errors.append(
                    f"{qid}: global scope allows lgu_hint.city only null or 'City of Cabuyao', "
                    f"found {lgu_hint.get('city')!r}."
                )

    if not 30 <= unsupported_count <= 40:
        errors.append(
            f"Expected unsupported question count between 30 and 40 inclusive, found {unsupported_count}."
        )

    mamatid_count = barangay_counts.get("Mamatid", 0)
    pulo_count = barangay_counts.get("Pulo", 0)
    if mamatid_count + pulo_count != 110:
        errors.append(
            "Expected barangay-scope total for Mamatid+Pulo to equal 110, "
            f"found {mamatid_count + pulo_count}."
        )
    if not 45 <= mamatid_count <= 65:
        errors.append(
            f"Expected Mamatid barangay-scope count in [45,65], found {mamatid_count}."
        )
    if not 45 <= pulo_count <= 65:
        errors.append(
            f"Expected Pulo barangay-scope count in [45,65], found {pulo_count}."
        )

    if errors:
        joined = "\n- ".join(errors)
        raise RuntimeError(f"Global validation failed:\n- {joined}")

    return scope_counts, unsupported_count


def parse_args() -> argparse.Namespace:
    base_dir = Path(__file__).resolve().parent
    default_path = base_dir / "questions" / "v2" / "questions.jsonl"
    parser = argparse.ArgumentParser(description="Validate OpenAIP golden question JSONL.")
    parser.add_argument("--path", type=Path, default=default_path, help="Path to questions JSONL.")
    parser.add_argument(
        "--schema-only",
        action="store_true",
        help="Validate JSON parsing and schema only (skip 200-count/distribution checks).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    base_dir = Path(__file__).resolve().parent
    schema_path = base_dir / "schema" / "golden-question.schema.json"
    mode = "schema-only" if args.schema_only else "full"

    try:
        schema = load_schema(schema_path)
        records = load_jsonl(args.path)
        validate_schema(records, schema)

        scope_counts: Counter[str] = Counter(str(obj.get("scope_mode")) for obj in records)
        unsupported_count = sum(
            1 for obj in records if isinstance(obj.get("expected"), dict) and obj["expected"].get("answerable") is False
        )
        if not args.schema_only:
            scope_counts, unsupported_count = run_global_checks(records)

        print(f"Mode: {mode}")
        print(f"Total lines/objects: {len(records)}")
        print(
            "Scope counts: "
            f"city={scope_counts.get('city', 0)}, "
            f"barangay={scope_counts.get('barangay', 0)}, "
            f"global={scope_counts.get('global', 0)}"
        )
        print(f"Unsupported count: {unsupported_count}")
        print("PASS")
        return 0
    except RuntimeError as exc:
        print(f"FAIL: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
