import os
import tempfile
from pathlib import Path


TEST_DATABASE_DIR = tempfile.TemporaryDirectory(prefix="examplecorp-tests-")
TEST_DATABASE_PATH = Path(TEST_DATABASE_DIR.name) / "examplecorp-tests.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DATABASE_PATH}"
# Unit tests must not share state with a developer's running Redis.
os.environ["REDIS_URL"] = ""


def pytest_sessionfinish(session, exitstatus) -> None:
    """Release SQLite handles before TemporaryDirectory cleanup on Windows."""
    try:
        from app.core import database

        database.engine.dispose()
    except Exception:
        pass
