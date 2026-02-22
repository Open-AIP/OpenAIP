from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from openaip_pipeline.services.rag.rag import answer_with_rag

__all__ = ["answer_with_rag"]
