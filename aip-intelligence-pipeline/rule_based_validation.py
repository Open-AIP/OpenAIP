"""Compatibility shim for legacy imports.

Source-of-truth validation resources are under:
- src/openaip_pipeline/resources/prompts/validation/
- src/openaip_pipeline/resources/rules/
"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from openaip_pipeline.services.validation.barangay import ValidationResult, validate_projects_json_str

__all__ = ["ValidationResult", "validate_projects_json_str"]
