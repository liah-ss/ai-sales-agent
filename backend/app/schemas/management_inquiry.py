from datetime import datetime

from pydantic import BaseModel, Field


class InquiryNoteCreate(BaseModel):
    note: str = Field(min_length=1, max_length=2000)


class InquiryStatusUpdate(BaseModel):
    status: str = Field(pattern="^(new|contacted|quoted|won|lost|archived)$")


class InquiryNoteOut(BaseModel):
    id: int
    inquiry_id: int
    admin_user_id: int
    note: str
    created_at: datetime
    admin_username: str


class ManagementInquiryOut(BaseModel):
    id: int
    submission_number: str
    name: str
    company: str
    email: str | None
    phone: str | None
    attachment_url: str | None
    attachment_name: str | None
    attachment_content_type: str | None
    product_slug: str | None
    product_code: str | None
    solution_slug: str | None
    message: str
    source_page: str
    status: str
    crm_status: str
    crm_attempts: int
    crm_last_error: str | None
    crm_synced_at: datetime | None
    created_at: datetime
    notes: list[InquiryNoteOut] = []
