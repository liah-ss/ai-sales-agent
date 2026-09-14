import hashlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

from migrate_product_image_keys import (
    build_plan,
    hashed_target_key,
    image_ordinal,
    planned_product_fields,
    product_refs,
    reconcile_missing_asset_refs,
    replace_refs,
)


class Product:
    def __init__(self, **values):
        self.__dict__.update(values)


def product(**values):
    defaults = {
        "id": 1,
        "product_code": "P-001",
        "slug": "p001",
        "translations": {"en": {"name": "Low Voltage Cabinet"}},
        "main_image": "/product-assets/商品图片/商品1/图1.jpg",
        "images": ["/product-assets/商品图片/商品1/图1.jpg", "/product-assets/商品图片/商品1/图2.jpg"],
        "detail_blocks": [],
        "variants": [],
    }
    defaults.update(values)
    return Product(**defaults)


def test_plan_uses_deterministic_md5_object_keys():
    mapping, _, _ = build_plan([product()])
    assert set(mapping) == {
        "product-assets/商品图片/商品1/图1.jpg",
        "product-assets/商品图片/商品1/图2.jpg",
    }
    assert all(value.isascii() for value in mapping.values())
    source = "product-assets/商品图片/商品1/图1.jpg"
    digest = hashlib.md5(source.encode("utf-8"), usedforsecurity=False).hexdigest()
    assert mapping[source] == f"product-assets/catalog/{digest[:2]}/{digest}.jpg"
    assert hashed_target_key(source) == mapping[source]


def test_replace_refs_handles_nested_detail_content_and_encoded_urls():
    mapping = {"product-assets/商品图片/商品1/图1.jpg": "product-assets/catalog/p-001/image-01.jpg"}
    value = {"url": "/product-assets/%E5%95%86%E5%93%81%E5%9B%BE%E7%89%87/%E5%95%86%E5%93%811/%E5%9B%BE1.jpg"}
    assert replace_refs(value, mapping) == {"url": "/product-assets/catalog/p-001/image-01.jpg"}


def test_product_refs_restore_matching_translation_assets_and_skip_md5_keys():
    item = product(
        variants=[{"images": ["/product-assets/商品图片/商品1/变体.jpg"]}],
        translations={"en": {"variants": [{"images": ["/product-assets/商品图片/商品1/en.jpg"]}]}},
        detail_blocks=[{"type": "image", "url": "/product-assets/catalog/aa/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg"}],
    )

    assert product_refs(item) == [
        "product-assets/商品图片/商品1/图1.jpg",
        "product-assets/商品图片/商品1/图2.jpg",
        "product-assets/商品图片/商品1/变体.jpg",
    ]


def test_product_refs_keep_extra_translation_assets_without_canonical_matches():
    item = product(
        translations={
            "en": {
                "images": [
                    "/product-assets/商品图片/商品1/translated-main.jpg",
                    "/product-assets/商品图片/商品1/translated-extra.jpg",
                    "/product-assets/商品图片/商品1/translated-third.jpg",
                ],
            },
        },
    )

    assert product_refs(item) == [
        "product-assets/商品图片/商品1/图1.jpg",
        "product-assets/商品图片/商品1/图2.jpg",
        "product-assets/商品图片/商品1/translated-third.jpg",
    ]


def test_translated_image_paths_are_restored_from_canonical_variants():
    item = product(
        variants=[{"name": "中文型号", "images": ["/product-assets/商品图片/商品1/图1.jpg"]}],
        translations={
            "en": {
                "variants": [{
                    "name": "English model",
                    "images": ["/product-assets/Commodity Images/Commodity 1/Fig. 1.jpg"],
                }],
            },
        },
    )

    planned = planned_product_fields(item)
    assert planned["translations"]["en"]["variants"][0] == {
        "name": "English model",
        "images": ["/product-assets/商品图片/商品1/图1.jpg"],
    }


def test_missing_canonical_asset_is_repaired_from_existing_translation_asset():
    canonical, translated = reconcile_missing_asset_refs(
        "/product-assets/商品图片/商品1/图1.jpg",
        "/product-assets/catalog/p-001/image-01.jpg",
        {"product-assets/catalog/p-001/image-01.jpg"},
    )

    assert canonical == "/product-assets/catalog/p-001/image-01.jpg"
    assert translated == "/product-assets/catalog/p-001/image-01.jpg"


def test_distinct_existing_locale_assets_are_preserved():
    canonical, translated = reconcile_missing_asset_refs(
        "/product-assets/catalog/p-001/zh.jpg",
        "/product-assets/catalog/p-001/en.jpg",
        {"product-assets/catalog/p-001/zh.jpg", "product-assets/catalog/p-001/en.jpg"},
    )

    assert canonical == "/product-assets/catalog/p-001/zh.jpg"
    assert translated == "/product-assets/catalog/p-001/en.jpg"


def test_missing_variant_images_are_repaired_by_product_image_ordinal():
    item = product(
        main_image="/product-assets/catalog/p-001/product-image-01.jpg",
        images=[
            "/product-assets/catalog/p-001/product-image-01.jpg",
            "/product-assets/catalog/p-001/product-image-02.jpg",
        ],
        variants=[{
            "images": [
                "/product-assets/商品图片/商品1/图1.jpg",
                "/product-assets/商品图片/商品1/图2.jpg",
            ],
        }],
        translations={
            "en": {
                "variants": [{
                    "images": [
                        "/product-assets/Commodity Images/Commodity 1/Fig. 1.jpg",
                        "/product-assets/Commodity Images/Commodity 1/Fig. 2.jpg",
                    ],
                }],
            },
        },
    )
    available = {
        "product-assets/catalog/p-001/product-image-01.jpg",
        "product-assets/catalog/p-001/product-image-02.jpg",
    }

    planned = planned_product_fields(item, available)

    assert planned["variants"][0]["images"] == item.images
    assert planned["translations"]["en"]["variants"][0]["images"] == item.images
    assert image_ordinal("/product-assets/batch/01_white_background.png") == 1


def test_missing_variant_images_prefer_array_position_when_filenames_skip_numbers():
    item = product(
        images=[
            "/product-assets/catalog/p-001/image-01.jpg",
            "/product-assets/catalog/p-001/image-02.jpg",
        ],
        variants=[{
            "images": [
                "/product-assets/商品图片/商品1/图1.jpg",
                "/product-assets/商品图片/商品1/图3.jpg",
            ],
        }],
    )
    available = {
        "product-assets/catalog/p-001/image-01.jpg",
        "product-assets/catalog/p-001/image-02.jpg",
    }

    planned = planned_product_fields(item, available)

    assert planned["variants"][0]["images"] == item.images
