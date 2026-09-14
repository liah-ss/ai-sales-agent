import re
from ipaddress import ip_address
from datetime import date, datetime, timedelta
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models import AdminUser, PageView
from app.schemas.analytics import (
    AnalyticsDailyRow,
    AnalyticsPageType,
    AnalyticsReportOut,
    PageViewAccepted,
    PageViewCreate,
    PageViewLogListOut,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])
management_router = APIRouter(prefix="/management/analytics", tags=["management-analytics"])
BOT_PATTERN = re.compile(
    r"bot|crawler|spider|slurp|bingpreview|facebookexternalhit|headlesschrome|lighthouse|pagespeed",
    re.IGNORECASE,
)
TRACKED_PAGE_TYPES = ("product", "solution", "about", "contact")


def analytics_timezone() -> ZoneInfo:
    try:
        return ZoneInfo(get_settings().analytics_timezone)
    except ZoneInfoNotFoundError:
        return ZoneInfo("UTC")


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()[:64]
    real_ip = request.headers.get("x-real-ip", "").strip()
    if real_ip:
        return real_ip[:64]
    return (request.client.host if request.client else "unknown")[:64]


def is_loopback_address(value: str) -> bool:
    try:
        address = ip_address(value)
    except ValueError:
        return False
    if address.is_loopback:
        return True
    mapped_address = getattr(address, "ipv4_mapped", None)
    return bool(mapped_address and mapped_address.is_loopback)


def exclude_loopback_rows():
    normalized_ip = func.lower(PageView.ip_address)
    return ~or_(
        normalized_ip.like("127.%"),
        normalized_ip == "::1",
        normalized_ip.like("::ffff:127.%"),
    )


def normalize_path(value: str) -> str:
    parsed = urlsplit(value.strip())
    path = parsed.path or "/"
    if not path.startswith("/"):
        path = f"/{path}"
    query = f"?{parsed.query}" if parsed.query else ""
    return f"{path}{query}"[:500]


def classify_page(path: str) -> str:
    segments = [segment for segment in urlsplit(path).path.split("/") if segment]
    if segments and segments[0].lower() in {"id", "en", "zh-cn"}:
        segments = segments[1:]
    if len(segments) >= 2 and segments[0] == "products":
        return "product"
    if len(segments) >= 2 and segments[0] == "solutions":
        return "solution"
    if segments == ["about"]:
        return "about"
    if segments == ["contact"]:
        return "contact"
    return "other"


def validate_date_range(start_date: date, end_date: date) -> None:
    if start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date must not be later than end_date")
    if (end_date - start_date).days > 366:
        raise HTTPException(status_code=422, detail="Date range cannot exceed 367 days")


def default_date_range() -> tuple[date, date]:
    end_date = datetime.now(analytics_timezone()).date()
    return end_date - timedelta(days=29), end_date


@router.post("/page-view", response_model=PageViewAccepted, status_code=status.HTTP_202_ACCEPTED)
def create_page_view(
    payload: PageViewCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> PageViewAccepted:
    path = normalize_path(payload.path)
    user_agent = request.headers.get("user-agent", "").strip()[:2000] or None
    ip = client_ip(request)
    if is_loopback_address(ip):
        return PageViewAccepted()
    page_view = PageView(
        event_date=datetime.now(analytics_timezone()).date(),
        visitor_id=payload.visitor_id,
        session_id=payload.session_id,
        page_type=classify_page(path),
        path=path,
        page_title=(payload.page_title or "").strip()[:300] or None,
        ip_address=ip,
        referrer=(payload.referrer or "").strip()[:1000] or None,
        user_agent=user_agent,
        language=(payload.language or "").strip()[:32] or None,
        screen_size=(payload.screen_size or "").strip()[:32] or None,
        is_bot=bool(BOT_PATTERN.search(user_agent or "")),
    )
    db.add(page_view)
    db.commit()
    return PageViewAccepted()


@management_router.get("/report", response_model=AnalyticsReportOut)
def get_analytics_report(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> AnalyticsReportOut:
    default_start, default_end = default_date_range()
    start = start_date or default_start
    end = end_date or default_end
    validate_date_range(start, end)

    buckets: dict[date, dict[str, object]] = {}
    cursor = start
    while cursor <= end:
        buckets[cursor] = {
            "visits_pv": 0,
            "visits_uv": set(),
            **{f"{page_type}_page_pv": 0 for page_type in TRACKED_PAGE_TYPES},
            **{f"{page_type}_page_uv": set() for page_type in TRACKED_PAGE_TYPES},
        }
        cursor += timedelta(days=1)

    events = db.execute(
        select(PageView.event_date, PageView.page_type, PageView.visitor_id).where(
            PageView.event_date >= start,
            PageView.event_date <= end,
            PageView.is_bot.is_(False),
            exclude_loopback_rows(),
        )
    ).all()
    for event_date, page_type, visitor_id in events:
        bucket = buckets[event_date]
        bucket["visits_pv"] = int(bucket["visits_pv"]) + 1
        cast_visitors = bucket["visits_uv"]
        assert isinstance(cast_visitors, set)
        cast_visitors.add(visitor_id)
        if page_type in TRACKED_PAGE_TYPES:
            pv_key = f"{page_type}_page_pv"
            uv_key = f"{page_type}_page_uv"
            bucket[pv_key] = int(bucket[pv_key]) + 1
            page_visitors = bucket[uv_key]
            assert isinstance(page_visitors, set)
            page_visitors.add(visitor_id)

    rows = [
        AnalyticsDailyRow(
            date=event_date,
            visits_pv=int(bucket["visits_pv"]),
            visits_uv=len(bucket["visits_uv"]),
            product_page_pv=int(bucket["product_page_pv"]),
            product_page_uv=len(bucket["product_page_uv"]),
            solution_page_pv=int(bucket["solution_page_pv"]),
            solution_page_uv=len(bucket["solution_page_uv"]),
            about_page_pv=int(bucket["about_page_pv"]),
            about_page_uv=len(bucket["about_page_uv"]),
            contact_page_pv=int(bucket["contact_page_pv"]),
            contact_page_uv=len(bucket["contact_page_uv"]),
        )
        for event_date, bucket in sorted(buckets.items(), reverse=True)
    ]
    return AnalyticsReportOut(start_date=start, end_date=end, rows=rows)


@management_router.get("/logs", response_model=PageViewLogListOut)
def list_page_view_logs(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    page_type: AnalyticsPageType = Query(default="all"),
    q: str | None = Query(default=None, max_length=200),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> PageViewLogListOut:
    default_start, default_end = default_date_range()
    start = start_date or default_start
    end = end_date or default_end
    validate_date_range(start, end)

    filters = [
        PageView.event_date >= start,
        PageView.event_date <= end,
        exclude_loopback_rows(),
    ]
    if page_type != "all":
        filters.append(PageView.page_type == page_type)
    if q and q.strip():
        term = f"%{q.strip()}%"
        filters.append(or_(
            PageView.ip_address.ilike(term),
            PageView.path.ilike(term),
            PageView.visitor_id.ilike(term),
            PageView.referrer.ilike(term),
            PageView.user_agent.ilike(term),
        ))

    total = int(db.scalar(select(func.count(PageView.id)).where(*filters)) or 0)
    items = list(db.scalars(
        select(PageView)
        .where(*filters)
        .order_by(PageView.created_at.desc(), PageView.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ))
    return PageViewLogListOut(items=items, total=total, page=page, page_size=page_size)
