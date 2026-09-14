from copy import deepcopy
import hashlib
import json
from typing import Literal

from app.schemas.translations import Translations


SourceLocale = Literal["zh-CN", "id"]


def source_fingerprint(payload: dict[str, object]) -> str:
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def _has_value(value: object) -> bool:
    return value not in (None, "", [], {})


def resolve_locale_payload(
    canonical: dict[str, object],
    translations: Translations | None,
    locale: str,
) -> dict[str, object]:
    if locale == "zh-CN":
        return dict(canonical)

    translated = (translations or {}).get(locale, {})
    return {
        key: translated.get(key) if _has_value(translated.get(key)) else value
        for key, value in canonical.items()
    }


def mark_english_stale(
    translations: Translations | None,
    source_payload: dict[str, object],
    source_locale: SourceLocale,
) -> Translations:
    result: Translations = deepcopy(translations or {})
    english = result.get("en")
    if not english:
        return result

    metadata = dict(english.get("_meta") or {})
    next_fingerprint = source_fingerprint(source_payload)
    if (
        metadata.get("source_locale") != source_locale
        or metadata.get("source_fingerprint") != next_fingerprint
    ):
        metadata["status"] = "stale"
    english["_meta"] = metadata
    result["en"] = english
    return result
