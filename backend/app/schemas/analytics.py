from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class PageViewCreate(BaseModel):
    visitor_id: str = Field(min_length=8, max_length=80, pattern=r"^[A-Za-z0-9._:-]+$")
    session_id: str = Field(min_length=8, max_length=80, pattern=r"^[A-Za-z0-9._:-]+$")
    path: str = Field(min_length=1, max_length=500)
    page_title: str | None = Field(default=None, max_length=300)
    referrer: str | None = Field(default=None, max_length=1000)
    language: str | None = Field(default=None, max_length=32)
    screen_size: str | None = Field(default=None, max_length=32)


class PageViewAccepted(BaseModel):
    accepted: bool = True


class AnalyticsDailyRow(BaseModel):
    date: date
    visits_pv: int
    visits_uv: int
    product_page_pv: int
    product_page_uv: int
    solution_page_pv: int
    solution_page_uv: int
    about_page_pv: int
    about_page_uv: int
    contact_page_pv: int
    contact_page_uv: int


class AnalyticsReportOut(BaseModel):
    start_date: date
    end_date: date
    rows: list[AnalyticsDailyRow]


class PageViewLogOut(BaseModel):
    id: int
    visitor_id: str
    session_id: str
    page_type: str
    path: str
    page_title: str | None
    ip_address: str
    referrer: str | None
    user_agent: str | None
    language: str | None
    screen_size: str | None
    is_bot: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PageViewLogListOut(BaseModel):
    items: list[PageViewLogOut]
    total: int
    page: int
    page_size: int


AnalyticsPageType = Literal["all", "product", "solution", "about", "contact", "other"]
