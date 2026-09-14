import re
import secrets
from datetime import UTC, datetime
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Category, Inquiry, Product, Solution
from app.schemas.inquiry import InquiryCreate, InquiryOut
from app.services.crm_inquiry_delivery import deliver_inquiry_to_crm
from app.services.cos_storage import get_cos_storage

router = APIRouter(prefix="/inquiries", tags=["inquiries"])
ATTACHMENT_DIR = Path("backend/uploads/inquiry-attachments")


def create_submission_number() -> str:
    date_part = datetime.now(UTC).strftime("%Y%m%d")
    return f"INQ-{date_part}-{secrets.token_hex(4).upper()}"


def clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def safe_filename(filename: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", Path(filename).name).strip(".-")
    return cleaned or "attachment"


async def save_attachment(attachment: UploadFile | None) -> tuple[str | None, str | None, str | None]:
    if attachment is None or not attachment.filename:
        return None, None, None

    ATTACHMENT_DIR.mkdir(parents=True, exist_ok=True)
    original_name = safe_filename(attachment.filename)
    stored_name = f"{secrets.token_urlsafe(10)}-{original_name}"
    target = ATTACHMENT_DIR / stored_name
    with target.open("wb") as output:
        while chunk := await attachment.read(1024 * 1024):
            output.write(chunk)

    attachment_url = get_cos_storage().publish_public_file(
        key=f"uploads/inquiry-attachments/{stored_name}",
        path=target,
        content_type=attachment.content_type or "application/octet-stream",
    )
    return attachment_url, attachment.filename, attachment.content_type


def validate_payload(data: dict[str, object]) -> InquiryCreate:
    try:
        return InquiryCreate.model_validate(data)
    except ValidationError as exc:
        for error in exc.errors():
            if "留下您的联系电话和邮箱" in str(error.get("msg", "")):
                raise HTTPException(status_code=422, detail="留下您的联系电话和邮箱，以便解决您的需求")
        raise HTTPException(status_code=422, detail=exc.errors())


async def parse_inquiry_payload(
    request: Request,
    name: str | None,
    company: str | None,
    email: str | None,
    phone: str | None,
    product_slug: str | None,
    solution_slug: str | None,
    message: str | None,
    source_page: str | None,
) -> InquiryCreate:
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("multipart/form-data"):
        return validate_payload({
            "name": clean_optional(name) or "",
            "company": clean_optional(company) or "",
            "email": clean_optional(email),
            "phone": clean_optional(phone),
            "product_slug": clean_optional(product_slug),
            "solution_slug": clean_optional(solution_slug),
            "message": clean_optional(message) or "",
            "source_page": clean_optional(source_page) or "",
        })

    data = await request.json()
    if not isinstance(data, dict):
        raise HTTPException(status_code=422, detail="Invalid inquiry payload")
    return validate_payload(data)


@router.post("", response_model=InquiryOut, status_code=201)
async def create_inquiry(
    request: Request,
    background_tasks: BackgroundTasks,
    name: str | None = Form(default=None),
    company: str | None = Form(default=None),
    email: str | None = Form(default=None),
    phone: str | None = Form(default=None),
    product_slug: str | None = Form(default=None),
    solution_slug: str | None = Form(default=None),
    message: str | None = Form(default=None),
    source_page: str | None = Form(default=None),
    attachment: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
) -> Inquiry:
    payload = await parse_inquiry_payload(request, name, company, email, phone, product_slug, solution_slug, message, source_page)
    product_code: str | None = None
    if payload.product_slug:
        product = db.scalar(
            select(Product).where(Product.slug == payload.product_slug, Product.is_active.is_(True))
        )
        category = db.scalar(
            select(Category).where(Category.slug == payload.product_slug, Category.is_active.is_(True))
        )
        if product is None and category is None:
            raise HTTPException(status_code=400, detail="Referenced product does not exist")
        product_code = product.product_code if product is not None else None

    if payload.solution_slug:
        solution = db.scalar(
            select(Solution).where(Solution.slug == payload.solution_slug, Solution.is_active.is_(True))
        )
        if solution is None:
            raise HTTPException(status_code=400, detail="Referenced solution does not exist")

    attachment_url, attachment_name, attachment_content_type = await save_attachment(attachment)
    inquiry = Inquiry(
        submission_number=create_submission_number(),
        name=payload.name.strip(),
        company=payload.company.strip(),
        email=str(payload.email).strip() if payload.email else None,
        phone=payload.phone.strip() if payload.phone else None,
        attachment_url=attachment_url,
        attachment_name=attachment_name,
        attachment_content_type=attachment_content_type,
        product_slug=payload.product_slug,
        product_code=product_code,
        solution_slug=payload.solution_slug,
        message=payload.message.strip(),
        source_page=payload.source_page.strip(),
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    background_tasks.add_task(deliver_inquiry_to_crm, inquiry.id)
    return inquiry
