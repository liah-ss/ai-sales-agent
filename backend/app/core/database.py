from collections.abc import Generator

from sqlalchemy import create_engine, event, inspect
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()
engine_options: dict[str, object] = {"pool_pre_ping": True}
if settings.database_url.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False, "timeout": 30}
else:
    engine_options.update(
        connect_args={
            "connect_timeout": 5,
            "read_timeout": 30,
            "write_timeout": 30,
        },
        pool_size=max(1, settings.database_pool_size),
        max_overflow=max(0, settings.database_max_overflow),
        pool_timeout=max(1, settings.database_pool_timeout_seconds),
        pool_recycle=max(1, settings.database_pool_recycle_seconds),
        pool_use_lifo=True,
    )
engine = create_engine(settings.database_url, **engine_options)

if settings.database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def configure_sqlite_connection(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=30000")
        if not settings.database_url.endswith(":memory:"):
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()
else:
    @event.listens_for(engine, "connect")
    def configure_mysql_connection(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("SET NAMES utf8mb4")
        # Store naive application timestamps in UTC. Presentation layers can
        # convert them to Asia/Shanghai or the operator's chosen timezone.
        cursor.execute("SET time_zone = '+00:00'")
        cursor.close()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_db_and_tables() -> None:
    import app.models  # noqa: F401

    if not settings.database_url.startswith("sqlite") and not settings.database_auto_create_schema:
        return
    Base.metadata.create_all(bind=engine)
    migrate_sqlite_schema()

def migrate_sales_agent_schema() -> None:
    """Add the handoff integration columns to existing relational databases."""
    if settings.database_url.startswith("sqlite"):
        return

    with engine.begin() as connection:
        inspector = inspect(connection)
        tables = set(inspector.get_table_names())

        def ensure_column(table: str, column: str, definition: str) -> None:
            if table not in tables:
                return
            columns = {item["name"] for item in inspector.get_columns(table)}
            if column not in columns:
                connection.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")

        ensure_column("sales_handoffs", "feishu_chat_id", "VARCHAR(120) NULL")
        ensure_column("sales_handoffs", "feishu_message_id", "VARCHAR(120) NULL")
        ensure_column("sales_handoffs", "feishu_last_error", "TEXT NULL")
        ensure_column("sales_messages", "external_message_id", "VARCHAR(120) NULL")
        ensure_column("sales_messages", "external_channel", "VARCHAR(40) NULL")

        index_map = {
            "sales_handoffs": "ix_sales_handoffs_feishu_message_id",
            "sales_messages": "ix_sales_messages_external_message_id",
        }
        index_columns = {
            "sales_handoffs": "feishu_message_id",
            "sales_messages": "external_message_id",
        }
        for table, index_name in index_map.items():
            if table not in tables:
                continue
            existing_indexes = {item["name"] for item in inspector.get_indexes(table)}
            if index_name not in existing_indexes:
                connection.exec_driver_sql(
                    f"CREATE UNIQUE INDEX {index_name} ON {table} ({index_columns[table]})"
                )

def migrate_sqlite_schema() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    with engine.begin() as connection:
        def ensure_seo_geo_columns(table: str, column_info: dict[str, object]) -> None:
            columns = {
                "seo_title": "VARCHAR(180)",
                "seo_description": "VARCHAR(320)",
                "answer_summary": "TEXT",
                "author_name": "VARCHAR(120)",
                "technical_reviewer": "VARCHAR(120)",
                "evidence_urls": "JSON NOT NULL DEFAULT '[]'",
                "standards": "JSON NOT NULL DEFAULT '[]'",
                "applicable_markets": "JSON NOT NULL DEFAULT '[]'",
                "unsuitable_conditions": "JSON NOT NULL DEFAULT '[]'",
                "is_indexable": "BOOLEAN NOT NULL DEFAULT 1",
                "content_updated_at": "DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00'",
            }
            for column, column_type in columns.items():
                if column_info and column not in column_info:
                    connection.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {column} {column_type}")
                    if column == "content_updated_at":
                        connection.exec_driver_sql(
                            f"UPDATE {table} SET content_updated_at = CURRENT_TIMESTAMP "
                            "WHERE content_updated_at = '1970-01-01 00:00:00'"
                        )

        category_rows = connection.exec_driver_sql("PRAGMA table_info(categories)").fetchall()
        category_column_info = {row[1]: row for row in category_rows}
        if category_column_info and "parent_id" not in category_column_info:
            connection.exec_driver_sql("ALTER TABLE categories ADD COLUMN parent_id INTEGER")
            connection.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_categories_parent_id ON categories (parent_id)")
        if category_column_info and "fulfillment_methods" not in category_column_info:
            connection.exec_driver_sql("ALTER TABLE categories ADD COLUMN fulfillment_methods JSON NOT NULL DEFAULT '[]'")
        if category_column_info and "fulfillment_items" not in category_column_info:
            connection.exec_driver_sql("ALTER TABLE categories ADD COLUMN fulfillment_items JSON NOT NULL DEFAULT '[]'")
        if category_column_info and "fulfillment_title" not in category_column_info:
            connection.exec_driver_sql("ALTER TABLE categories ADD COLUMN fulfillment_title VARCHAR(140)")
        if category_column_info and "fulfillment_copy" not in category_column_info:
            connection.exec_driver_sql("ALTER TABLE categories ADD COLUMN fulfillment_copy TEXT")
        if category_column_info and "assurance_items" not in category_column_info:
            connection.exec_driver_sql("ALTER TABLE categories ADD COLUMN assurance_items JSON NOT NULL DEFAULT '[]'")
        if category_column_info and "translations" not in category_column_info:
            connection.exec_driver_sql("ALTER TABLE categories ADD COLUMN translations JSON NOT NULL DEFAULT '{}'")

        product_rows = connection.exec_driver_sql("PRAGMA table_info(products)").fetchall()
        product_column_info = {row[1]: row for row in product_rows}
        if product_column_info and "batch_number" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN batch_number INTEGER NOT NULL DEFAULT 1")
            connection.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_products_batch_number ON products (batch_number)")
        if product_column_info and "product_code" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN product_code VARCHAR(24)")
            product_column_info["product_code"] = None
        if product_column_info and "product_code" in product_column_info:
            product_ids = connection.exec_driver_sql("SELECT id FROM products WHERE product_code IS NULL OR product_code = '' ORDER BY id").fetchall()
            for row in product_ids:
                connection.exec_driver_sql("UPDATE products SET product_code = ? WHERE id = ?", (f"P-{int(row[0]):03d}", row[0]))
            connection.exec_driver_sql("CREATE UNIQUE INDEX IF NOT EXISTS ix_products_product_code ON products (product_code)")
        if product_column_info and "price_tiers" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN price_tiers JSON NOT NULL DEFAULT '[]'")
        if product_column_info and "detail_blocks" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN detail_blocks JSON NOT NULL DEFAULT '[]'")
        if product_column_info and "variants" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN variants JSON NOT NULL DEFAULT '[]'")
        if product_column_info and "show_surprise_only" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN show_surprise_only BOOLEAN NOT NULL DEFAULT 1")
        if product_column_info and "fulfillment_methods" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN fulfillment_methods JSON NOT NULL DEFAULT '[]'")
        if product_column_info and "fulfillment_items" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN fulfillment_items JSON NOT NULL DEFAULT '[]'")
        if product_column_info and "fulfillment_title" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN fulfillment_title VARCHAR(140)")
        if product_column_info and "fulfillment_copy" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN fulfillment_copy TEXT")
        if product_column_info and "assurance_items" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN assurance_items JSON NOT NULL DEFAULT '[]'")
        if product_column_info and "process_items" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN process_items JSON NOT NULL DEFAULT '[]'")
        if product_column_info and "translations" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN translations JSON NOT NULL DEFAULT '{}'")
        if product_column_info and "tag_more" not in product_column_info:
            connection.exec_driver_sql("ALTER TABLE products ADD COLUMN tag_more JSON NOT NULL DEFAULT '[]'")
        ensure_seo_geo_columns("products", product_column_info)
        if product_column_info:
            connection.exec_driver_sql(
                "CREATE INDEX IF NOT EXISTS ix_products_active_sort ON products (is_active, sort_order, id)"
            )
            connection.exec_driver_sql(
                "CREATE INDEX IF NOT EXISTS ix_products_category_active_sort "
                "ON products (category_id, is_active, sort_order, id)"
            )
            connection.exec_driver_sql(
                "CREATE INDEX IF NOT EXISTS ix_products_hot_active_sort "
                "ON products (is_hot, is_active, sort_order, id)"
            )

        if category_column_info:
            connection.exec_driver_sql(
                "CREATE INDEX IF NOT EXISTS ix_categories_active_sort "
                "ON categories (is_active, sort_order, id)"
            )

        solution_rows = connection.exec_driver_sql("PRAGMA table_info(solutions)").fetchall()
        solution_column_info = {row[1]: row for row in solution_rows}
        if solution_column_info and "images" not in solution_column_info:
            connection.exec_driver_sql("ALTER TABLE solutions ADD COLUMN images JSON NOT NULL DEFAULT '[]'")
        if solution_column_info and "document_sections" not in solution_column_info:
            connection.exec_driver_sql("ALTER TABLE solutions ADD COLUMN document_sections JSON NOT NULL DEFAULT '[]'")
        if solution_column_info and "detailed_description" not in solution_column_info:
            connection.exec_driver_sql("ALTER TABLE solutions ADD COLUMN detailed_description TEXT")
        if solution_column_info and "pitfalls" not in solution_column_info:
            connection.exec_driver_sql("ALTER TABLE solutions ADD COLUMN pitfalls JSON NOT NULL DEFAULT '[]'")
        if solution_column_info and "core_parameters" not in solution_column_info:
            connection.exec_driver_sql("ALTER TABLE solutions ADD COLUMN core_parameters JSON NOT NULL DEFAULT '[]'")
        if solution_column_info and "special_contributions" not in solution_column_info:
            connection.exec_driver_sql("ALTER TABLE solutions ADD COLUMN special_contributions JSON NOT NULL DEFAULT '[]'")
        if solution_column_info and "translations" not in solution_column_info:
            connection.exec_driver_sql("ALTER TABLE solutions ADD COLUMN translations JSON NOT NULL DEFAULT '{}'")
        ensure_seo_geo_columns("solutions", solution_column_info)
        if solution_column_info:
            connection.exec_driver_sql(
                "CREATE INDEX IF NOT EXISTS ix_solutions_active_sort "
                "ON solutions (is_active, sort_order, id)"
            )

        delivery_case_rows = connection.exec_driver_sql("PRAGMA table_info(delivery_cases)").fetchall()
        delivery_case_column_info = {row[1]: row for row in delivery_case_rows}
        delivery_case_columns = {
            "project_overview": "TEXT NOT NULL DEFAULT ''",
            "indonesia_fit": "TEXT NOT NULL DEFAULT ''",
            "professional_configuration": "TEXT NOT NULL DEFAULT ''",
            "key_parameter_table": "JSON NOT NULL DEFAULT '[]'",
            "delivery_challenges": "JSON NOT NULL DEFAULT '[]'",
            "project_results": "TEXT NOT NULL DEFAULT ''",
            "translations": "JSON NOT NULL DEFAULT '{}'",
        }
        for column, column_type in delivery_case_columns.items():
            if delivery_case_column_info and column not in delivery_case_column_info:
                connection.exec_driver_sql(f"ALTER TABLE delivery_cases ADD COLUMN {column} {column_type}")
        ensure_seo_geo_columns("delivery_cases", delivery_case_column_info)

        news_rows = connection.exec_driver_sql("PRAGMA table_info(news_articles)").fetchall()
        news_column_info = {row[1]: row for row in news_rows}
        if news_column_info and "translations" not in news_column_info:
            connection.exec_driver_sql("ALTER TABLE news_articles ADD COLUMN translations JSON NOT NULL DEFAULT '{}'")
        ensure_seo_geo_columns("news_articles", news_column_info)

        rows = connection.exec_driver_sql("PRAGMA table_info(inquiries)").fetchall()
        column_info = {row[1]: row for row in rows}
        if not column_info:
            return

        attachment_columns = {
            "attachment_url": "VARCHAR(500)",
            "attachment_name": "VARCHAR(255)",
            "attachment_content_type": "VARCHAR(120)",
            "product_code": "VARCHAR(24)",
            "submission_number": "VARCHAR(40)",
            "crm_status": "VARCHAR(40) NOT NULL DEFAULT 'pending'",
            "crm_attempts": "INTEGER NOT NULL DEFAULT 0",
            "crm_last_error": "TEXT",
            "crm_synced_at": "DATETIME",
        }
        for column, column_type in attachment_columns.items():
            if column not in column_info:
                connection.exec_driver_sql(f"ALTER TABLE inquiries ADD COLUMN {column} {column_type}")

        missing_submission_rows = connection.exec_driver_sql(
            "SELECT id, created_at FROM inquiries WHERE submission_number IS NULL OR submission_number = ''"
        ).fetchall()
        for inquiry_id, created_at in missing_submission_rows:
            date_part = str(created_at or "").replace("-", "")[:8] or "LEGACY"
            connection.exec_driver_sql(
                "UPDATE inquiries SET submission_number = ? WHERE id = ?",
                (f"INQ-{date_part}-{int(inquiry_id):08d}", inquiry_id),
            )
        connection.exec_driver_sql(
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_inquiries_submission_number ON inquiries (submission_number)"
        )

        email_column = column_info.get("email")
        if email_column is None or not bool(email_column[3]):
            return

        connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
        connection.exec_driver_sql("DROP TABLE IF EXISTS inquiries_new")
        connection.exec_driver_sql(
            """
            CREATE TABLE inquiries_new (
                id INTEGER NOT NULL,
                submission_number VARCHAR(40) NOT NULL,
                name VARCHAR(100) NOT NULL,
                company VARCHAR(150) NOT NULL,
                email VARCHAR(180),
                phone VARCHAR(80),
                attachment_url VARCHAR(500),
                attachment_name VARCHAR(255),
                attachment_content_type VARCHAR(120),
                product_code VARCHAR(24),
                product_slug VARCHAR(220),
                solution_slug VARCHAR(220),
                message TEXT NOT NULL,
                source_page VARCHAR(500) NOT NULL,
                status VARCHAR(40) NOT NULL,
                crm_status VARCHAR(40) NOT NULL,
                crm_attempts INTEGER NOT NULL,
                crm_last_error TEXT,
                crm_synced_at DATETIME,
                created_at DATETIME NOT NULL,
                PRIMARY KEY (id)
            )
            """
        )
        connection.exec_driver_sql(
            """
            INSERT INTO inquiries_new (
                id, submission_number, name, company, email, phone, attachment_url, attachment_name,
                attachment_content_type, product_code, product_slug, solution_slug, message,
                source_page, status, crm_status, crm_attempts, crm_last_error, crm_synced_at, created_at
            )
            SELECT id, submission_number, name, company, email, phone, attachment_url, attachment_name,
                attachment_content_type, product_code, product_slug, solution_slug, message,
                source_page, status, crm_status, crm_attempts, crm_last_error, crm_synced_at, created_at
            FROM inquiries
            """
        )
        connection.exec_driver_sql("DROP TABLE inquiries")
        connection.exec_driver_sql("ALTER TABLE inquiries_new RENAME TO inquiries")
        connection.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_inquiries_id ON inquiries (id)")
        connection.exec_driver_sql("CREATE UNIQUE INDEX IF NOT EXISTS ix_inquiries_submission_number ON inquiries (submission_number)")
        connection.exec_driver_sql("PRAGMA foreign_keys=ON")
