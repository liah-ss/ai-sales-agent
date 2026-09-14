from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ManagedFile(Base):
    __tablename__ = "managed_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    original_name: Mapped[str] = mapped_column(String(260), nullable=False)
    stored_name: Mapped[str] = mapped_column(String(260), unique=True, nullable=False)
    url: Mapped[str] = mapped_column(String(520), nullable=False)
    content_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size: Mapped[int] = mapped_column(Integer, nullable=False)
    usage: Mapped[str] = mapped_column(String(80), default="general", index=True, nullable=False)
    tags: Mapped[str | None] = mapped_column(String(260), nullable=True)
    uploaded_by_id: Mapped[int] = mapped_column(ForeignKey("admin_users.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    uploaded_by = relationship("AdminUser")
