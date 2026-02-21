from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from openaip_pipeline.adapters.supabase.client import SupabaseConfig, SupabaseRestClient

__all__ = ["SupabaseConfig", "SupabaseRestClient"]
