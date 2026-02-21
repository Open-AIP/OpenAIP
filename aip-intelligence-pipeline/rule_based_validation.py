from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from openaip_pipeline.services.validation.barangay import ValidationResult, validate_projects_json_str

__all__ = ["ValidationResult", "validate_projects_json_str"]
