from app.schemas.catalog import ProductListItemOut
from app.services.product_public_slug import slugify_product_name


def test_slugifies_english_product_name_for_public_urls() -> None:
    assert slugify_product_name(
        "Low-Voltage Withdrawable Switchgear — Dual-Supply Infeed/Outfeed AC Power Distribution, GEN-4/GEN-3",
        product_id=24,
    ) == "Low-Voltage-Withdrawable-Switchgear-Dual-Supply-Infeed-Outfeed-AC-Power-Distribution-GEN-4-GEN-3"


def test_public_slug_fallback_never_exposes_the_product_id() -> None:
    assert slugify_product_name("---", product_id=24) == "product"


def test_product_list_schema_exposes_public_slug() -> None:
    item = ProductListItemOut.model_validate({
        "id": 24,
        "product_code": "P-002",
        "slug": "p002-mns",
        "name": "低压抽出式开关柜",
        "model": "GEN-4/GEN-3",
        "summary": "summary",
        "main_image": None,
        "image_tone": None,
        "tag": None,
        "tag_more": [],
        "is_hot": False,
        "sort_order": 2,
        "is_indexable": True,
        "content_updated_at": None,
        "translations": {"en": {"name": "Low Voltage Withdrawable Switchgear"}},
        "category": {
            "name": "Switchgear",
            "slug": "switchgear",
            "color": None,
            "translations": {},
        },
    })

    assert item.public_slug == "Low-Voltage-Withdrawable-Switchgear.html"
