from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, load_only

from app.core.database import get_db
from app.models import DeliveryCase
from app.schemas.catalog import DeliveryCaseListOut, DeliveryCaseOut
from app.services.search_filter import fuzzy_text_filter

router = APIRouter(prefix="/delivery-cases", tags=["delivery-cases"])


@router.get("", response_model=DeliveryCaseListOut)
def list_delivery_cases(
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=8, ge=1, le=40),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    statement = select(DeliveryCase).options(load_only(
        DeliveryCase.id,
        DeliveryCase.title,
        DeliveryCase.slug,
        DeliveryCase.summary,
        DeliveryCase.thumbnail_url,
        DeliveryCase.client_name,
        DeliveryCase.industry,
        DeliveryCase.location,
        DeliveryCase.translations,
        DeliveryCase.delivered_at,
        DeliveryCase.sort_order,
        DeliveryCase.is_indexable,
        DeliveryCase.content_updated_at,
    )).where(DeliveryCase.is_active.is_(True))
    if q:
        statement = statement.where(fuzzy_text_filter(
            q,
            DeliveryCase.title,
            DeliveryCase.slug,
            DeliveryCase.summary,
            DeliveryCase.content,
            DeliveryCase.project_overview,
            DeliveryCase.indonesia_fit,
            DeliveryCase.professional_configuration,
            DeliveryCase.key_parameter_table,
            DeliveryCase.delivery_challenges,
            DeliveryCase.project_results,
            DeliveryCase.client_name,
            DeliveryCase.industry,
            DeliveryCase.location,
            DeliveryCase.translations,
        ))
    total = db.scalar(select(func.count()).select_from(statement.order_by(None).subquery())) or 0
    items = list(
        db.scalars(
            statement.order_by(DeliveryCase.sort_order, DeliveryCase.delivered_at.desc(), DeliveryCase.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{slug}", response_model=DeliveryCaseOut)
def get_delivery_case(slug: str, db: Session = Depends(get_db)) -> DeliveryCase:
    case = db.scalar(select(DeliveryCase).where(DeliveryCase.slug == slug, DeliveryCase.is_active.is_(True)))
    if case is None:
        raise HTTPException(status_code=404, detail="Delivery case not found")
    return case
