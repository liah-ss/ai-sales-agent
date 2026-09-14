from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import get_current_admin_user
from app.main import app
from app.models import AdminUser, NewsArticle
from app.services.translation_provider import get_translation_provider


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class FakeProvider:
    name = "fake"
    model = "test-model"

    def translate(self, payload, source_locale, target_locale):
        return {**payload, "title": "English title"}


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def override_admin_user():
    return AdminUser(id=1, username="admin", password_hash="test", role="super_admin", is_active=True)


def seed_news(slug: str) -> None:
    with TestingSessionLocal() as db:
        db.add(
            NewsArticle(
                title="中文标题",
                slug=slug,
                summary="中文摘要",
                content="中文正文",
                source="行业资讯",
                published_at=date(2026, 7, 14),
                sort_order=1,
                is_active=True,
            )
        )
        db.commit()


client = TestClient(app)


def setup_function() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_admin_user] = override_admin_user
    app.dependency_overrides[get_translation_provider] = lambda: FakeProvider()


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_status_and_single_generation_endpoints() -> None:
    seed_news("single-news")
    with TestingSessionLocal() as db:
        article_id = db.query(NewsArticle.id).scalar()

    status_response = client.get(f"/api/management/translations/news/{article_id}")
    generation_response = client.post(
        f"/api/management/translations/news/{article_id}/generate",
        json={"force": False},
    )

    assert status_response.status_code == 200
    assert status_response.json()["status"] == "missing"
    assert generation_response.status_code == 200
    assert generation_response.json()["status"] == "current"


def test_batch_generation_fills_missing_records() -> None:
    seed_news("batch-news")

    response = client.post(
        "/api/management/translations/news/batch",
        json={"force": False, "limit": 50},
    )

    assert response.status_code == 200
    assert response.json()["processed"] == 1
    assert response.json()["current"] == 1


def test_repeated_batch_generation_advances_past_current_records() -> None:
    seed_news("first-batch-news")
    seed_news("second-batch-news")

    first = client.post(
        "/api/management/translations/news/batch",
        json={"force": False, "limit": 1},
    )
    second = client.post(
        "/api/management/translations/news/batch",
        json={"force": False, "limit": 1},
    )

    assert first.json()["processed"] == 1
    assert second.json()["processed"] == 1
    with TestingSessionLocal() as db:
        assert db.query(NewsArticle).filter(NewsArticle.translations != {}).count() == 2


def test_management_save_sanitizes_chinese_and_indonesian_rich_html() -> None:
    response = client.post(
        "/api/management/catalog/news",
        json={
            "title": "中文标题",
            "slug": "sanitized-news",
            "summary": "摘要",
            "content": '<p onclick="x()">中文</p><script>x()</script>',
            "source": "行业资讯",
            "published_at": "2026-07-14",
            "translations": {
                "id": {
                    "title": "Judul",
                    "summary": "Ringkasan",
                    "content": '<p onclick="x()">Isi</p><script>x()</script>',
                    "source": "Berita",
                },
                "en": {
                    "title": "English title",
                    "summary": "English summary",
                    "content": '<p onclick="x()">English body</p><script>x()</script>',
                    "source": "Industry news",
                }
            },
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["content"] == "<p>中文</p>"
    assert payload["translations"]["id"]["content"] == "<p>Isi</p>"
    assert payload["translations"]["en"]["content"] == "<p>English body</p>"
