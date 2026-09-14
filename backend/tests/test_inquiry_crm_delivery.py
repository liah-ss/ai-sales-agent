import asyncio
from datetime import datetime
from types import SimpleNamespace

import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import Inquiry
from app.services import crm_inquiry_delivery


def test_crm_delivery_retries_and_records_success(monkeypatch) -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    test_session = sessionmaker(bind=engine)
    with test_session() as db:
        inquiry = Inquiry(
            submission_number="INQ-20260723-ABC12345",
            name="Test User",
            company="Test Co",
            email="test@example.com",
            phone=None,
            product_slug="low-voltage",
            product_code=None,
            solution_slug=None,
            message="Need a quote",
            source_page="/contact",
            created_at=datetime(2026, 7, 23, 12, 0, 0),
        )
        db.add(inquiry)
        db.commit()
        inquiry_id = inquiry.id

    settings = SimpleNamespace(
        crm_inquiry_webhook_url="https://crm.example.com/inquiries",
        crm_inquiry_webhook_token="secret",
        crm_inquiry_timeout_seconds=1,
        crm_inquiry_retry_attempts=3,
        crm_inquiry_retry_delay_seconds=0,
    )

    class FakeAsyncClient:
        attempts = 0

        def __init__(self, **_kwargs) -> None:
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args) -> None:
            return None

        async def post(self, url, *, json, headers):
            FakeAsyncClient.attempts += 1
            assert url.startswith("https://")
            assert json["submission_number"] == "INQ-20260723-ABC12345"
            assert headers["Idempotency-Key"] == "INQ-20260723-ABC12345"
            request = httpx.Request("POST", url)
            if FakeAsyncClient.attempts < 3:
                raise httpx.ConnectError("temporary failure", request=request)
            return httpx.Response(200, request=request)

    monkeypatch.setattr(crm_inquiry_delivery, "SessionLocal", test_session)
    monkeypatch.setattr(crm_inquiry_delivery, "get_settings", lambda: settings)
    monkeypatch.setattr(crm_inquiry_delivery.httpx, "AsyncClient", FakeAsyncClient)

    asyncio.run(crm_inquiry_delivery.deliver_inquiry_to_crm(inquiry_id))

    with test_session() as db:
        delivered = db.get(Inquiry, inquiry_id)
        assert delivered is not None
        assert delivered.crm_status == "synced"
        assert delivered.crm_attempts == 3
        assert delivered.crm_last_error is None
        assert delivered.crm_synced_at is not None

