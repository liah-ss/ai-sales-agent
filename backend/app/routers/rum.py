import logging

from fastapi import APIRouter, Request, status
from pydantic import BaseModel, ConfigDict, Field


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rum", tags=["rum"])
ALLOWED_METRICS = {"CLS", "INP", "LCP", "TTFB"}


class WebVitalPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    value: float
    rating: str | None = None
    navigation_type: str | None = Field(default=None, max_length=40)
    path: str | None = Field(default=None, max_length=500)
    locale: str | None = Field(default=None, max_length=20)
    viewport: str | None = Field(default=None, max_length=30)


@router.post("/web-vitals", status_code=status.HTTP_202_ACCEPTED)
def capture_web_vital(payload: WebVitalPayload, request: Request) -> dict[str, bool]:
    """Accept browser performance metrics without making page delivery depend on them."""
    if payload.name not in ALLOWED_METRICS:
        return {"accepted": False}

    logger.info(
        "web_vital name=%s value=%s rating=%s path=%s locale=%s ip=%s",
        payload.name,
        payload.value,
        payload.rating or "",
        (payload.path or "/")[:500],
        (payload.locale or "")[:20],
        request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown").split(",", 1)[0].strip(),
    )
    return {"accepted": True}
