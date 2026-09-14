from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Category
from app.schemas.catalog import CategoryTreeOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryTreeOut])
def list_categories(db: Session = Depends(get_db)) -> list[dict[str, object]]:
    categories = list(
        db.scalars(
            select(Category)
            .where(Category.is_active.is_(True))
            .order_by(Category.sort_order, Category.id)
        )
    )
    category_rows = [
        {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "parent_id": category.parent_id,
            "color": category.color,
            "translations": category.translations,
            "sort_order": category.sort_order,
            "children": [],
        }
        for category in categories
    ]
    by_id = {row["id"]: row for row in category_rows}
    roots: list[dict[str, object]] = []
    for row in category_rows:
        parent_id = row["parent_id"]
        parent = by_id.get(parent_id) if isinstance(parent_id, int) else None
        if parent is None:
            roots.append(row)
        else:
            parent["children"].append(row)
    return roots
