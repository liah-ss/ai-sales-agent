import unittest
from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import get_current_admin_user
from app.main import app
from app.models import AdminUser, PageView


engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def override_admin_user():
    return AdminUser(id=1, username="admin", password_hash="test", role="super_admin", is_active=True)


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_admin_user] = override_admin_user
client = TestClient(app)


class AnalyticsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        Base.metadata.create_all(engine)

    def setUp(self) -> None:
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_admin_user] = override_admin_user
        with TestingSessionLocal() as db:
            db.query(PageView).delete()
            db.add_all([
                PageView(event_date=date(2026, 7, 23), visitor_id="visitor-a", session_id="session-a", page_type="product", path="/zh-cn/products/a", ip_address="1.1.1.1"),
                PageView(event_date=date(2026, 7, 23), visitor_id="visitor-a", session_id="session-a", page_type="product", path="/zh-cn/products/a?tab=spec", ip_address="1.1.1.1"),
                PageView(event_date=date(2026, 7, 23), visitor_id="visitor-b", session_id="session-b", page_type="solution", path="/zh-cn/solutions/a", ip_address="2.2.2.2"),
                PageView(event_date=date(2026, 7, 23), visitor_id="crawler", session_id="session-c", page_type="contact", path="/zh-cn/contact", ip_address="3.3.3.3", is_bot=True),
                PageView(event_date=date(2026, 7, 24), visitor_id="visitor-a", session_id="session-a", page_type="about", path="/zh-cn/about", ip_address="1.1.1.1"),
                PageView(event_date=date(2026, 7, 24), visitor_id="visitor-c", session_id="session-c", page_type="contact", path="/zh-cn/contact", ip_address="4.4.4.4"),
                PageView(event_date=date(2026, 7, 24), visitor_id="local-v4", session_id="local-v4", page_type="product", path="/zh-cn/products/local", ip_address="127.0.0.1"),
                PageView(event_date=date(2026, 7, 24), visitor_id="local-v6", session_id="local-v6", page_type="about", path="/zh-cn/about", ip_address="::1"),
                PageView(event_date=date(2026, 7, 24), visitor_id="local-mapped", session_id="local-mapped", page_type="contact", path="/zh-cn/contact", ip_address="::ffff:127.0.0.1"),
            ])
            db.commit()

    def test_report_returns_all_dates_and_excludes_bots(self) -> None:
        response = client.get("/api/management/analytics/report?start_date=2026-07-23&end_date=2026-07-24")
        self.assertEqual(response.status_code, 200)
        rows = response.json()["rows"]
        self.assertEqual([row["date"] for row in rows], ["2026-07-24", "2026-07-23"])
        self.assertEqual(rows[1]["visits_pv"], 3)
        self.assertEqual(rows[1]["visits_uv"], 2)
        self.assertEqual(rows[1]["product_page_pv"], 2)
        self.assertEqual(rows[1]["product_page_uv"], 1)
        self.assertEqual(rows[1]["solution_page_uv"], 1)
        self.assertEqual(rows[1]["contact_page_pv"], 0)

    def test_report_excludes_existing_loopback_rows(self) -> None:
        response = client.get("/api/management/analytics/report?start_date=2026-07-24&end_date=2026-07-24")
        self.assertEqual(response.status_code, 200)
        row = response.json()["rows"][0]
        self.assertEqual(row["visits_pv"], 2)
        self.assertEqual(row["product_page_pv"], 0)
        self.assertEqual(row["about_page_pv"], 1)
        self.assertEqual(row["contact_page_pv"], 1)

    def test_logs_keep_bot_marker_and_support_search(self) -> None:
        response = client.get("/api/management/analytics/logs?start_date=2026-07-23&end_date=2026-07-23&q=3.3.3.3")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 1)
        self.assertTrue(response.json()["items"][0]["is_bot"])

    def test_logs_exclude_existing_loopback_rows(self) -> None:
        response = client.get("/api/management/analytics/logs?start_date=2026-07-24&end_date=2026-07-24")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 2)
        self.assertNotIn("127.0.0.1", [item["ip_address"] for item in response.json()["items"]])

    def test_public_page_view_captures_ip_and_classifies_path(self) -> None:
        response = client.post(
            "/api/analytics/page-view",
            headers={"x-forwarded-for": "10.0.0.8, 10.0.0.9", "user-agent": "Mozilla/5.0"},
            json={"visitor_id": "visitor-new", "session_id": "session-new", "path": "/en/products/transformer"},
        )
        self.assertEqual(response.status_code, 202)
        with TestingSessionLocal() as db:
            event = db.query(PageView).filter(PageView.visitor_id == "visitor-new").one()
            self.assertEqual(event.ip_address, "10.0.0.8")
            self.assertEqual(event.page_type, "product")
            self.assertFalse(event.is_bot)

    def test_public_page_view_ignores_loopback_addresses(self) -> None:
        for loopback in ("127.0.0.1", "::1", "::ffff:127.0.0.1"):
            response = client.post(
                "/api/analytics/page-view",
                headers={"x-forwarded-for": loopback},
                json={"visitor_id": f"ignored-{loopback}", "session_id": "local-session", "path": "/zh-cn/about"},
            )
            self.assertEqual(response.status_code, 202)

        with TestingSessionLocal() as db:
            ignored_count = db.query(PageView).filter(PageView.visitor_id.like("ignored-%")).count()
            self.assertEqual(ignored_count, 0)

    def test_web_vitals_endpoint_accepts_browser_payload(self) -> None:
        response = client.post(
            "/api/rum/web-vitals",
            headers={"x-forwarded-for": "10.0.0.8"},
            json={
                "name": "LCP",
                "value": 1200.5,
                "rating": "good",
                "path": "/id/products/chint-p001-nw5",
                "locale": "id-ID",
                "viewport": "1440x900",
            },
        )
        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.json(), {"accepted": True})


if __name__ == "__main__":
    unittest.main()
