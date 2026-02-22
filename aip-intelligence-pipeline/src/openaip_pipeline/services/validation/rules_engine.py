from __future__ import annotations

from typing import Any

from openaip_pipeline.core.resources import read_json


def load_rules(scope: str) -> dict[str, Any]:
    if scope not in {"barangay", "city"}:
        raise ValueError(f"Unsupported rules scope: {scope}")
    return read_json(f"rules/{scope}.rules.json")


def list_rule_ids(scope: str) -> list[str]:
    payload = load_rules(scope)
    rules = payload.get("rules", [])
    if not isinstance(rules, list):
        return []
    output: list[str] = []
    for row in rules:
        if isinstance(row, dict):
            rule_id = row.get("id")
            if isinstance(rule_id, str) and rule_id:
                output.append(rule_id)
    return output

