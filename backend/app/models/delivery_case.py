from datetime import datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DeliveryCase(Base):
    __tablename__ = "delivery_cases"
    __table_args__ = (
        Index("ix_delivery_cases_active_sort", "is_active", "sort_order", "delivered_at", "id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    project_overview: Mapped[str] = mapped_column(Text, default="", nullable=False)
    indonesia_fit: Mapped[str] = mapped_column(Text, default="", nullable=False)
    professional_configuration: Mapped[str] = mapped_column(Text, default="", nullable=False)
    key_parameter_table: Mapped[list[list[str]]] = mapped_column(JSON, default=list, nullable=False)
    delivery_challenges: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list, nullable=False)
    project_results: Mapped[str] = mapped_column(Text, default="", nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    client_name: Mapped[str] = mapped_column(String(160), nullable=False)
    industry: Mapped[str] = mapped_column(String(120), nullable=False)
    location: Mapped[str] = mapped_column(String(160), default="", nullable=False)
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
    delivered_at: Mapped[str] = mapped_column(Date, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
