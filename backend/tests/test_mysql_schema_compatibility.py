from pathlib import Path

import pytest
from sqlalchemy import String, create_engine, inspect, select

from app.core.database import Base


def test_local_sqlite_values_fit_declared_mysql_string_lengths() -> None:
    sqlite_path = Path("examplecorp.db")
    if not sqlite_path.exists() or sqlite_path.stat().st_size == 0:
        pytest.skip("legacy SQLite database was removed after the verified MySQL migration")
    engine = create_engine(f"sqlite:///{sqlite_path}")
    inspector = inspect(engine)
    expected_tables = {table.name for table in Base.metadata.sorted_tables}
    existing_tables = set(inspector.get_table_names())
    missing_tables = expected_tables - existing_tables
    if missing_tables:
        engine.dispose()
        pytest.skip("legacy SQLite database does not contain the complete migrated schema")
    existing_columns = {
        table.name: {column["name"] for column in inspector.get_columns(table.name)}
        for table in Base.metadata.sorted_tables
    }
    missing_columns = {
        table.name: {column.name for column in table.columns} - existing_columns[table.name]
        for table in Base.metadata.sorted_tables
    }
    if any(missing_columns.values()):
        engine.dispose()
        pytest.skip("legacy SQLite database schema is older than the current ORM schema")
    failures: list[str] = []
    try:
        with engine.connect() as connection:
            for table in Base.metadata.sorted_tables:
                rows = connection.execute(select(table)).mappings().all()
                for column in table.columns:
                    if not isinstance(column.type, String) or column.type.length is None:
                        continue
                    max_length = max(
                        (len(str(row[column.name])) for row in rows if row[column.name] is not None),
                        default=0,
                    )
                    if max_length > column.type.length:
                        failures.append(
                            f"{table.name}.{column.name}: max={max_length}, declared={column.type.length}"
                        )
    finally:
        engine.dispose()
    assert not failures, failures
