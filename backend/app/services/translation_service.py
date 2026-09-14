from copy import deepcopy
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal

from sqlalchemy.orm import Session

from app.models import Category, DeliveryCase, NewsArticle, Product, Solution
from app.services.content_sanitizer import sanitize_rich_html
from app.services.localized_content import source_fingerprint
from app.services.translation_provider import TranslationProvider


TranslationState = Literal["missing", "current", "stale", "failed"]


class TranslationGenerationError(RuntimeError):
    pass


@dataclass
class TranslationResult:
    module: str
    record_id: int
    status: TranslationState
    source_locale: str | None
    generated_at: str | None
    last_error: str | None = None


SEO_TRANSLATION_FIELDS = (
    "seo_title",
    "seo_description",
    "answer_summary",
    "author_name",
    "technical_reviewer",
    "evidence_urls",
    "standards",
    "applicable_markets",
    "unsuitable_conditions",
)


MODULE_CONFIG = {
    "categories": {
        "model": Category,
        "fields": (
            "name",
            "fulfillment_methods",
            "fulfillment_items",
            "fulfillment_title",
            "fulfillment_copy",
            "assurance_items",
        ),
        "html_fields": (),
    },
    "products": {
        "model": Product,
        "fields": (
            "name",
            "summary",
            "description",
            "detail_blocks",
            "highlights",
            "specifications",
            "variants",
            "fulfillment_methods",
            "fulfillment_items",
            "fulfillment_title",
            "fulfillment_copy",
            "assurance_items",
            "process_items",
            "moq",
            "tag",
        ) + SEO_TRANSLATION_FIELDS,
        "html_fields": ("description",),
    },
    "solutions": {
        "model": Solution,
        "fields": (
            "title",
            "summary",
            "content",
            "document_sections",
            "scenarios",
            "equipment",
            "benefits",
            "detailed_description",
            "pitfalls",
            "core_parameters",
            "special_contributions",
        ) + SEO_TRANSLATION_FIELDS,
        "html_fields": ("content", "detailed_description"),
    },
    "delivery-cases": {
        "model": DeliveryCase,
        "fields": (
            "title",
            "summary",
            "content",
            "project_overview",
            "indonesia_fit",
            "professional_configuration",
            "key_parameter_table",
            "delivery_challenges",
            "project_results",
            "client_name",
            "industry",
            "location",
        ) + SEO_TRANSLATION_FIELDS,
        "html_fields": ("content", "project_overview", "indonesia_fit", "professional_configuration", "project_results"),
    },
    "news": {
        "model": NewsArticle,
        "fields": ("title", "summary", "content", "source") + SEO_TRANSLATION_FIELDS,
        "html_fields": ("content",),
    },
}


def module_config(module: str) -> dict[str, object]:
    config = MODULE_CONFIG.get(module)
    if config is None:
        raise ValueError(f"unsupported translation module: {module}")
    return config


def canonical_payload(record: object, module: str) -> dict[str, object]:
    fields = module_config(module)["fields"]
    return {field: getattr(record, field) for field in fields}


def _has_text(value: object) -> bool:
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, dict):
        return any(_has_text(item) for item in value.values())
    if isinstance(value, list):
        return any(_has_text(item) for item in value)
    return value is not None


def choose_source(record: object, module: str) -> tuple[str, dict[str, object]]:
    canonical = canonical_payload(record, module)
    if any(_has_text(value) for value in canonical.values()):
        return "zh-CN", canonical
    indonesian = dict((getattr(record, "translations", {}) or {}).get("id", {}))
    indonesian.pop("_meta", None)
    if any(_has_text(value) for value in indonesian.values()):
        return "id", indonesian
    raise TranslationGenerationError("record has no Chinese or Indonesian source content")


def _sanitize_payload(payload: dict[str, object], module: str) -> dict[str, object]:
    result = dict(payload)
    for field in module_config(module)["html_fields"]:
        value = result.get(field)
        if isinstance(value, str):
            result[field] = sanitize_rich_html(value)
    return result


def _validate_translated_payload(
    source: dict[str, object],
    translated: dict[str, object],
) -> dict[str, object]:
    unexpected = set(translated) - set(source)
    if unexpected:
        raise ValueError(f"translation returned unexpected fields: {', '.join(sorted(unexpected))}")
    return {key: translated.get(key, value) for key, value in source.items()}


def translation_status(record: object, module: str) -> TranslationResult:
    english = dict((getattr(record, "translations", {}) or {}).get("en", {}))
    if not english:
        return TranslationResult(module, getattr(record, "id"), "missing", None, None)
    metadata = dict(english.get("_meta") or {})
    try:
        source_locale, source = choose_source(record, module)
    except TranslationGenerationError:
        source_locale, source = None, {}
    status = str(metadata.get("status") or "missing")
    if status != "failed" and (
        metadata.get("source_locale") != source_locale
        or metadata.get("source_fingerprint") != source_fingerprint(source)
    ):
        status = "stale"
    return TranslationResult(
        module=module,
        record_id=getattr(record, "id"),
        status=status if status in {"missing", "current", "stale", "failed"} else "missing",
        source_locale=source_locale,
        generated_at=metadata.get("generated_at"),
        last_error=metadata.get("last_error"),
    )


def generate_english(
    db: Session,
    module: str,
    record_id: int,
    provider: TranslationProvider,
    force: bool = False,
) -> TranslationResult:
    config = module_config(module)
    record = db.get(config["model"], record_id)
    if record is None:
        raise LookupError(f"{module} record not found")
    current_status = translation_status(record, module)
    if current_status.status == "current" and not force:
        return current_status

    source_locale, source = choose_source(record, module)
    translations = deepcopy(getattr(record, "translations", {}) or {})
    previous_english = dict(translations.get("en", {}))
    try:
        translated = provider.translate(source, source_locale, "en")
        normalized = _validate_translated_payload(source, translated)
        normalized = _sanitize_payload(normalized, module)
        generated_at = datetime.now(UTC).isoformat()
        normalized["_meta"] = {
            "status": "current",
            "source_locale": source_locale,
            "source_fingerprint": source_fingerprint(source),
            "generated_at": generated_at,
            "provider": provider.name,
            "model": provider.model,
            "last_error": None,
        }
        translations["en"] = normalized
        setattr(record, "translations", translations)
        db.add(record)
        db.flush()
        return TranslationResult(module, record_id, "current", source_locale, generated_at)
    except Exception as exc:
        metadata = dict(previous_english.get("_meta") or {})
        metadata.update(
            {
                "status": "failed",
                "source_locale": source_locale,
                "source_fingerprint": source_fingerprint(source),
                "provider": provider.name,
                "model": provider.model,
                "last_error": str(exc),
            }
        )
        previous_english["_meta"] = metadata
        translations["en"] = previous_english
        setattr(record, "translations", translations)
        db.add(record)
        db.flush()
        raise TranslationGenerationError(str(exc)) from exc
