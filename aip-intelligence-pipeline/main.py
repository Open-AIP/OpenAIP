from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from openaip_pipeline.api.app import app, main


if __name__ == "__main__":
    main()
