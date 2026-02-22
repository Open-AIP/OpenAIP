from __future__ import annotations

import json
from importlib.resources import files
from typing import Any


_ROOT = files("openaip_pipeline.resources")


def read_text(relative_path: str) -> str:
    return (_ROOT / relative_path).read_text(encoding="utf-8")


def read_json(relative_path: str) -> Any:
    return json.loads(read_text(relative_path))


def read_yaml(relative_path: str) -> Any:
    raw = read_text(relative_path)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        try:
            import yaml  # type: ignore
        except ModuleNotFoundError as error:
            raise RuntimeError("YAML parsing requires PyYAML when file is not JSON-compatible YAML.") from error
        return yaml.safe_load(raw)
