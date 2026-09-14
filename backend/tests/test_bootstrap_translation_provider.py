from io import BytesIO
from urllib.error import HTTPError

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.database import Base
from app.models import Category, Product
from app.services import bootstrap_translation_provider as provider_module
from app.services.bootstrap_translation_provider import (
    BootstrapTranslationProvider,
    bootstrap_all_english,
    google_translate_request,
)


def test_bootstrap_provider_translates_nested_chinese_and_preserves_technical_values() -> None:
    calls: list[str] = []

    def fake_request(text: str, source_locale: str, target_locale: str) -> str:
        calls.append(text)
        assert source_locale == "zh-CN"
        assert target_locale == "en"
        return (
            text
            .replace("低压抽出式开关柜", "Low-voltage withdrawable switchgear")
            .replace("额定电压", "Rated voltage")
        )

    provider = BootstrapTranslationProvider(request=fake_request)
    result = provider.translate(
        {
            "name": "低压抽出式开关柜 GEN-4",
            "model": "GEN-4",
            "specifications": [{"label": "额定电压", "value": "400V"}],
        },
        "zh-CN",
        "en",
    )

    assert result == {
        "name": "Low-voltage withdrawable switchgear GEN-4",
        "model": "GEN-4",
        "specifications": [{"label": "Rated voltage", "value": "400V"}],
    }
    assert len(calls) == 1


def test_google_request_uses_a_verified_certifi_ssl_context(monkeypatch) -> None:
    captured = {}

    def fake_urlopen(request, timeout, context):
        captured["context"] = context
        return BytesIO(b'[[["Transformer","\\u53d8\\u538b\\u5668",null,null,2]],null,"zh-CN"]')

    monkeypatch.setattr(provider_module, "urlopen", fake_urlopen)

    assert google_translate_request("变压器", "zh-CN", "en") == "Transformer"
    assert captured["context"].verify_mode.name == "CERT_REQUIRED"


def test_google_request_retries_transient_http_errors(monkeypatch) -> None:
    attempts = 0
    delays: list[float] = []

    def fake_urlopen(request, timeout, context):
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            raise HTTPError(request.full_url, 429, "Too Many Requests", {}, None)
        return BytesIO(b'[[["Transformer","\\u53d8\\u538b\\u5668",null,null,2]],null,"zh-CN"]')

    monkeypatch.setattr(provider_module, "urlopen", fake_urlopen)
    monkeypatch.setattr(provider_module.time, "sleep", delays.append)

    assert google_translate_request("变压器", "zh-CN", "en") == "Transformer"
    assert attempts == 2
    assert delays == [1.0]
    assert provider_module.GOOGLE_TRANSLATE_URL.startswith("https://translate.google.com/")


def test_provider_prime_batches_strings_across_records_and_reuses_cache() -> None:
    calls: list[str] = []

    def fake_request(text: str, _source: str, _target: str) -> str:
        calls.append(text)
        return text.replace("变压器", "Transformer").replace("额定电压", "Rated voltage")

    provider = BootstrapTranslationProvider(request=fake_request, request_interval=0)
    provider.prime(
        [
            ({"name": "变压器"}, "zh-CN"),
            ({"name": "变压器", "label": "额定电压"}, "zh-CN"),
        ]
    )

    assert provider.translate({"name": "变压器"}, "zh-CN", "en") == {"name": "Transformer"}
    assert provider.translate({"label": "额定电压"}, "zh-CN", "en") == {"label": "Rated voltage"}
    assert len(calls) == 1


def test_bootstrap_all_english_persists_current_metadata_and_is_idempotent() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    provider = BootstrapTranslationProvider(
        request=lambda text, _source, _target: text.replace("变压器", "Transformer")
    )

    with Session(engine) as db:
        category = Category(name="变压器", slug="transformer", sort_order=1, is_active=True)
        db.add(category)
        db.commit()

        first = bootstrap_all_english(db, provider)
        second = bootstrap_all_english(db, provider)
        db.refresh(category)

        assert first["categories"]["current"] == 1
        assert second["categories"]["skipped"] == 1
        assert category.translations["en"]["name"] == "Transformer"
        assert category.translations["en"]["_meta"]["status"] == "current"
        assert category.translations["en"]["_meta"]["provider"] == "bootstrap-local"


def test_bootstrap_products_can_be_limited_to_one_import_batch() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    provider = BootstrapTranslationProvider(
        request=lambda text, _source, _target: text.replace("变压器", "Transformer"),
        request_interval=0,
    )

    with Session(engine) as db:
        category = Category(name="设备", slug="equipment", sort_order=1, is_active=True)
        db.add(category)
        db.flush()
        db.add_all([
            Product(
                category_id=category.id,
                batch_number=batch,
                product_code=f"P-{batch}",
                name=f"变压器 {batch}",
                slug=f"transformer-{batch}",
                model=f"T{batch}",
                summary="变压器",
            )
            for batch in (1, 3)
        ])
        db.commit()

        report = bootstrap_all_english(
            db,
            provider,
            modules=["products"],
            product_batch_number=3,
        )
        products = list(db.scalars(select(Product).order_by(Product.batch_number)))

        assert report["products"] == {"current": 1, "failed": 0, "skipped": 0}
        assert products[0].translations == {}
        assert products[1].translations["en"]["name"] == "Transformer 3"
