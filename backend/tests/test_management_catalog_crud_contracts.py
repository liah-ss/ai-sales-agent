import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import get_current_admin_user
from app.main import app
from app.models import (
    AdminUser,
    Category,
    DeliveryCase,
    NewsArticle,
    OperationLog,
    Product,
    Solution,
)
from app.routers import management_catalog


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
    return AdminUser(id=1, username="contract-admin", password_hash="test", role="super_admin", is_active=True)


client = TestClient(app)


def category_payload(*, name: str, slug: str, parent_id: int | None = None) -> dict:
    return {
        "name": name,
        "slug": slug,
        "parent_id": parent_id,
        "color": "#145b75",
        "sort_order": 10,
        "is_active": True,
    }


def product_payload(category_id: int, *, name: str, slug: str, product_code: str) -> dict:
    return {
        "category_id": category_id,
        "product_code": product_code,
        "name": name,
        "slug": slug,
        "model": "QA-100",
        "summary": "Isolated catalog contract product.",
        "sort_order": 10,
        "is_active": True,
    }


def solution_payload(*, title: str, slug: str) -> dict:
    return {
        "title": title,
        "slug": slug,
        "summary": "Isolated solution summary.",
        "content": "<p>Isolated solution content.</p>",
        "scenarios": ["Industrial park"],
        "sort_order": 10,
        "is_active": True,
    }


def news_payload(*, title: str, slug: str) -> dict:
    return {
        "title": title,
        "slug": slug,
        "summary": "Isolated news summary.",
        "content": "<p>Isolated news content.</p>",
        "source": "Contract test",
        "published_at": "2026-07-28",
        "sort_order": 10,
        "is_active": True,
    }


def delivery_case_payload(*, title: str, slug: str) -> dict:
    return {
        "title": title,
        "slug": slug,
        "summary": "Isolated delivery case summary.",
        "content": "<p>Isolated delivery case content.</p>",
        "client_name": "Contract Client",
        "industry": "Utilities",
        "delivered_at": "2026-07-28",
        "sort_order": 10,
        "is_active": True,
    }


class ManagementCatalogCrudContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        Base.metadata.create_all(engine)

    def setUp(self) -> None:
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_admin_user] = override_admin_user
        with TestingSessionLocal() as db:
            for model in (OperationLog, Product, Category, Solution, NewsArticle, DeliveryCase, AdminUser):
                db.query(model).delete()
            db.commit()

    def test_catalog_counts_contract(self) -> None:
        root = client.post(
            "/api/management/catalog/categories",
            json=category_payload(name="Counts root", slug="counts-root"),
        )
        child = client.post(
            "/api/management/catalog/categories",
            json=category_payload(name="Counts child", slug="counts-child", parent_id=root.json()["id"]),
        )
        client.post(
            "/api/management/catalog/products",
            json=product_payload(
                child.json()["id"],
                name="Counts product",
                slug="counts-product",
                product_code="P-COUNTS-001",
            ),
        )
        client.post(
            "/api/management/catalog/products",
            json={
                **product_payload(
                    child.json()["id"],
                    name="Inactive counts product",
                    slug="inactive-counts-product",
                    product_code="P-COUNTS-002",
                ),
                "is_active": False,
            },
        )
        client.post(
            "/api/management/catalog/solutions",
            json=solution_payload(title="Counts solution", slug="counts-solution"),
        )
        client.post(
            "/api/management/catalog/news",
            json=news_payload(title="Counts news", slug="counts-news"),
        )
        client.post(
            "/api/management/catalog/delivery-cases",
            json=delivery_case_payload(title="Counts case", slug="counts-case"),
        )

        response = client.get("/api/management/catalog/counts")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "categories": 2,
            "products": 2,
            "active_products": 1,
            "solutions": 1,
            "news": 1,
            "delivery_cases": 1,
        })

    def test_category_complete_crud_bulk_and_active_contract(self) -> None:
        created = client.post(
            "/api/management/catalog/categories",
            json=category_payload(name="Contract category", slug="contract-category"),
        )
        self.assertEqual(created.status_code, 201)
        category_id = created.json()["id"]

        listing = client.get("/api/management/catalog/categories")
        detail = client.get(f"/api/management/catalog/categories/{category_id}")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.json()["slug"], "contract-category")

        updated_payload = category_payload(name="Updated category", slug="contract-category-updated")
        updated = client.put(f"/api/management/catalog/categories/{category_id}", json=updated_payload)
        disabled = client.patch(
            f"/api/management/catalog/categories/{category_id}/active",
            json={"is_active": False},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["name"], "Updated category")
        self.assertEqual(disabled.status_code, 200)
        self.assertFalse(disabled.json()["is_active"])

        deleted = client.delete(f"/api/management/catalog/categories/{category_id}")
        self.assertEqual(deleted.status_code, 204)
        self.assertEqual(client.get(f"/api/management/catalog/categories/{category_id}").status_code, 404)

        bulk = client.post(
            "/api/management/catalog/categories/bulk",
            json={"items": [
                category_payload(name="Bulk category A", slug="bulk-category-a"),
                category_payload(name="Bulk category B", slug="bulk-category-b"),
            ]},
        )
        self.assertEqual(bulk.status_code, 201)
        self.assertEqual([item["slug"] for item in bulk.json()], ["bulk-category-a", "bulk-category-b"])

    def test_product_complete_crud_bulk_and_active_contract(self) -> None:
        root = client.post(
            "/api/management/catalog/categories",
            json=category_payload(name="Root category", slug="contract-root"),
        )
        self.assertEqual(root.status_code, 201)
        child = client.post(
            "/api/management/catalog/categories",
            json=category_payload(
                name="Child category",
                slug="contract-child",
                parent_id=root.json()["id"],
            ),
        )
        self.assertEqual(child.status_code, 201)
        child_id = child.json()["id"]

        payload = product_payload(
            child_id,
            name="Contract product",
            slug="contract-product",
            product_code="P-QA-001",
        )
        created = client.post("/api/management/catalog/products", json=payload)
        self.assertEqual(created.status_code, 201)
        product_id = created.json()["id"]

        listing = client.get("/api/management/catalog/products?q=P-QA-001")
        detail = client.get(f"/api/management/catalog/products/{product_id}")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json()["total"], 1)
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.json()["product_code"], "P-QA-001")

        payload["name"] = "Updated contract product"
        updated = client.put(f"/api/management/catalog/products/{product_id}", json=payload)
        disabled = client.patch(
            f"/api/management/catalog/products/{product_id}/active",
            json={"is_active": False},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["name"], "Updated contract product")
        self.assertEqual(disabled.status_code, 200)
        self.assertFalse(disabled.json()["is_active"])

        deleted = client.delete(f"/api/management/catalog/products/{product_id}")
        self.assertEqual(deleted.status_code, 204)
        self.assertEqual(client.get(f"/api/management/catalog/products/{product_id}").status_code, 404)

        bulk = client.post(
            "/api/management/catalog/products/bulk",
            json={"items": [
                product_payload(child_id, name="Bulk product A", slug="bulk-product-a", product_code="P-QA-002"),
                product_payload(child_id, name="Bulk product B", slug="bulk-product-b", product_code="P-QA-003"),
            ]},
        )
        self.assertEqual(bulk.status_code, 201)
        self.assertEqual([item["product_code"] for item in bulk.json()], ["P-QA-002", "P-QA-003"])

    def test_product_mutations_invalidate_knowledge_after_commit(self) -> None:
        root = client.post(
            "/api/management/catalog/categories",
            json=category_payload(name="Invalidation root", slug="invalidation-root"),
        )
        leaf = client.post(
            "/api/management/catalog/categories",
            json=category_payload(
                name="Invalidation leaf",
                slug="invalidation-leaf",
                parent_id=root.json()["id"],
            ),
        )
        product = client.post(
            "/api/management/catalog/products",
            json=product_payload(
                leaf.json()["id"],
                name="Invalidation product",
                slug="invalidation-product",
                product_code="P-INVALIDATION-001",
            ),
        )
        self.assertEqual(product.status_code, 201, product.text)
        product_id = product.json()["id"]

        with patch.object(management_catalog, "invalidate_product_knowledge") as invalidate:
            client.patch(
                f"/api/management/catalog/products/{product_id}/active",
                json={"is_active": False},
            )
            client.delete(f"/api/management/catalog/products/{product_id}")

        self.assertEqual(
            [call.args for call in invalidate.call_args_list],
            [(["P-INVALIDATION-001"],), (["P-INVALIDATION-001"],)],
        )

    def test_solution_complete_crud_bulk_and_active_contract(self) -> None:
        payload = solution_payload(title="Contract solution", slug="contract-solution")
        created = client.post("/api/management/catalog/solutions", json=payload)
        self.assertEqual(created.status_code, 201)
        solution_id = created.json()["id"]

        self.assertEqual(client.get("/api/management/catalog/solutions").status_code, 200)
        detail = client.get(f"/api/management/catalog/solutions/{solution_id}")
        self.assertEqual(detail.status_code, 200)

        payload["title"] = "Updated contract solution"
        updated = client.put(f"/api/management/catalog/solutions/{solution_id}", json=payload)
        disabled = client.patch(
            f"/api/management/catalog/solutions/{solution_id}/active",
            json={"is_active": False},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["title"], "Updated contract solution")
        self.assertEqual(disabled.status_code, 200)
        self.assertFalse(disabled.json()["is_active"])

        self.assertEqual(client.delete(f"/api/management/catalog/solutions/{solution_id}").status_code, 204)
        self.assertEqual(client.get(f"/api/management/catalog/solutions/{solution_id}").status_code, 404)

        bulk = client.post(
            "/api/management/catalog/solutions/bulk",
            json={"items": [
                solution_payload(title="Bulk solution A", slug="bulk-solution-a"),
                solution_payload(title="Bulk solution B", slug="bulk-solution-b"),
            ]},
        )
        self.assertEqual(bulk.status_code, 201)
        self.assertEqual([item["slug"] for item in bulk.json()], ["bulk-solution-a", "bulk-solution-b"])

    def test_news_complete_crud_bulk_and_active_contract(self) -> None:
        payload = news_payload(title="Contract news", slug="contract-news")
        created = client.post("/api/management/catalog/news", json=payload)
        self.assertEqual(created.status_code, 201)
        article_id = created.json()["id"]

        self.assertEqual(client.get("/api/management/catalog/news").status_code, 200)
        self.assertEqual(client.get(f"/api/management/catalog/news/{article_id}").status_code, 200)

        payload["title"] = "Updated contract news"
        updated = client.put(f"/api/management/catalog/news/{article_id}", json=payload)
        disabled = client.patch(
            f"/api/management/catalog/news/{article_id}/active",
            json={"is_active": False},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["title"], "Updated contract news")
        self.assertEqual(disabled.status_code, 200)
        self.assertFalse(disabled.json()["is_active"])

        self.assertEqual(client.delete(f"/api/management/catalog/news/{article_id}").status_code, 204)
        self.assertEqual(client.get(f"/api/management/catalog/news/{article_id}").status_code, 404)

        bulk = client.post(
            "/api/management/catalog/news/bulk",
            json={"items": [
                news_payload(title="Bulk news A", slug="bulk-news-a"),
                news_payload(title="Bulk news B", slug="bulk-news-b"),
            ]},
        )
        self.assertEqual(bulk.status_code, 201)
        self.assertEqual([item["slug"] for item in bulk.json()], ["bulk-news-a", "bulk-news-b"])

    def test_delivery_case_complete_crud_bulk_and_active_contract(self) -> None:
        payload = delivery_case_payload(title="Contract case", slug="contract-case")
        created = client.post("/api/management/catalog/delivery-cases", json=payload)
        self.assertEqual(created.status_code, 201)
        case_id = created.json()["id"]

        self.assertEqual(client.get("/api/management/catalog/delivery-cases").status_code, 200)
        self.assertEqual(client.get(f"/api/management/catalog/delivery-cases/{case_id}").status_code, 200)

        payload["title"] = "Updated contract case"
        updated = client.put(f"/api/management/catalog/delivery-cases/{case_id}", json=payload)
        disabled = client.patch(
            f"/api/management/catalog/delivery-cases/{case_id}/active",
            json={"is_active": False},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["title"], "Updated contract case")
        self.assertEqual(disabled.status_code, 200)
        self.assertFalse(disabled.json()["is_active"])

        self.assertEqual(client.delete(f"/api/management/catalog/delivery-cases/{case_id}").status_code, 204)
        self.assertEqual(client.get(f"/api/management/catalog/delivery-cases/{case_id}").status_code, 404)

        bulk = client.post(
            "/api/management/catalog/delivery-cases/bulk",
            json={"items": [
                delivery_case_payload(title="Bulk case A", slug="bulk-case-a"),
                delivery_case_payload(title="Bulk case B", slug="bulk-case-b"),
            ]},
        )
        self.assertEqual(bulk.status_code, 201)
        self.assertEqual([item["slug"] for item in bulk.json()], ["bulk-case-a", "bulk-case-b"])


if __name__ == "__main__":
    unittest.main()
