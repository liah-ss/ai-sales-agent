from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.database import Base
from app.models import NewsArticle
from app.services.translation_service import (
    TranslationGenerationError,
    generate_english,
    translation_status,
)


class FakeProvider:
    name = "fake"
    model = "test-model"

    def translate(self, payload, source_locale, target_locale):
        return {
            **payload,
            "title": "English title",
            "content": '<h2>English</h2><script>alert(1)</script>',
        }


class FailingProvider:
    name = "fake"
    model = "test-model"

    def translate(self, payload, source_locale, target_locale):
        raise RuntimeError("provider unavailable")


def seeded_news(db: Session, translations=None) -> NewsArticle:
    article = NewsArticle(
        title="中文标题",
        slug="test-news",
        summary="中文摘要",
        content="<h2>中文正文</h2>",
        source="行业资讯",
        translations=translations or {},
        published_at=date(2026, 7, 14),
        sort_order=1,
        is_active=True,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


def test_generation_persists_valid_sanitized_english() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        article = seeded_news(db)

        result = generate_english(db, "news", article.id, provider=FakeProvider())
        db.commit()
        db.refresh(article)

        assert result.status == "current"
        assert article.translations["en"]["title"] == "English title"
        assert "script" not in article.translations["en"]["content"]
        assert article.translations["en"]["_meta"]["provider"] == "fake"
        assert translation_status(article, "news").status == "current"


def test_failed_regeneration_preserves_last_success() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        article = seeded_news(
            db,
            translations={
                "en": {
                    "title": "Old English",
                    "summary": "Old summary",
                    "content": "<p>Old content</p>",
                    "source": "Old source",
                    "_meta": {"status": "current"},
                }
            },
        )

        with pytest.raises(TranslationGenerationError, match="provider unavailable"):
            generate_english(db, "news", article.id, provider=FailingProvider(), force=True)
        db.flush()
        db.refresh(article)

        assert article.translations["en"]["title"] == "Old English"
        assert article.translations["en"]["_meta"]["status"] == "failed"
        assert "provider unavailable" in article.translations["en"]["_meta"]["last_error"]
