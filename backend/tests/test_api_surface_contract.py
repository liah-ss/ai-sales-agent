import unittest
from datetime import date
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import get_current_admin_user, hash_password
from app.main import app
from app.models import (
    AdminUser,
    Banner,
    Category,
    Inquiry,
    NewsArticle,
    OperationLog,
    Product,
    SiteSetting,
    Solution,
    WebsiteConfig,
)
from app.routers.site_settings import DEFAULT_SETTINGS
from app.services.website_config_defaults import get_default_website_config


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
    return AdminUser(id=1, username="surface-admin", password_hash="test", role="super_admin", is_active=True)


client = TestClient(app)


class ApiSurfaceContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        Base.metadata.create_all(engine)

    def setUp(self) -> None:
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_admin_user] = override_admin_user
        with TestingSessionLocal() as db:
            for model in (
                OperationLog,
                Inquiry,
                Product,
                Category,
                Solution,
                NewsArticle,
                Banner,
                WebsiteConfig,
                SiteSetting,
                AdminUser,
            ):
                db.query(model).delete()

            admin = AdminUser(
                id=1,
                username="surface-admin",
                password_hash=hash_password("surface-password"),
                role="super_admin",
                is_active=True,
            )
            root = Category(name="Surface root", slug="surface-root", is_active=True, sort_order=1)
            db.add_all([admin, root])
            db.flush()
            child = Category(
                name="Surface child",
                slug="surface-child",
                parent_id=root.id,
                is_active=True,
                sort_order=1,
            )
            db.add(child)
            db.flush()
            db.add_all([
                Product(
                    category_id=child.id,
                    product_code="P-SURFACE-001",
                    name="Surface product",
                    slug="surface-product",
                    model="SURFACE-100",
                    summary="Surface product summary.",
                    is_active=True,
                    sort_order=1,
                ),
                Product(
                    category_id=child.id,
                    product_code="P-SURFACE-002",
                    name="Related surface product",
                    slug="related-surface-product",
                    model="SURFACE-200",
                    summary="Related surface product summary.",
                    is_active=True,
                    sort_order=2,
                ),
                Solution(
                    title="Surface solution",
                    slug="surface-solution",
                    summary="Surface solution summary.",
                    content="<p>Surface solution content.</p>",
                    is_active=True,
                    sort_order=1,
                ),
                NewsArticle(
                    title="Surface news",
                    slug="surface-news",
                    summary="Surface news summary.",
                    content="<p>Surface news content.</p>",
                    source="Surface contract",
                    published_at=date(2026, 7, 28),
                    is_active=True,
                    sort_order=1,
                ),
            ])
            db.commit()

    def test_root_authentication_and_current_user_contract(self) -> None:
        root = client.get("/")
        self.assertEqual(root.status_code, 200)
        self.assertEqual(root.json()["message"], "ExampleCorp API is running")

        app.dependency_overrides.pop(get_current_admin_user, None)
        login = client.post(
            "/api/management/auth/login",
            json={"username": "surface-admin", "password": "surface-password"},
        )
        self.assertEqual(login.status_code, 200)
        token = login.json()["access_token"]
        me = client.get(
            "/api/management/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["username"], "surface-admin")
        app.dependency_overrides[get_current_admin_user] = override_admin_user

    def test_site_settings_management_to_public_contract(self) -> None:
        management = client.get("/api/management/site-settings")
        public = client.get("/api/site-settings")
        self.assertEqual(management.status_code, 200)
        self.assertEqual(public.status_code, 200)
        self.assertEqual(management.json()["brand_name"], public.json()["brand_name"])
        self.assertEqual(
            [{key: item.get(key) for key in ("value", "label", "description")} for item in management.json()["home_metrics"]],
            [{key: item.get(key) for key in ("value", "label", "description")} for item in public.json()["home_metrics"]],
        )

        payload = {
            **DEFAULT_SETTINGS,
            "brand_name": "Surface Contract Brand",
            "facebook_url": "https://facebook.example/surface",
            "linkedin_url": "https://linkedin.example/in/surface",
        }
        saved = client.put("/api/management/site-settings", json=payload)
        reflected = client.get("/api/site-settings")
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(reflected.status_code, 200)
        self.assertEqual(reflected.json()["brand_name"], "Surface Contract Brand")
        self.assertEqual(reflected.json()["facebook_url"], payload["facebook_url"])
        self.assertEqual(reflected.json()["linkedin_url"], payload["linkedin_url"])

    def test_website_config_management_to_public_contract(self) -> None:
        management = client.get("/api/management/website-config")
        public = client.get("/api/website-config")
        self.assertEqual(management.status_code, 200)
        self.assertEqual(public.status_code, 200)
        self.assertEqual(management.json(), public.json())

        payload = get_default_website_config()
        payload["searchSettings"]["placeholder"] = "Surface contract search"
        saved = client.put("/api/management/website-config", json=payload)
        reflected = client.get("/api/website-config")
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(reflected.status_code, 200)
        self.assertEqual(reflected.json()["searchSettings"]["placeholder"], "Surface contract search")

    def test_public_detail_and_related_contracts(self) -> None:
        related = client.get("/api/products/surface-product/related")
        solution = client.get("/api/solutions/surface-solution")
        news = client.get("/api/news/surface-news")
        self.assertEqual(related.status_code, 200)
        self.assertEqual([item["slug"] for item in related.json()], ["related-surface-product"])
        self.assertEqual(solution.status_code, 200)
        self.assertEqual(solution.json()["slug"], "surface-solution")
        self.assertEqual(news.status_code, 200)
        self.assertEqual(news.json()["slug"], "surface-news")

    def test_public_inquiry_submission_contract(self) -> None:
        with patch("app.routers.inquiries.deliver_inquiry_to_crm"):
            response = client.post(
                "/api/inquiries",
                json={
                    "name": "Surface Buyer",
                    "company": "Surface Company",
                    "email": "surface@example.com",
                    "product_slug": "surface-product",
                    "message": "Please quote this product.",
                    "source_page": "/products/surface-product",
                },
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["product_code"], "P-SURFACE-001")
        self.assertTrue(response.json()["submission_number"].startswith("INQ-"))


if __name__ == "__main__":
    unittest.main()
