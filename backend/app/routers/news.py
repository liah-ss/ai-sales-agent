from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, load_only

from app.core.database import get_db
from app.models import NewsArticle
from app.schemas.catalog import NewsArticleListOut, NewsArticleOut
from app.services.search_filter import fuzzy_text_filter

router = APIRouter(prefix="/news", tags=["news"])


@router.get("", response_model=NewsArticleListOut)
def list_news(
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=8, ge=1, le=40),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    statement = select(NewsArticle).options(load_only(
        NewsArticle.id,
        NewsArticle.title,
        NewsArticle.slug,
        NewsArticle.summary,
        NewsArticle.thumbnail_url,
        NewsArticle.source,
        NewsArticle.translations,
        NewsArticle.published_at,
        NewsArticle.sort_order,
        NewsArticle.is_indexable,
        NewsArticle.content_updated_at,
    )).where(NewsArticle.is_active.is_(True))
    if q:
        statement = statement.where(fuzzy_text_filter(
            q,
            NewsArticle.title,
            NewsArticle.slug,
            NewsArticle.summary,
            NewsArticle.content,
            NewsArticle.source,
            NewsArticle.translations,
        ))
    total = db.scalar(select(func.count()).select_from(statement.order_by(None).subquery())) or 0
    items = list(
        db.scalars(
            statement.order_by(NewsArticle.sort_order, NewsArticle.published_at.desc(), NewsArticle.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{slug}", response_model=NewsArticleOut)
def get_news_article(slug: str, db: Session = Depends(get_db)) -> NewsArticle:
    article = db.scalar(select(NewsArticle).where(NewsArticle.slug == slug, NewsArticle.is_active.is_(True)))
    if article is None:
        raise HTTPException(status_code=404, detail="News article not found")
    return article
