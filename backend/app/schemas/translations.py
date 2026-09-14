from typing import Literal

from pydantic import BaseModel, Field
from pydantic.fields import FieldInfo

from app.services.content_sanitizer import sanitize_rich_html


LocaleCode = Literal["id", "en"]
Translations = dict[str, dict[str, object]]


class TranslationMeta(BaseModel):
    status: Literal["missing", "current", "stale", "failed"] = "missing"
    source_locale: Literal["zh-CN", "id"] | None = None
    source_fingerprint: str = ""
    generated_at: str | None = None
    provider: str | None = None
    model: str | None = None
    last_error: str | None = None


def translations_field() -> FieldInfo:
    return Field(default_factory=dict)


RICH_TEXT_FIELDS = {
    "content",
    "description",
    "detailed_description",
    "project_overview",
    "indonesia_fit",
    "professional_configuration",
    "project_results",
}


def sanitize_translations(value: Translations) -> Translations:
    result: Translations = {}
    for locale, payload in value.items():
        cleaned = dict(payload)
        for field in RICH_TEXT_FIELDS:
            content = cleaned.get(field)
            if isinstance(content, str):
                cleaned[field] = sanitize_rich_html(content)
        detail_blocks = cleaned.get("detail_blocks")
        if isinstance(detail_blocks, list):
            cleaned["detail_blocks"] = [
                {
                    **block,
                    "content": sanitize_rich_html(block["content"]),
                }
                if isinstance(block, dict)
                and block.get("type") == "rich-text"
                and isinstance(block.get("content"), str)
                else block
                for block in detail_blocks
            ]
        result[locale] = cleaned
    return result
