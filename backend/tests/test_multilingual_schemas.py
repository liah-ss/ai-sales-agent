from app.models import Category, DeliveryCase, NewsArticle, Product, Solution
from app.schemas.management_catalog import ManagementCategoryIn


def test_all_business_models_expose_translations() -> None:
    for model in (Category, Product, Solution, DeliveryCase, NewsArticle):
        assert "translations" in model.__table__.columns


def test_management_category_accepts_indonesian_and_english_payloads() -> None:
    value = ManagementCategoryIn.model_validate(
        {
            "name": "变压器",
            "slug": "transformer",
            "translations": {
                "id": {"name": "Transformator"},
                "en": {
                    "name": "Transformer",
                    "_meta": {"status": "current"},
                },
            },
        }
    )

    assert value.translations["id"]["name"] == "Transformator"
    assert value.translations["en"]["_meta"]["status"] == "current"
