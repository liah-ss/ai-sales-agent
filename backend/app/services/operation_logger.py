from datetime import date, datetime
from typing import Any

from pydantic import BaseModel
from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.models import AdminUser, OperationLog


def sanitize_for_json(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, BaseModel):
        return sanitize_for_json(value.model_dump())
    if isinstance(value, dict):
        return {str(key): sanitize_for_json(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [sanitize_for_json(item) for item in value]

    try:
        mapper = inspect(value.__class__)
    except Exception:
        return str(value)

    if not mapper.columns:
        return str(value)

    return {
        column.key: sanitize_for_json(getattr(value, column.key))
        for column in mapper.columns
    }


def model_snapshot(value: Any) -> dict[str, Any] | list[Any] | None:
    sanitized = sanitize_for_json(value)
    if sanitized is None or isinstance(sanitized, (dict, list)):
        return sanitized
    return {"value": sanitized}


def record_operation(
    db: Session,
    user: AdminUser,
    module: str,
    action: str,
    before: Any = None,
    after: Any = None,
) -> OperationLog:
    log = OperationLog(
        admin_user_id=user.id,
        admin_username=user.username,
        module=module,
        action=action,
        before_data=model_snapshot(before),
        after_data=model_snapshot(after),
    )
    db.add(log)
    return log
