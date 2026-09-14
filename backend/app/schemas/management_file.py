from datetime import datetime

from pydantic import BaseModel, Field


class ManagedFileOut(BaseModel):
    id: int
    original_name: str
    stored_name: str
    url: str
    content_type: str
    size: int
    usage: str
    tags: str | None
    uploaded_by_id: int
    uploaded_by_username: str
    is_active: bool
    created_at: datetime


class ManagedFileUpdate(BaseModel):
    usage: str = Field(min_length=1, max_length=80)
    tags: str | None = Field(default=None, max_length=260)
    is_active: bool = True


class ActiveStateIn(BaseModel):
    is_active: bool
