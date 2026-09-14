from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator


class InquiryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    company: str = Field(min_length=1, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=80)
    product_slug: str | None = Field(default=None, max_length=220)
    solution_slug: str | None = Field(default=None, max_length=220)
    message: str = Field(min_length=1, max_length=4000)
    source_page: str = Field(min_length=1, max_length=500)

    @model_validator(mode="after")
    def require_contact_method(self) -> "InquiryCreate":
        if not self.email and not (self.phone or "").strip():
            raise ValueError("留下您的联系电话和邮箱，以便解决您的需求")
        return self


class InquiryOut(BaseModel):
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
    created_at: datetime

    model_config = {"from_attributes": True}
