import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import get_current_admin_user
from app.main import app
from app.models import AdminUser, Inquiry, InquiryNote, OperationLog


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def override_admin_user():
    return AdminUser(id=1, username="inquiry-admin", password_hash="test", role="super_admin", is_active=True)


client = TestClient(app)


class ManagementInquiryContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        Base.metadata.create_all(engine)

    def setUp(self) -> None:
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_admin_user] = override_admin_user
        with TestingSessionLocal() as db:
            for model in (OperationLog, InquiryNote, Inquiry, AdminUser):
                db.query(model).delete()
            db.add(AdminUser(
                id=1,
                username="inquiry-admin",
                password_hash="test",
                role="super_admin",
                is_active=True,
            ))
            inquiry = Inquiry(
                submission_number="INQ-CONTRACT-001",
                name="Contract Buyer",
                company="Contract Company",
                email="contract@example.com",
                phone=None,
                product_slug="contract-product",
                product_code="P-QA-001",
                solution_slug=None,
                message="Need a quotation.",
                source_page="/contact",
            )
            db.add(inquiry)
            db.commit()
            self.inquiry_id = inquiry.id

    def test_list_detail_status_note_and_delete_contract(self) -> None:
        listing = client.get("/api/management/inquiries?q=INQ-CONTRACT-001")
        detail = client.get(f"/api/management/inquiries/{self.inquiry_id}")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual([item["id"] for item in listing.json()], [self.inquiry_id])
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.json()["notes"], [])

        status_update = client.patch(
            f"/api/management/inquiries/{self.inquiry_id}/status",
            json={"status": "contacted"},
        )
        self.assertEqual(status_update.status_code, 200)
        self.assertEqual(status_update.json()["status"], "contacted")

        note = client.post(
            f"/api/management/inquiries/{self.inquiry_id}/notes",
            json={"note": "Buyer contacted by the sales team."},
        )
        self.assertEqual(note.status_code, 201)
        self.assertEqual(note.json()["notes"][0]["note"], "Buyer contacted by the sales team.")
        self.assertEqual(note.json()["notes"][0]["admin_username"], "inquiry-admin")

        deleted = client.delete(f"/api/management/inquiries/{self.inquiry_id}")
        self.assertEqual(deleted.status_code, 204)
        self.assertEqual(client.get(f"/api/management/inquiries/{self.inquiry_id}").status_code, 404)


if __name__ == "__main__":
    unittest.main()
