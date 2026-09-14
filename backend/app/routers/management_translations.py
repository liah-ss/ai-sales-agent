from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models import AdminUser
from app.services.translation_provider import TranslationProvider, get_translation_provider
from app.services.translation_service import (
    TranslationGenerationError,
    generate_english,
    module_config,
    translation_status,
)


router = APIRouter(prefix="/management/translations", tags=["management-translations"])


class GenerateTranslationIn(BaseModel):
    force: bool = False


class BatchTranslationIn(BaseModel):
    force: bool = False
    limit: int = Field(default=50, ge=1, le=200)


def get_record_or_404(db: Session, module: str, record_id: int):
    try:
        model = module_config(module)["model"]
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    record = db.get(model, record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content record not found")
    return record


@router.post("/{module}/batch")
def batch_generate_english(
    module: str,
    payload: BatchTranslationIn,
    _current_user: AdminUser = Depends(get_current_admin_user),
    provider: TranslationProvider = Depends(get_translation_provider),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        model = module_config(module)["model"]
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    records = list(db.scalars(select(model).order_by(model.id)))
    summary = {"processed": 0, "current": 0, "failed": 0, "skipped": 0, "results": []}
    for record in records:
        if summary["processed"] >= payload.limit:
            break
        before = translation_status(record, module)
        if before.status == "current" and not payload.force:
            summary["skipped"] += 1
            summary["results"].append(asdict(before))
            continue
        summary["processed"] += 1
        try:
            result = generate_english(db, module, record.id, provider, force=payload.force)
            db.commit()
            summary["current"] += 1
        except TranslationGenerationError:
            db.commit()
            result = translation_status(record, module)
            summary["failed"] += 1
        summary["results"].append(asdict(result))
    return summary


@router.get("/{module}/{record_id}")
def get_english_status(
    module: str,
    record_id: int,
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    record = get_record_or_404(db, module, record_id)
    return asdict(translation_status(record, module))


@router.post("/{module}/{record_id}/generate")
def generate_record_english(
    module: str,
    record_id: int,
    payload: GenerateTranslationIn,
    _current_user: AdminUser = Depends(get_current_admin_user),
    provider: TranslationProvider = Depends(get_translation_provider),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    get_record_or_404(db, module, record_id)
    try:
        result = generate_english(db, module, record_id, provider, force=payload.force)
        db.commit()
        record = get_record_or_404(db, module, record_id)
        return {
            **asdict(result),
            "translation": dict((record.translations or {}).get("en", {})),
        }
    except TranslationGenerationError as exc:
        db.commit()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
