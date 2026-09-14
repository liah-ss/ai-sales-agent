from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, load_only

from app.core.database import get_db
from app.models import Solution
from app.schemas.catalog import SolutionListItemOut, SolutionOut
from app.services.search_filter import fuzzy_text_filter

router = APIRouter(prefix="/solutions", tags=["solutions"])


@router.get("", response_model=list[SolutionListItemOut])
def list_solutions(
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[Solution]:
    statement = select(Solution).options(load_only(
        Solution.id,
        Solution.title,
        Solution.slug,
        Solution.icon,
        Solution.summary,
        Solution.scenarios,
        Solution.translations,
        Solution.sort_order,
        Solution.is_indexable,
        Solution.content_updated_at,
    )).where(Solution.is_active.is_(True))
    if q:
        statement = statement.where(fuzzy_text_filter(
            q,
            Solution.title,
            Solution.slug,
            Solution.summary,
            Solution.content,
            Solution.document_sections,
            Solution.scenarios,
            Solution.equipment,
            Solution.benefits,
            Solution.detailed_description,
            Solution.pitfalls,
            Solution.core_parameters,
            Solution.special_contributions,
            Solution.translations,
        ))
    return list(
        db.scalars(
            statement.order_by(Solution.sort_order, Solution.id)
        )
    )


@router.get("/{slug}", response_model=SolutionOut)
def get_solution(slug: str, db: Session = Depends(get_db)) -> Solution:
    solution = db.scalar(select(Solution).where(Solution.slug == slug, Solution.is_active.is_(True)))
    if solution is None:
        raise HTTPException(status_code=404, detail="Solution not found")
    return solution
