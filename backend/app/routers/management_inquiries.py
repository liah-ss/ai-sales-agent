from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models import AdminUser, Inquiry, InquiryNote
from app.schemas.management_inquiry import (
    InquiryNoteCreate,
    InquiryNoteOut,
    InquiryStatusUpdate,
    ManagementInquiryOut,
)
from app.services.operation_logger import model_snapshot, record_operation

router = APIRouter(prefix="/management/inquiries", tags=["management-inquiries"])


def note_to_out(note: InquiryNote) -> InquiryNoteOut:
    return InquiryNoteOut(
        id=note.id,
        inquiry_id=note.inquiry_id,
        admin_user_id=note.admin_user_id,
        note=note.note,
        created_at=note.created_at,
        admin_username=note.admin_user.username,
    )


def inquiry_to_out(inquiry: Inquiry, notes: list[InquiryNote]) -> ManagementInquiryOut:
    return ManagementInquiryOut(
        id=inquiry.id,
        submission_number=inquiry.submission_number,
        name=inquiry.name,
        company=inquiry.company,
        email=inquiry.email,
        phone=inquiry.phone,
        attachment_url=inquiry.attachment_url,
        attachment_name=inquiry.attachment_name,
        attachment_content_type=inquiry.attachment_content_type,
        product_slug=inquiry.product_slug,
        product_code=inquiry.product_code,
        solution_slug=inquiry.solution_slug,
        message=inquiry.message,
        source_page=inquiry.source_page,
        status=inquiry.status,
        crm_status=inquiry.crm_status,
        crm_attempts=inquiry.crm_attempts,
        crm_last_error=inquiry.crm_last_error,
        crm_synced_at=inquiry.crm_synced_at,
        created_at=inquiry.created_at,
        notes=[note_to_out(note) for note in notes],
    )


def get_inquiry_or_404(db: Session, inquiry_id: int) -> Inquiry:
    inquiry = db.get(Inquiry, inquiry_id)
    if inquiry is None:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return inquiry


def get_notes(db: Session, inquiry_id: int) -> list[InquiryNote]:
    return list(
        db.scalars(
            select(InquiryNote)
            .options(joinedload(InquiryNote.admin_user))
            .where(InquiryNote.inquiry_id == inquiry_id)
            .order_by(InquiryNote.created_at.desc(), InquiryNote.id.desc())
        )
    )


@router.get("", response_model=list[ManagementInquiryOut])
def list_inquiries(
    status: str | None = Query(default=None),
    q: str | None = Query(default=None),
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[ManagementInquiryOut]:
    statement = select(Inquiry)
    if status and status != "all":
        statement = statement.where(Inquiry.status == status)
    if q:
        term = f"%{q.strip()}%"
        statement = statement.where(
            or_(
                Inquiry.name.ilike(term),
                Inquiry.submission_number.ilike(term),
                Inquiry.company.ilike(term),
                Inquiry.email.ilike(term),
                Inquiry.phone.ilike(term),
                Inquiry.product_slug.ilike(term),
                Inquiry.product_code.ilike(term),
                Inquiry.solution_slug.ilike(term),
                Inquiry.message.ilike(term),
            )
        )

    inquiries = list(db.scalars(statement.order_by(Inquiry.created_at.desc(), Inquiry.id.desc())))
    notes_by_inquiry: dict[int, list[InquiryNote]] = {}
    if inquiries:
        inquiry_ids = [inquiry.id for inquiry in inquiries]
        notes = list(
            db.scalars(
                select(InquiryNote)
                .options(joinedload(InquiryNote.admin_user))
                .where(InquiryNote.inquiry_id.in_(inquiry_ids))
                .order_by(InquiryNote.created_at.desc(), InquiryNote.id.desc())
            )
        )
        for note in notes:
            notes_by_inquiry.setdefault(note.inquiry_id, []).append(note)

    return [inquiry_to_out(inquiry, notes_by_inquiry.get(inquiry.id, [])) for inquiry in inquiries]


@router.get("/{inquiry_id}", response_model=ManagementInquiryOut)
def get_inquiry(
    inquiry_id: int,
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> ManagementInquiryOut:
    inquiry = get_inquiry_or_404(db, inquiry_id)
    return inquiry_to_out(inquiry, get_notes(db, inquiry_id))


@router.patch("/{inquiry_id}/status", response_model=ManagementInquiryOut)
def update_inquiry_status(
    inquiry_id: int,
    payload: InquiryStatusUpdate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> ManagementInquiryOut:
    inquiry = get_inquiry_or_404(db, inquiry_id)
    before = model_snapshot(inquiry)
    inquiry.status = payload.status
    db.add(inquiry)
    record_operation(db, current_user, "询盘管理", "修改询盘状态", before, inquiry)
    db.commit()
    db.refresh(inquiry)
    return inquiry_to_out(inquiry, get_notes(db, inquiry_id))


@router.post("/{inquiry_id}/notes", response_model=ManagementInquiryOut, status_code=201)
def create_inquiry_note(
    inquiry_id: int,
    payload: InquiryNoteCreate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> ManagementInquiryOut:
    inquiry = get_inquiry_or_404(db, inquiry_id)
    note = InquiryNote(
        inquiry_id=inquiry.id,
        admin_user_id=current_user.id,
        note=payload.note.strip(),
    )
    db.add(note)
    db.flush()
    record_operation(
        db,
        current_user,
        "询盘管理",
        "新增询盘备注",
        model_snapshot(inquiry),
        {"inquiry_id": inquiry.id, "note_id": note.id, "note": note.note},
    )
    db.commit()
    db.refresh(inquiry)
    return inquiry_to_out(inquiry, get_notes(db, inquiry_id))


@router.delete("/{inquiry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inquiry(
    inquiry_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> None:
    inquiry = get_inquiry_or_404(db, inquiry_id)
    before = model_snapshot(inquiry)
    notes = list(db.scalars(select(InquiryNote).where(InquiryNote.inquiry_id == inquiry.id)))
    for note in notes:
        db.delete(note)
    db.delete(inquiry)
    record_operation(db, current_user, "询盘管理", "删除询盘", before, None)
    db.commit()
