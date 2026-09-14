import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy import select, update
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models import Category, Product


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


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def seed_products(db: Session, count: int = 30) -> None:
    category = Category(
        name="Switchgear",
        slug="switchgear",
        translations={"id": {"name": "Panel Tegangan"}},
        sort_order=1,
        is_active=True,
    )
    db.add(category)
    db.flush()

    for index in range(count):
        db.add(
            Product(
                category_id=category.id,
                product_code=f"P{index:03}",
                name=f"Product {index:03}",
                slug=f"product-{index:03}",
                model=f"M{index:03}",
                summary="Product summary",
                description=None,
                detail_blocks=[{"type": "text", "content": "Rich product details"}],
                main_image=None,
                images=[],
                highlights=[],
                specifications=[],
                variants=[],
                price_tiers=[],
                show_surprise_only=False,
                fulfillment_methods=[],
                fulfillment_title=None,
                fulfillment_copy=None,
                assurance_items=[],
                moq=None,
                price_mode="contact_only",
                image_tone=None,
                tag=None,
                tag_more=["Switchgear", "10kv"],
                is_hot=index % 2 == 0,
                is_active=True,
                sort_order=index,
            )
        )
    db.commit()


class ProductPaginationTest(unittest.TestCase):
    def setUp(self) -> None:
        app.dependency_overrides[get_db] = override_get_db
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        with TestingSessionLocal() as db:
            seed_products(db)

    def test_products_endpoint_paginates_results(self) -> None:
        response = client.get("/api/products?page=2&page_size=12")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total"], 30)
        self.assertEqual(payload["page"], 2)
        self.assertEqual(payload["page_size"], 12)
        self.assertEqual(len(payload["items"]), 12)
        self.assertEqual(payload["items"][0]["slug"], "product-012")
        self.assertEqual(payload["items"][0]["tag_more"], ["Switchgear", "10kv"])
        self.assertNotIn("detail_blocks", payload["items"][0])
        self.assertNotIn("description", payload["items"][0])

        detail_response = client.get("/api/products/product-012")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json()["detail_blocks"][0]["content"], "Rich product details")
        self.assertEqual(detail_response.json()["tag_more"], ["Switchgear", "10kv"])

    def test_product_sitemap_endpoint_returns_only_indexing_fields(self) -> None:
        response = client.get("/api/products/sitemap")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 30)
        self.assertEqual(payload[0]["public_slug"], "Product-000.html")
        self.assertNotIn("variants", payload[0])
        self.assertNotIn("summary", payload[0])

    def test_public_name_slug_resolves_without_breaking_legacy_slug(self) -> None:
        with TestingSessionLocal() as db:
            product = db.scalar(select(Product).where(Product.slug == "product-012"))
            assert product is not None
            product.slug = "p012-legacy"
            product.translations = {"en": {"name": "Low Voltage Withdrawable Switchgear"}}
            db.commit()

        listing = client.get("/api/products?page=2&page_size=12").json()
        item = next(product for product in listing["items"] if product["product_code"] == "P012")
        self.assertEqual(item["slug"], "p012-legacy")
        self.assertEqual(item["public_slug"], "Low-Voltage-Withdrawable-Switchgear.html")

        public_response = client.get(f"/api/products/{item['public_slug']}")
        extensionless_response = client.get(f"/api/products/{item['public_slug'].removesuffix('.html')}")
        lowercase_response = client.get(f"/api/products/{item['public_slug'].lower()}")
        legacy_response = client.get("/api/products/p012-legacy")
        self.assertEqual(public_response.status_code, 200)
        self.assertEqual(extensionless_response.status_code, 200)
        self.assertEqual(lowercase_response.status_code, 200)
        self.assertEqual(legacy_response.status_code, 200)
        self.assertEqual(public_response.json()["id"], legacy_response.json()["id"])

    def test_categories_endpoint_includes_database_translations(self) -> None:
        response = client.get("/api/categories")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["translations"]["id"]["name"], "Panel Tegangan")

    def test_home_uses_first_five_products_when_no_hot_products_are_configured(self) -> None:
        with TestingSessionLocal() as db:
            db.execute(update(Product).values(is_hot=False))
            db.commit()

        response = client.get("/api/home")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(
            [product["product_code"] for product in payload["hot_products"]],
            [f"P{index:03}" for index in range(5)],
        )

    def test_home_fills_fewer_than_five_hot_products_by_product_code(self) -> None:
        with TestingSessionLocal() as db:
            db.execute(update(Product).values(is_hot=False, sort_order=100 - Product.id))
            hot_products = list(db.scalars(select(Product).where(Product.slug.in_(["product-004", "product-020"]))))
            for product in hot_products:
                product.is_hot = True
            db.commit()

        response = client.get("/api/home")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [product["product_code"] for product in response.json()["hot_products"]],
            ["P020", "P004", "P000", "P001", "P002"],
        )

    def test_product_code_search_normalizes_separators_without_matching_other_fields(self) -> None:
        with TestingSessionLocal() as db:
            first = db.scalar(select(Product).where(Product.slug == "product-000"))
            second = db.scalar(select(Product).where(Product.slug == "product-001"))
            assert first is not None
            assert second is not None
            first.product_code = "P-102"
            second.product_code = "P-208"
            second.model = "P102 auxiliary module"
            db.commit()

        response = client.get("/api/products?q=p102")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([product["product_code"] for product in response.json()["items"]], ["P-102"])


if __name__ == "__main__":
    unittest.main()
