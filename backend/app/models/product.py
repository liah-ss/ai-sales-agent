from datetime import datetime, timezone

from sqlalchemy import Boolean, DDL, DateTime, ForeignKey, Index, Integer, JSON, String, Text, event
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.services.product_public_slug import product_public_slug_key


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_active_sort", "is_active", "sort_order", "id"),
        Index("ix_products_category_active_sort", "category_id", "is_active", "sort_order", "id"),
        Index("ix_products_hot_active_sort", "is_hot", "is_active", "sort_order", "id"),
        Index("ix_products_active_name", "is_active", "name", "id"),
        Index("ix_products_public_slug_key", "public_slug_key", "is_active"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    batch_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False, index=True)
    product_code: Mapped[str] = mapped_column(String(24), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    slug: Mapped[str] = mapped_column(String(1000), nullable=False)
    public_slug_key: Mapped[str | None] = mapped_column(String(191), nullable=True)
    model: Mapped[str] = mapped_column(String(1000), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    detail_blocks: Mapped[list[dict[str, object]]] = mapped_column(JSON, default=list, nullable=False)
    main_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    images: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    highlights: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    specifications: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list, nullable=False)
    variants: Mapped[list[dict[str, object]]] = mapped_column(JSON, default=list, nullable=False)
    price_tiers: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list, nullable=False)
    show_surprise_only: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    fulfillment_methods: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    fulfillment_items: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list, nullable=False)
    fulfillment_title: Mapped[str | None] = mapped_column(String(140), nullable=True)
    fulfillment_copy: Mapped[str | None] = mapped_column(Text, nullable=True)
    assurance_items: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list, nullable=False)
    process_items: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list, nullable=False)
    translations: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    moq: Mapped[str | None] = mapped_column(String(120), nullable=True)
    price_mode: Mapped[str] = mapped_column(String(40), default="contact_only", nullable=False)
    image_tone: Mapped[str | None] = mapped_column(String(80), nullable=True)
    tag: Mapped[str | None] = mapped_column(String(80), nullable=True)
    tag_more: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    seo_title: Mapped[str | None] = mapped_column(String(180), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(320), nullable=True)
    answer_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    author_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    technical_reviewer: Mapped[str | None] = mapped_column(String(120), nullable=True)
    evidence_urls: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    standards: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    applicable_markets: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    unsuitable_conditions: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    is_indexable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    content_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False
    )
    is_hot: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    category = relationship("Category", back_populates="products")


@event.listens_for(Product, "before_insert")
@event.listens_for(Product, "before_update")
def sync_product_public_slug_key(_mapper, _connection, product: Product) -> None:
    product.public_slug_key = product_public_slug_key(product)


event.listen(
    Product.__table__,
    "after_create",
    DDL(
        "ALTER TABLE products "
        "ADD COLUMN slug_hash BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(slug, 256))) STORED, "
        "ADD UNIQUE INDEX uq_products_slug_hash (slug_hash), "
        "ADD INDEX ix_products_slug_prefix (slug(191))"
    ).execute_if(dialect="mysql"),
)
