import os
import sys

# Ensure repository root is on sys.path so backend modules can be imported
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Set default data directory if not configured in environment
if "WINDLENS_DATA_DIR" not in os.environ:
    os.environ["WINDLENS_DATA_DIR"] = os.path.join(project_root, "data", "processed")

from backend.app.main import app
