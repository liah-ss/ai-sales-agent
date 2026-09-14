import asyncio
from datetime import UTC, datetime

import httpx

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models import Inquiry


def crm_payload(inquiry: Inquiry) -> dict[str, object]:
    return {
        "submission_number": inquiry.submission_number,
        "name": inquiry.name,
        "company": inquiry.company,
        "email": inquiry.email,
        "phone": inquiry.phone,
        "product_slug": inquiry.product_slug,
        "product_code": inquiry.product_code,
        "solution_slug": inquiry.solution_slug,
        "message": inquiry.message,
        "source_page": inquiry.source_page,
        "attachment_url": inquiry.attachment_url,
        "created_at": inquiry.created_at.replace(tzinfo=UTC).isoformat(),
    }


async def deliver_inquiry_to_crm(inquiry_id: int) -> None:
    settings = get_settings()
    webhook_url = settings.crm_inquiry_webhook_url.strip()
    if not webhook_url:
        with SessionLocal() as db:
            inquiry = db.get(Inquiry, inquiry_id)
            if inquiry:
                inquiry.crm_status = "not_configured"
                db.commit()
        return

    if not webhook_url.startswith("https://"):
        with SessionLocal() as db:
            inquiry = db.get(Inquiry, inquiry_id)
            if inquiry:
                inquiry.crm_status = "failed"
                inquiry.crm_last_error = "CRM_INQUIRY_WEBHOOK_URL must use HTTPS"
                db.commit()
        return

    attempts = max(1, settings.crm_inquiry_retry_attempts)
    headers = {"Content-Type": "application/json"}
    if settings.crm_inquiry_webhook_token:
        headers["Authorization"] = f"Bearer {settings.crm_inquiry_webhook_token}"

    for attempt in range(1, attempts + 1):
        with SessionLocal() as db:
            inquiry = db.get(Inquiry, inquiry_id)
            if inquiry is None:
                return
            payload = crm_payload(inquiry)
            submission_number = inquiry.submission_number

        try:
            async with httpx.AsyncClient(timeout=settings.crm_inquiry_timeout_seconds) as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    headers={**headers, "Idempotency-Key": submission_number},
                )
                response.raise_for_status()
            with SessionLocal() as db:
                inquiry = db.get(Inquiry, inquiry_id)
                if inquiry:
                    inquiry.crm_status = "synced"
                    inquiry.crm_attempts = attempt
                    inquiry.crm_last_error = None
                    inquiry.crm_synced_at = datetime.now(UTC).replace(tzinfo=None)
                    db.commit()
            return
        except (httpx.HTTPError, httpx.TimeoutException) as exc:
            with SessionLocal() as db:
                inquiry = db.get(Inquiry, inquiry_id)
                if inquiry:
                    inquiry.crm_status = "retrying" if attempt < attempts else "failed"
                    inquiry.crm_attempts = attempt
                    inquiry.crm_last_error = str(exc)[:2000]
                    db.commit()
            if attempt < attempts:
                await asyncio.sleep(settings.crm_inquiry_retry_delay_seconds * attempt)
