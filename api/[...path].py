from pathlib import Path
import sys

BACKEND_PATH = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_PATH))

from app.main import app
