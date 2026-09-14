import unittest
from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import get_current_admin_user
from app.main import app
from app.models import AdminUser, DeliveryCase


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


class ManagementDeliveryCaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        Base.metadata.create_all(engine)

    def setUp(self) -> None:
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_admin_user] = override_admin_user
        with TestingSessionLocal() as db:
            db.query(DeliveryCase).delete()
            db.commit()

    def test_create_case_uses_body_without_location_or_cover_url(self) -> None:
        response = client.post("/api/management/catalog/delivery-cases", json={
            "title": "Factory power delivery",
            "slug": "factory-power-delivery",
            "summary": "Delivered electrical equipment.",
            "content": "<p>Project body</p>",
            "client_name": "PT Example",
            "industry": "Manufacturing",
            "delivered_at": "2026-07-14",
        })

        self.assertEqual(response.status_code, 201)
        self.assertNotIn("location", response.json())
        self.assertNotIn("thumbnail_url", response.json())

    def test_public_case_keeps_legacy_image_for_existing_records(self) -> None:
        with TestingSessionLocal() as db:
            db.add(DeliveryCase(
                title="Legacy image case",
                slug="legacy-image-case",
                summary="Existing case image",
                content="<p>Body without an image</p>",
                thumbnail_url="/delivery-case-assets/legacy.jpg",
                client_name="PT Legacy",
                industry="Utilities",
                location="",
                delivered_at=date(2026, 7, 1),
                is_active=True,
            ))
            db.commit()

        response = client.get("/api/delivery-cases/legacy-image-case")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["thumbnail_url"], "/delivery-case-assets/legacy.jpg")


if __name__ == "__main__":
    unittest.main()
