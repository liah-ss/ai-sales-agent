from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Solution(Base):
    __tablename__ = "solutions"
    __table_args__ = (
        Index("ix_solutions_active_sort", "is_active", "sort_order", "id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(80), nullable=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    document_sections: Mapped[list[dict[str, object]]] = mapped_column(JSON, default=list, nullable=False)
    images: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    scenarios: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    equipment: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    benefits: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    detailed_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    pitfalls: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    core_parameters: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list, nullable=False)
    special_contributions: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    related_products: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    translations: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
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
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
