from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models import AdminUser, OperationLog
from app.schemas.operation_log import OperationLogBatchDeleteIn, OperationLogBatchDeleteOut, OperationLogListItemOut, OperationLogOut

router = APIRouter(prefix="/management/operation-logs", tags=["management-operation-logs"])


@router.get("", response_model=list[OperationLogListItemOut])
def list_operation_logs(
    module: str | None = Query(default=None),
    q: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[OperationLog]:
    statement = select(OperationLog)
    if module and module != "all":
        statement = statement.where(OperationLog.module == module)
    if q:
        term = f"%{q.strip()}%"
        statement = statement.where(
            or_(
                OperationLog.admin_username.ilike(term),
                OperationLog.module.ilike(term),
                OperationLog.action.ilike(term),
            )
        )

    return list(
        db.scalars(
            statement.order_by(OperationLog.created_at.desc(), OperationLog.id.desc()).limit(limit)
        )
    )


@router.get("/{log_id}", response_model=OperationLogOut)
def get_operation_log(
    log_id: int,
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> OperationLog:
    log = db.get(OperationLog, log_id)
    if log is None:
        raise HTTPException(status_code=404, detail="Operation log not found")
    return log


@router.post("/batch-delete", response_model=OperationLogBatchDeleteOut)
def batch_delete_operation_logs(
    payload: OperationLogBatchDeleteIn,
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> OperationLogBatchDeleteOut:
    requested_ids = list(dict.fromkeys(payload.ids))
    existing_ids = list(
        db.scalars(select(OperationLog.id).where(OperationLog.id.in_(requested_ids)))
    )
    if existing_ids:
        db.execute(delete(OperationLog).where(OperationLog.id.in_(existing_ids)))
        db.commit()
    return OperationLogBatchDeleteOut(
        deletedIds=existing_ids,
        deletedCount=len(existing_ids),
    )


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_operation_log(
    log_id: int,
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> None:
    log = db.get(OperationLog, log_id)
    if log is None:
        raise HTTPException(status_code=404, detail="Operation log not found")
    db.delete(log)
    db.commit()
