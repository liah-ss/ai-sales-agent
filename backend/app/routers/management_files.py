from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from qcloud_cos.cos_exception import CosClientError, CosServiceError
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models import AdminUser, ManagedFile
from app.schemas.management_file import ActiveStateIn, ManagedFileOut, ManagedFileUpdate
from app.services.operation_logger import model_snapshot, record_operation
from app.services.cos_storage import get_cos_storage

router = APIRouter(prefix="/management/files", tags=["management-files"])

UPLOAD_ROOT = Path("backend/uploads/files")
MAX_FILE_SIZE = 30 * 1024 * 1024


def file_to_out(file: ManagedFile) -> ManagedFileOut:
    return ManagedFileOut(
        id=file.id,
        original_name=file.original_name,
        stored_name=file.stored_name,
        url=file.url,
        content_type=file.content_type,
        size=file.size,
        usage=file.usage,
        tags=file.tags,
        uploaded_by_id=file.uploaded_by_id,
        uploaded_by_username=file.uploaded_by.username,
        is_active=file.is_active,
        created_at=file.created_at,
    )


def get_file_or_404(db: Session, file_id: int) -> ManagedFile:
    file = db.scalar(
        select(ManagedFile)
        .options(joinedload(ManagedFile.uploaded_by))
        .where(ManagedFile.id == file_id)
    )
    if file is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return file


@router.get("", response_model=list[ManagedFileOut])
def list_files(
    usage: str | None = Query(default=None),
    q: str | None = Query(default=None),
    include_archived: bool = Query(default=False),
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[ManagedFileOut]:
    statement = select(ManagedFile).options(joinedload(ManagedFile.uploaded_by))
    if not include_archived:
        statement = statement.where(ManagedFile.is_active.is_(True))
    if usage and usage != "all":
        statement = statement.where(ManagedFile.usage == usage)
    if q:
        term = f"%{q.strip()}%"
        statement = statement.where(
            or_(
                ManagedFile.original_name.ilike(term),
                ManagedFile.tags.ilike(term),
                ManagedFile.usage.ilike(term),
            )
        )

    files = list(db.scalars(statement.order_by(ManagedFile.created_at.desc(), ManagedFile.id.desc())))
    return [file_to_out(file) for file in files]


@router.post("", response_model=ManagedFileOut, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    usage: str = Form(default="general"),
    tags: str | None = Form(default=None),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> ManagedFileOut:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is empty")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size must be under 30MB")

    original_name = file.filename or "upload.bin"
    extension = Path(original_name).suffix.lower()
    stored_name = f"{uuid4().hex}{extension}"
    target = UPLOAD_ROOT / stored_name
    uploaded_url = get_cos_storage().save_public_bytes(
        key=f"uploads/files/{stored_name}",
        content=content,
        content_type=file.content_type or "application/octet-stream",
        fallback_path=target,
    )

    record = ManagedFile(
        original_name=original_name,
        stored_name=stored_name,
        url=uploaded_url,
        content_type=file.content_type or "application/octet-stream",
        size=len(content),
        usage=usage.strip() or "general",
        tags=tags.strip() if tags else None,
        uploaded_by_id=current_user.id,
    )
    db.add(record)
    db.flush()
    record_operation(db, current_user, "资料文件", "上传资料文件", None, record)
    db.commit()
    db.refresh(record)
    return file_to_out(get_file_or_404(db, record.id))


@router.put("/{file_id}", response_model=ManagedFileOut)
def update_file(
    file_id: int,
    payload: ManagedFileUpdate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> ManagedFileOut:
    record = get_file_or_404(db, file_id)
    before = model_snapshot(record)
    record.usage = payload.usage.strip() or "general"
    record.tags = payload.tags.strip() if payload.tags else None
    record.is_active = payload.is_active
    db.add(record)
    record_operation(db, current_user, "资料文件", "编辑资料文件", before, record)
    db.commit()
    return file_to_out(get_file_or_404(db, file_id))


@router.patch("/{file_id}/active", response_model=ManagedFileOut)
def set_file_active(
    file_id: int,
    payload: ActiveStateIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> ManagedFileOut:
    record = get_file_or_404(db, file_id)
    before = model_snapshot(record)
    record.is_active = payload.is_active
    db.add(record)
    record_operation(db, current_user, "资料文件", "修改资料文件状态", before, record)
    db.commit()
    return file_to_out(get_file_or_404(db, file_id))


@router.get("/{file_id}/download", response_model=None)
def download_file(
    file_id: int,
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Response:
    record = get_file_or_404(db, file_id)
    storage = get_cos_storage()
    target = (UPLOAD_ROOT / record.stored_name).resolve()
    upload_root = UPLOAD_ROOT.resolve()
    if not target.is_relative_to(upload_root):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored file not found")

    try:
        content = storage.read_bytes(
            key=f"uploads/files/{record.stored_name}",
            fallback_path=target,
        )
    except FileNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored file not found") from error
    except (CosClientError, CosServiceError) as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to read stored file") from error

    return Response(
        content=content,
        media_type=record.content_type,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(record.original_name)}"},
    )
