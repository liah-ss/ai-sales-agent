from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PageView(Base):
    __tablename__ = "page_views"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    visitor_id: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    session_id: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    page_type: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    path: Mapped[str] = mapped_column(String(500), index=True, nullable=False)
    page_title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    ip_address: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    referrer: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    language: Mapped[str | None] = mapped_column(String(32), nullable=True)
    screen_size: Mapped[str | None] = mapped_column(String(32), nullable=True)
    is_bot: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True, nullable=False)
