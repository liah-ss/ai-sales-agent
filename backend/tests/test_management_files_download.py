import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.config import Settings
from app.core.security import get_current_admin_user
from app.main import app
from app.models import AdminUser, ManagedFile
from app.routers import management_files
from app.services.cos_storage import CosStorage


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


class ManagementFileDownloadTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        Base.metadata.create_all(engine)

    def setUp(self) -> None:
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_admin_user] = override_admin_user
        self.temp_dir = tempfile.TemporaryDirectory()
        self.original_upload_root = management_files.UPLOAD_ROOT
        management_files.UPLOAD_ROOT = Path(self.temp_dir.name)
        self.storage_patch = patch.object(
            management_files,
            "get_cos_storage",
            return_value=CosStorage(Settings(cos_upload_enabled=False)),
        )
        self.storage_patch.start()
        with TestingSessionLocal() as db:
            db.query(ManagedFile).delete()
            if db.get(AdminUser, 1) is None:
                db.add(AdminUser(id=1, username="admin", password_hash="test", role="super_admin", is_active=True))
            db.commit()

    def tearDown(self) -> None:
        self.storage_patch.stop()
        management_files.UPLOAD_ROOT = self.original_upload_root
        self.temp_dir.cleanup()

    def test_uploaded_file_can_be_downloaded(self) -> None:
        upload = client.post(
            "/api/management/files",
            files={"file": ("datasheet.txt", b"finder file content", "text/plain")},
            data={"usage": "product"},
        )

        self.assertEqual(upload.status_code, 201)
        self.assertEqual(upload.json()["usage"], "product")

        download = client.get(f"/api/management/files/{upload.json()['id']}/download")

        self.assertEqual(download.status_code, 200)
        self.assertEqual(download.content, b"finder file content")
        self.assertIn("datasheet.txt", download.headers["content-disposition"])

    def test_cos_file_is_streamed_through_the_authenticated_api(self) -> None:
        class FakeBody:
            def get_raw_stream(self):
                return BytesIO(b"cos file content")

        class FakeCosClient:
            def __init__(self) -> None:
                self.request = None

            def get_object(self, **kwargs):
                self.request = kwargs
                return {"Body": FakeBody()}

        fake_client = FakeCosClient()
        cos_storage = CosStorage(
            Settings(
                cos_upload_enabled=True,
                cos_bucket="test-bucket",
                cos_region="test-region",
                cos_secret_id="test-secret-id",
                cos_secret_key="test-secret-key",
            ),
            client=fake_client,
        )
        with TestingSessionLocal() as db:
            record = ManagedFile(
                original_name="COS 参数表.txt",
                stored_name="cos-file.txt",
                url="/uploads/files/cos-file.txt",
                content_type="text/plain",
                size=16,
                usage="product",
                uploaded_by_id=1,
            )
            db.add(record)
            db.commit()
            file_id = record.id

        with patch.object(management_files, "get_cos_storage", return_value=cos_storage):
            download = client.get(f"/api/management/files/{file_id}/download")

        self.assertEqual(download.status_code, 200)
        self.assertEqual(download.content, b"cos file content")
        self.assertEqual(
            fake_client.request,
            {"Bucket": "test-bucket", "Key": "uploads/files/cos-file.txt"},
        )
        self.assertIn("COS%20%E5%8F%82%E6%95%B0%E8%A1%A8.txt", download.headers["content-disposition"])

    def test_file_list_update_and_active_contract(self) -> None:
        upload = client.post(
            "/api/management/files",
            files={"file": ("catalog.txt", b"catalog contract", "text/plain")},
            data={"usage": "general", "tags": "initial"},
        )
        self.assertEqual(upload.status_code, 201)
        file_id = upload.json()["id"]

        listing = client.get("/api/management/files?usage=general&q=initial")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual([item["id"] for item in listing.json()], [file_id])

        updated = client.put(
            f"/api/management/files/{file_id}",
            json={"usage": "product", "tags": "updated datasheet", "is_active": True},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["usage"], "product")
        self.assertEqual(updated.json()["tags"], "updated datasheet")

        archived = client.patch(
            f"/api/management/files/{file_id}/active",
            json={"is_active": False},
        )
        self.assertEqual(archived.status_code, 200)
        self.assertFalse(archived.json()["is_active"])
        self.assertEqual(client.get("/api/management/files").json(), [])

        archived_listing = client.get("/api/management/files?include_archived=true&q=updated")
        self.assertEqual(archived_listing.status_code, 200)
        self.assertEqual([item["id"] for item in archived_listing.json()], [file_id])


if __name__ == "__main__":
    unittest.main()
