from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass
from typing import Any

from openaip_pipeline.core.resources import read_yaml


@dataclass(frozen=True)
class VersionBundle:
    pipeline_version: str
    prompt_set_version: str
    schema_version: str
    ruleset_version: str


def _git_sha_or_default(default: str = "dev") -> str:
    override = os.getenv("PIPELINE_VERSION", "").strip()
    if override:
        return override
    try:
        out = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], text=True).strip()
        return out or default
    except Exception:
        return default


def load_version_manifest() -> dict[str, Any]:
    data = read_yaml("manifests/pipeline_versions.yaml")
    if not isinstance(data, dict):
        raise ValueError("Invalid pipeline version manifest format.")
    return data


def resolve_version_bundle() -> VersionBundle:
    manifest = load_version_manifest()
    defaults = manifest.get("default") or {}
    return VersionBundle(
        pipeline_version=_git_sha_or_default(),
        prompt_set_version=os.getenv("PIPELINE_PROMPT_SET_VERSION", str(defaults.get("prompt_set_version", "v1.0.0"))),
        schema_version=os.getenv("PIPELINE_SCHEMA_VERSION", str(defaults.get("schema_version", "v1.0.0"))),
        ruleset_version=os.getenv("PIPELINE_RULESET_VERSION", str(defaults.get("ruleset_version", "v1.0.0"))),
    )

