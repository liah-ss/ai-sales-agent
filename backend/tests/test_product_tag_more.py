import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from sqlalchemy import create_engine

from app.core import database
from app.services.product_tags import merge_tag_more, normalize_tag_more


class ProductTagMoreTests(unittest.TestCase):
    def test_normalize_removes_blanks_and_stable_duplicates(self) -> None:
        self.assertEqual(
            normalize_tag_more([" 配电器 ", "", None, "10kv", "配电器", "电能   质量"]),
            ["配电器", "10kv", "电能 质量"],
        )

    def test_merge_preserves_existing_values_before_source_category(self) -> None:
        self.assertEqual(
            merge_tag_more(["人工标签", "中压"], ["中压", "配电电器"]),
            ["人工标签", "中压", "配电电器"],
        )

    def test_sqlite_migration_adds_non_null_json_column(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            database_path = Path(directory) / "legacy.db"
            engine = create_engine(f"sqlite:///{database_path}")
            with engine.begin() as connection:
                connection.exec_driver_sql(
                    "CREATE TABLE products ("
                    "id INTEGER PRIMARY KEY, product_code VARCHAR(24), category_id INTEGER NOT NULL, "
                    "is_active BOOLEAN NOT NULL DEFAULT 1, is_hot BOOLEAN NOT NULL DEFAULT 0, "
                    "sort_order INTEGER NOT NULL DEFAULT 0)"
                )
                connection.exec_driver_sql(
                    "INSERT INTO products (id, product_code, category_id) VALUES (1, 'P-001', 1)"
                )

            with (
                patch.object(database, "engine", engine),
                patch.object(database, "settings", SimpleNamespace(database_url=f"sqlite:///{database_path}")),
            ):
                database.migrate_sqlite_schema()

            with engine.connect() as connection:
                columns = {row[1]: row for row in connection.exec_driver_sql("PRAGMA table_info(products)")}
                stored = connection.exec_driver_sql("SELECT tag_more FROM products WHERE id = 1").scalar_one()

            self.assertIn("tag_more", columns)
            self.assertTrue(columns["tag_more"][3])
            self.assertEqual(json.loads(stored), [])
            engine.dispose()


if __name__ == "__main__":
    unittest.main()
