import pytest
from pydantic import ValidationError

from app.schemas.website_config import BannerConfigIn, WebsiteConfigPayload
from app.routers.website_config import normalize_faq
from app.services.website_config_defaults import get_default_website_config


def test_default_faq_contains_source_questions_and_conversion_paths() -> None:
    payload = get_default_website_config()
    faq = payload["faq"]

    assert faq["primaryPath"] == "/contact"
    assert faq["secondaryPath"] == "/products"
    assert len(faq["categories"]) == 6
    assert sum(len(category["items"]) for category in faq["categories"]) == 25
    assert any(item["popular"] for category in faq["categories"] for item in category["items"])
    assert faq["categories"][0]["items"][0]["question"] == "在 ExampleCorp 如何采购设备？"
    for category in faq["categories"]:
        for item in category["items"]:
            assert item["questionTranslations"]["en"].strip()
            assert item["questionTranslations"]["id"].strip()
            assert item["answerTranslations"]["en"].strip()
            assert item["answerTranslations"]["id"].strip()


def test_website_config_schema_accepts_configurable_faq_copy() -> None:
    payload = WebsiteConfigPayload.model_validate(get_default_website_config())

    assert payload.faq.translations["en"]["title"] == "Frequently asked questions"
    assert payload.faq.categories[-1].items[-1].id == "lightning-protection"


def test_banner_link_is_normalized_to_a_complete_https_url() -> None:
    base = {"id": "hero-1", "title": "Hero"}

    assert BannerConfigIn(**base, linkUrl="/products/example").linkUrl == "https://example.com/products/example"
    assert BannerConfigIn(**base, linkUrl="HTTPS://example.com").linkUrl == "HTTPS://example.com"

    with pytest.raises(ValidationError):
        BannerConfigIn(**base, linkUrl="javascript:alert(1)")
    with pytest.raises(ValidationError):
        BannerConfigIn(**base, linkUrl="http://example.com")


def test_faq_normalization_backfills_empty_translations_without_overwriting_editor_copy() -> None:
    defaults = get_default_website_config()
    payload = get_default_website_config()
    first_item = payload["faq"]["categories"][0]["items"][0]
    first_item["questionTranslations"] = {"en": "Custom English question", "id": ""}
    first_item["answerTranslations"] = {}

    normalize_faq(payload, defaults)

    assert first_item["questionTranslations"]["en"] == "Custom English question"
    assert first_item["questionTranslations"]["id"]
    assert first_item["answerTranslations"]["en"]
    assert first_item["answerTranslations"]["id"]
