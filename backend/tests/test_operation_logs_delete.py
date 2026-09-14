import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import get_current_admin_user
from app.main import app
from app.models import AdminUser, OperationLog


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


class OperationLogDeleteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        Base.metadata.create_all(engine)

    def setUp(self) -> None:
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_admin_user] = override_admin_user
        with TestingSessionLocal() as db:
            db.query(OperationLog).delete()
            db.add_all([
                OperationLog(
                    admin_username="admin",
                    module="产品管理",
                    action="更新产品",
                    before_data={"name": "旧产品"},
                    after_data={"name": "新产品"},
                ),
                OperationLog(admin_username="admin", module="网站内容", action="保存页面"),
                OperationLog(admin_username="editor", module="资讯管理", action="更新资讯"),
            ])
            db.commit()

    def log_ids(self) -> list[int]:
        with TestingSessionLocal() as db:
            return list(db.scalars(select(OperationLog.id).order_by(OperationLog.id)))

    def test_delete_single_log(self) -> None:
        log_id = self.log_ids()[0]

        response = client.delete(f"/api/management/operation-logs/{log_id}")

        self.assertEqual(response.status_code, 204)
        self.assertNotIn(log_id, self.log_ids())
        self.assertEqual(client.delete(f"/api/management/operation-logs/{log_id}").status_code, 404)

    def test_list_omits_change_payload_and_detail_returns_it(self) -> None:
        response = client.get("/api/management/operation-logs?limit=100")

        self.assertEqual(response.status_code, 200)
        first = next(item for item in response.json() if item["module"] == "产品管理")
        self.assertNotIn("before_data", first)
        self.assertNotIn("after_data", first)

        detail = client.get(f"/api/management/operation-logs/{first['id']}")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.json()["before_data"]["name"], "旧产品")
        self.assertEqual(detail.json()["after_data"]["name"], "新产品")

    def test_batch_delete_only_existing_ids(self) -> None:
        first, second, third = self.log_ids()

        response = client.post(
            "/api/management/operation-logs/batch-delete",
            json={"ids": [first, second, second, 999999]},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["deletedCount"], 2)
        self.assertEqual(set(response.json()["deletedIds"]), {first, second})
        self.assertEqual(self.log_ids(), [third])


if __name__ == "__main__":
    unittest.main()
