import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import get_current_admin_user
from app.main import app
from app.models import AdminUser, Category, Product
from app.schemas.catalog import AssuranceItem


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
    return AdminUser(id=1, username="admin", password_hash="test", role="super_admin", is_active=True)


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_admin_user] = override_admin_user
client = TestClient(app)


def product_payload(category_id: int, *, slug: str = "test-product", product_code: str = "P-T001") -> dict:
    return {
        "product_code": product_code,
        "category_id": category_id,
        "name": "Test product",
        "slug": slug,
        "model": "T-100",
        "summary": "Test summary",
    }


class ManagementProductRuleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        Base.metadata.create_all(engine)

    def setUp(self) -> None:
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_admin_user] = override_admin_user
        with TestingSessionLocal() as db:
            for model in (Product, Category, AdminUser):
                db.query(model).delete()
            root = Category(name="Transformer", slug="transformer", sort_order=1, is_active=True)
            db.add(root)
            db.flush()
            child = Category(name="Dry transformer", slug="dry-transformer", parent_id=root.id, sort_order=1, is_active=True)
            db.add(child)
            db.commit()
            self.root_id = root.id
            self.child_id = child.id

    def test_product_create_rejects_root_category(self) -> None:
        response = client.post("/api/management/catalog/products", json=product_payload(self.root_id))

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["detail"], "商品只能选择二级分类")

    def test_product_update_rejects_root_category(self) -> None:
        created = client.post("/api/management/catalog/products", json=product_payload(self.child_id))
        self.assertEqual(created.status_code, 201)
        payload = product_payload(self.root_id)

        response = client.put(f"/api/management/catalog/products/{created.json()['id']}", json=payload)

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["detail"], "商品只能选择二级分类")

    def test_product_create_hides_price_by_default(self) -> None:
        response = client.post("/api/management/catalog/products", json=product_payload(self.child_id))

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()["show_surprise_only"])

    def test_product_batch_is_management_only(self) -> None:
        payload = product_payload(self.child_id, slug="second-batch-product")
        payload["batch_number"] = 2

        created = client.post("/api/management/catalog/products", json=payload)

        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.json()["batch_number"], 2)
        listing = client.get("/api/management/catalog/products?q=P-T001")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json()["items"][0]["batch_number"], 2)
        public = client.get("/api/products/second-batch-product")
        self.assertEqual(public.status_code, 200)
        self.assertNotIn("batch_number", public.json())

    def test_product_process_items_are_persisted(self) -> None:
        payload = product_payload(self.child_id)
        payload["process_items"] = [
            {"title": "需求确认", "copy": "确认参数"},
            {"title": "订单交易", "copy": "确认合同。"},
        ]

        response = client.post("/api/management/catalog/products", json=payload)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["process_items"], payload["process_items"])

    def test_product_tag_more_is_normalized_and_preserved_when_omitted(self) -> None:
        payload = product_payload(self.child_id)
        payload["tag_more"] = [" 配电器 ", "", "10kv", "配电器", "  电能   质量  "]

        created = client.post("/api/management/catalog/products", json=payload)

        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.json()["tag_more"], ["配电器", "10kv", "电能 质量"])

        update_payload = product_payload(self.child_id)
        updated = client.put(f"/api/management/catalog/products/{created.json()['id']}", json=update_payload)

        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["tag_more"], ["配电器", "10kv", "电能 质量"])

    def test_product_seo_geo_fields_are_persisted_and_public(self) -> None:
        payload = product_payload(self.child_id, slug="seo-geo-product")
        payload.update({
            "seo_title": "Indonesia transformer procurement guide",
            "seo_description": "Technical sourcing guidance for Indonesian projects.",
            "answer_summary": "Select the transformer against IEC, SNI and site conditions.",
            "author_name": "Engineering Team",
            "technical_reviewer": "Chief Engineer",
            "evidence_urls": ["https://webstore.iec.ch/"],
            "standards": ["IEC 60076", "SNI IEC 60076"],
            "applicable_markets": ["Indonesia"],
            "unsuitable_conditions": ["Unverified hazardous areas"],
            "is_indexable": False,
            "translations": {
                "en": {"seo_title": "English SEO title", "answer_summary": "English answer"},
                "id": {"seo_title": "Judul SEO Indonesia", "answer_summary": "Jawaban Indonesia"},
            },
        })

        created = client.post("/api/management/catalog/products", json=payload)

        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.json()["standards"], payload["standards"])
        self.assertFalse(created.json()["is_indexable"])
        public = client.get("/api/products/seo-geo-product")
        self.assertEqual(public.status_code, 200)
        self.assertEqual(public.json()["seo_title"], payload["seo_title"])
        self.assertEqual(public.json()["translations"]["id"]["answer_summary"], "Jawaban Indonesia")

    def test_product_description_preserves_safe_rich_text(self) -> None:
        payload = product_payload(self.child_id)
        payload["description"] = (
            '<h2 style="color:#145b75;text-align:center" onclick="alert(1)">技术特点</h2>'
            '<p><strong>正文重点</strong></p><script>alert(1)</script>'
        )

        response = client.post("/api/management/catalog/products", json=payload)

        self.assertEqual(response.status_code, 201)
        description = response.json()["description"]
        self.assertIn('<h2 style="color:#145b75;text-align:center">技术特点</h2>', description)
        self.assertIn("<strong>正文重点</strong>", description)
        self.assertNotIn("onclick", description)
        self.assertNotIn("script", description)

    def test_management_products_are_paginated_and_searched_on_server(self) -> None:
        with TestingSessionLocal() as db:
            for index in range(30):
                db.add(Product(
                    category_id=self.child_id,
                    product_code=f"PAGE-{index:03}",
                    name=f"分页产品 {index:03}",
                    slug=f"paged-product-{index:03}",
                    model=f"MODEL-{index:03}",
                    summary="分页测试",
                    is_active=index % 2 == 0,
                    sort_order=index,
                ))
            db.commit()

        response = client.get("/api/management/catalog/products?page=2&page_size=24")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total"], 30)
        self.assertEqual(payload["all_total"], 30)
        self.assertEqual(payload["active_total"], 15)
        self.assertEqual(payload["page"], 2)
        self.assertEqual(len(payload["items"]), 6)

        searched = client.get("/api/management/catalog/products?q=MODEL-029&page=1&page_size=24")
        self.assertEqual(searched.status_code, 200)
        self.assertEqual(searched.json()["total"], 1)
        self.assertEqual(searched.json()["items"][0]["product_code"], "PAGE-029")

    def test_product_bulk_import_rejects_root_category(self) -> None:
        response = client.post(
            "/api/management/catalog/products/bulk",
            json={"items": [product_payload(self.root_id)]},
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["detail"], "商品只能选择二级分类")

    def test_assurance_legacy_title_is_normalized(self) -> None:
        item = AssuranceItem.model_validate({"title": "运维3年", "copy": "技术协助"})

        self.assertEqual(
            item.model_dump(),
            {"duration": "3年", "title": "运维", "copy": "技术协助"},
        )


if __name__ == "__main__":
    unittest.main()
