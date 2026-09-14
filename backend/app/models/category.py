from sqlalchemy import Boolean, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        Index("ix_categories_active_sort", "is_active", "sort_order", "id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), nullable=True, index=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fulfillment_methods: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    fulfillment_items: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list, nullable=False)
    fulfillment_title: Mapped[str | None] = mapped_column(String(140), nullable=True)
    fulfillment_copy: Mapped[str | None] = mapped_column(Text, nullable=True)
    assurance_items: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list, nullable=False)
    translations: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    products = relationship("Product", back_populates="category")
    parent = relationship("Category", remote_side=[id], back_populates="children")
    children = relationship("Category", back_populates="parent", order_by="Category.sort_order")
