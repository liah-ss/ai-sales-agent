from app.services.localized_content import (
    mark_english_stale,
    resolve_locale_payload,
    source_fingerprint,
)


def test_resolver_prefers_requested_translation_then_chinese() -> None:
    canonical = {"title": "中文", "summary": "中文摘要"}
    translations = {"id": {"title": "Indonesia"}}

    assert resolve_locale_payload(canonical, translations, "id") == {
        "title": "Indonesia",
        "summary": "中文摘要",
    }


def test_source_fingerprint_is_stable_for_key_order() -> None:
    assert source_fingerprint({"title": "A", "items": ["B"]}) == source_fingerprint(
        {"items": ["B"], "title": "A"}
    )


def test_changed_source_marks_existing_english_stale() -> None:
    translations = {
        "en": {
            "title": "Old title",
            "_meta": {
                "status": "current",
                "source_locale": "zh-CN",
                "source_fingerprint": source_fingerprint({"title": "旧标题"}),
            },
        }
    }

    result = mark_english_stale(translations, {"title": "新标题"}, "zh-CN")

    assert result["en"]["title"] == "Old title"
    assert result["en"]["_meta"]["status"] == "stale"
