from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class OperationLogListItemOut(BaseModel):
    id: int
    admin_user_id: int | None
    admin_username: str
    module: str
    action: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OperationLogOut(OperationLogListItemOut):
    before_data: dict[str, Any] | list[Any] | None
    after_data: dict[str, Any] | list[Any] | None


class OperationLogBatchDeleteIn(BaseModel):
    ids: list[int] = Field(min_length=1, max_length=500)


class OperationLogBatchDeleteOut(BaseModel):
    deletedIds: list[int]
    deletedCount: int
