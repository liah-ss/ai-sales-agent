from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, load_only

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models import AdminUser, Category, DeliveryCase, NewsArticle, Product, Solution
from app.schemas.management_catalog import (
    ActiveStateIn,
    ManagementCatalogCountsOut,
    ManagementCategoryBulkIn,
    ManagementCategoryIn,
    ManagementCategoryOut,
    ManagementCategoryListItemOut,
    ManagementDeliveryCaseBulkIn,
    ManagementDeliveryCaseIn,
    ManagementDeliveryCaseOut,
    ManagementDeliveryCaseListItemOut,
    ManagementProductBulkIn,
    ManagementProductIn,
    ManagementProductListOut,
    ManagementProductOut,
    ProductDetailUploadOut,
    ManagementNewsArticleBulkIn,
    ManagementNewsArticleIn,
    ManagementNewsArticleOut,
    ManagementNewsArticleListItemOut,
    ManagementSolutionBulkIn,
    ManagementSolutionIn,
    ManagementSolutionOut,
    ManagementSolutionListItemOut,
)
from app.services.product_detail_parser import parse_product_detail_upload
from app.services.cos_storage import get_cos_storage
from app.services.operation_logger import model_snapshot, record_operation
from app.services.search_filter import compact_search_text, fuzzy_text_filter

router = APIRouter(prefix="/management/catalog", tags=["management-catalog"])
PRODUCT_DETAIL_UPLOAD_ROOT = Path("backend/uploads/product-details")
MAX_PRODUCT_DETAIL_FILE_SIZE = 30 * 1024 * 1024


def ensure_unique_slug(db: Session, model: type, slug: str, current_id: int | None = None) -> None:
    statement = select(model).where(model.slug == slug)
    if current_id is not None:
        statement = statement.where(model.id != current_id)
    if db.scalar(statement) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")


def get_or_404(db: Session, model: type, item_id: int):
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


def ensure_bulk_payload(items: list, label: str) -> None:
    if not items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{label} import list is empty")
    if len(items) > 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{label} import limit is 200 rows")


def ensure_unique_bulk_slugs(db: Session, model: type, slugs: list[str]) -> None:
    duplicated = {slug for slug in slugs if slugs.count(slug) > 1}
    if duplicated:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Duplicated slugs: {', '.join(sorted(duplicated))}")
    existing = list(db.scalars(select(model.slug).where(model.slug.in_(slugs))))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Slug already exists: {', '.join(sorted(existing))}")


def next_product_codes(db: Session, count: int) -> list[str]:
    rows = list(db.scalars(select(Product.product_code).where(Product.product_code.is_not(None))))
    max_number = 0
    for code in rows:
        if not code:
            continue
        normalized = code.strip().upper()
        if normalized.startswith("P-"):
            suffix = normalized[2:]
        elif normalized.startswith("P"):
            suffix = normalized[1:]
        else:
            continue
        if suffix.isdigit():
            max_number = max(max_number, int(suffix))
    return [f"P-{max_number + index + 1:03d}" for index in range(count)]


def normalized_product_code(value: str | None) -> str | None:
    code = value.strip() if value else ""
    return code or None


def ensure_unique_product_code(db: Session, product_code: str, current_id: int | None = None) -> None:
    statement = select(Product).where(Product.product_code == product_code)
    if current_id is not None:
        statement = statement.where(Product.id != current_id)
    if db.scalar(statement) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product code already exists")


def ensure_valid_category_parent(db: Session, parent_id: int | None, current_id: int | None = None) -> None:
    if parent_id is None:
        return
    if current_id is not None and parent_id == current_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category cannot be its own parent")
    parent = db.get(Category, parent_id)
    if parent is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent category does not exist")
    visited: set[int] = set()
    while parent is not None:
        if parent.id in visited:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category parent cycle is not allowed")
        visited.add(parent.id)
        if current_id is not None and parent.parent_id == current_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category parent cycle is not allowed")
        parent = db.get(Category, parent.parent_id) if parent.parent_id else None


def ensure_product_category(db: Session, category_id: int) -> Category:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="商品分类不存在")
    if category.parent_id is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="商品只能选择二级分类")
    return category


@router.get("/counts", response_model=ManagementCatalogCountsOut)
def get_catalog_counts(
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> ManagementCatalogCountsOut:
    return ManagementCatalogCountsOut(
        categories=db.scalar(select(func.count(Category.id))) or 0,
        products=db.scalar(select(func.count(Product.id))) or 0,
        active_products=db.scalar(select(func.count(Product.id)).where(Product.is_active.is_(True))) or 0,
        solutions=db.scalar(select(func.count(Solution.id))) or 0,
        news=db.scalar(select(func.count(NewsArticle.id))) or 0,
        delivery_cases=db.scalar(select(func.count(DeliveryCase.id))) or 0,
    )


@router.get("/categories", response_model=list[ManagementCategoryListItemOut])
def list_categories(
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[Category]:
    return list(db.scalars(select(Category).options(load_only(
        Category.id,
        Category.name,
        Category.slug,
        Category.parent_id,
        Category.color,
        Category.sort_order,
        Category.is_active,
    )).order_by(Category.sort_order, Category.id)))


@router.get("/categories/{category_id}", response_model=ManagementCategoryOut)
def get_category(
    category_id: int,
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Category:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("/categories", response_model=ManagementCategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: ManagementCategoryIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Category:
    ensure_unique_slug(db, Category, payload.slug)
    ensure_valid_category_parent(db, payload.parent_id)
    category = Category(**payload.model_dump())
    db.add(category)
    db.flush()
    record_operation(db, current_user, "分类管理", "新增分类", None, category)
    db.commit()
    db.refresh(category)
    return category


@router.post("/categories/bulk", response_model=list[ManagementCategoryOut], status_code=status.HTTP_201_CREATED)
def bulk_create_categories(
    payload: ManagementCategoryBulkIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[Category]:
    ensure_bulk_payload(payload.items, "Category")
    ensure_unique_bulk_slugs(db, Category, [item.slug for item in payload.items])
    for item in payload.items:
        ensure_valid_category_parent(db, item.parent_id)
    categories = [Category(**item.model_dump()) for item in payload.items]
    db.add_all(categories)
    db.flush()
    record_operation(
        db,
        current_user,
        "分类管理",
        "批量导入分类",
        None,
        {"count": len(categories), "items": [model_snapshot(category) for category in categories]},
    )
    db.commit()
    return list(db.scalars(select(Category).where(Category.id.in_([category.id for category in categories])).order_by(Category.sort_order, Category.id)))


@router.put("/categories/{category_id}", response_model=ManagementCategoryOut)
def update_category(
    category_id: int,
    payload: ManagementCategoryIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Category:
    category = get_or_404(db, Category, category_id)
    ensure_unique_slug(db, Category, payload.slug, category_id)
    ensure_valid_category_parent(db, payload.parent_id, category_id)
    before = model_snapshot(category)
    for key, value in payload.model_dump().items():
        setattr(category, key, value)
    db.add(category)
    record_operation(db, current_user, "分类管理", "编辑分类", before, category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/categories/{category_id}/active", response_model=ManagementCategoryOut)
def set_category_active(
    category_id: int,
    payload: ActiveStateIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Category:
    category = get_or_404(db, Category, category_id)
    before = model_snapshot(category)
    category.is_active = payload.is_active
    db.add(category)
    record_operation(db, current_user, "分类管理", "修改分类状态", before, category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> None:
    category = get_or_404(db, Category, category_id)
    linked_child = db.scalar(select(Category.id).where(Category.parent_id == category_id).limit(1))
    if linked_child is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category has subcategories. Delete or move subcategories before deleting this category.",
        )
    linked_product = db.scalar(select(Product.id).where(Product.category_id == category_id).limit(1))
    if linked_product is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category has products. Delete or move products before deleting this category.",
        )
    before = model_snapshot(category)
    db.delete(category)
    record_operation(db, current_user, "分类管理", "删除分类", before, None)
    db.commit()


@router.get("/products", response_model=ManagementProductListOut)
def list_products(
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    statement = select(Product).join(Product.category).options(
        load_only(
            Product.id,
            Product.product_code,
            Product.batch_number,
            Product.category_id,
            Product.name,
            Product.slug,
            Product.model,
            Product.price_mode,
            Product.is_hot,
            Product.is_active,
            Product.sort_order,
        ),
        joinedload(Product.category).load_only(Category.id, Category.name, Category.slug),
    )
    if q:
        compact_query = compact_search_text(q)
        if compact_query.startswith("p") and compact_query[1:].isdigit():
            compact_code = func.replace(func.replace(func.lower(Product.product_code), "-", ""), " ", "")
            statement = statement.where(compact_code == compact_query)
        else:
            statement = statement.where(fuzzy_text_filter(
                q,
                Product.name,
                Product.product_code,
                Product.model,
                Product.slug,
                Product.summary,
                Product.description,
                Product.translations,
                Category.name,
                Category.slug,
                Category.translations,
            ))

    total = db.scalar(select(func.count()).select_from(statement.order_by(None).subquery())) or 0
    all_total = db.scalar(select(func.count(Product.id))) or 0
    active_total = db.scalar(select(func.count(Product.id)).where(Product.is_active.is_(True))) or 0
    items = list(
        db.scalars(
            statement
            .order_by(Product.sort_order, Product.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    )
    return {
        "items": items,
        "total": total,
        "all_total": all_total,
        "active_total": active_total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/products/{product_id}", response_model=ManagementProductOut)
def get_product(
    product_id: int,
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Product:
    product = db.scalar(
        select(Product)
        .options(joinedload(Product.category))
        .where(Product.id == product_id)
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/products/detail-assets", response_model=ProductDetailUploadOut, status_code=status.HTTP_201_CREATED)
async def upload_product_detail_asset(
    file: UploadFile = File(...),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> ProductDetailUploadOut:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is empty")
    if len(content) > MAX_PRODUCT_DETAIL_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size must be under 30MB")
    try:
        blocks = parse_product_detail_upload(
            filename=file.filename or "upload.bin",
            content_type=file.content_type or "application/octet-stream",
            content=content,
            upload_root=PRODUCT_DETAIL_UPLOAD_ROOT,
            public_root="/uploads/product-details",
            public_storage=get_cos_storage(),
        )
    except (ValueError, OSError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    record_operation(
        db,
        current_user,
        "产品管理",
        "上传商品详情资料",
        None,
        {"filename": file.filename, "block_count": len(blocks)},
    )
    db.commit()
    return ProductDetailUploadOut(blocks=blocks)


@router.post("/products", response_model=ManagementProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ManagementProductIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Product:
    ensure_unique_slug(db, Product, payload.slug)
    ensure_product_category(db, payload.category_id)
    product_data = payload.model_dump()
    product_code = normalized_product_code(product_data.pop("product_code")) or next_product_codes(db, 1)[0]
    ensure_unique_product_code(db, product_code)
    product = Product(**product_data, product_code=product_code)
    db.add(product)
    db.flush()
    record_operation(db, current_user, "产品管理", "新增产品", None, product)
    db.commit()
    db.refresh(product)
    product = db.scalar(select(Product).options(joinedload(Product.category)).where(Product.id == product.id))
    return product


@router.post("/products/bulk", response_model=list[ManagementProductOut], status_code=status.HTTP_201_CREATED)
def bulk_create_products(
    payload: ManagementProductBulkIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[Product]:
    ensure_bulk_payload(payload.items, "Product")
    ensure_unique_bulk_slugs(db, Product, [item.slug for item in payload.items])
    category_ids = {item.category_id for item in payload.items}
    for category_id in category_ids:
        ensure_product_category(db, category_id)

    generated_product_codes = iter(next_product_codes(db, len(payload.items)))
    product_codes: list[str] = []
    product_data_list: list[dict] = []
    for item in payload.items:
        product_data = item.model_dump()
        product_code = normalized_product_code(product_data.pop("product_code")) or next(generated_product_codes)
        product_codes.append(product_code)
        product_data_list.append(product_data)
    duplicated_product_codes = {code for code in product_codes if product_codes.count(code) > 1}
    if duplicated_product_codes:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Duplicated product codes: {', '.join(sorted(duplicated_product_codes))}")
    for product_code in product_codes:
        ensure_unique_product_code(db, product_code)
    products = [Product(**product_data, product_code=product_codes[index]) for index, product_data in enumerate(product_data_list)]
    db.add_all(products)
    db.flush()
    record_operation(
        db,
        current_user,
        "产品管理",
        "批量导入产品",
        None,
        {"count": len(products), "items": [model_snapshot(product) for product in products]},
    )
    product_ids = [product.id for product in products]
    db.commit()
    return list(
        db.scalars(
            select(Product)
            .options(joinedload(Product.category))
            .where(Product.id.in_(product_ids))
            .order_by(Product.sort_order, Product.id)
        )
    )


@router.put("/products/{product_id}", response_model=ManagementProductOut)
def update_product(
    product_id: int,
    payload: ManagementProductIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Product:
    product = get_or_404(db, Product, product_id)
    ensure_unique_slug(db, Product, payload.slug, product_id)
    ensure_product_category(db, payload.category_id)
    before = model_snapshot(product)
    product_data = payload.model_dump()
    product_code = normalized_product_code(product_data.pop("product_code"))
    if product_code is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product code is required")
    ensure_unique_product_code(db, product_code, product_id)
    product.product_code = product_code
    for key, value in product_data.items():
        if key == "tag_more" and key not in payload.model_fields_set:
            continue
        setattr(product, key, value)
    db.add(product)
    record_operation(db, current_user, "产品管理", "编辑产品", before, product)
    db.commit()
    product = db.scalar(select(Product).options(joinedload(Product.category)).where(Product.id == product_id))
    return product


@router.patch("/products/{product_id}/active", response_model=ManagementProductOut)
def set_product_active(
    product_id: int,
    payload: ActiveStateIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Product:
    product = get_or_404(db, Product, product_id)
    before = model_snapshot(product)
    product.is_active = payload.is_active
    db.add(product)
    record_operation(db, current_user, "产品管理", "修改产品状态", before, product)
    db.commit()
    product = db.scalar(select(Product).options(joinedload(Product.category)).where(Product.id == product_id))
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> None:
    product = get_or_404(db, Product, product_id)
    before = model_snapshot(product)
    db.delete(product)
    record_operation(db, current_user, "产品管理", "删除产品", before, None)
    db.commit()


@router.get("/solutions", response_model=list[ManagementSolutionListItemOut])
def list_solutions(
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[Solution]:
    return list(db.scalars(select(Solution).options(load_only(
        Solution.id,
        Solution.title,
        Solution.slug,
        Solution.scenarios,
        Solution.sort_order,
        Solution.is_active,
    )).order_by(Solution.sort_order, Solution.id)))


@router.get("/solutions/{solution_id}", response_model=ManagementSolutionOut)
def get_solution(
    solution_id: int,
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Solution:
    solution = db.get(Solution, solution_id)
    if solution is None:
        raise HTTPException(status_code=404, detail="Solution not found")
    return solution


@router.post("/solutions", response_model=ManagementSolutionOut, status_code=status.HTTP_201_CREATED)
def create_solution(
    payload: ManagementSolutionIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Solution:
    ensure_unique_slug(db, Solution, payload.slug)
    solution = Solution(**payload.model_dump())
    db.add(solution)
    db.flush()
    record_operation(db, current_user, "解决方案", "新增解决方案", None, solution)
    db.commit()
    db.refresh(solution)
    return solution


@router.post("/solutions/bulk", response_model=list[ManagementSolutionOut], status_code=status.HTTP_201_CREATED)
def bulk_create_solutions(
    payload: ManagementSolutionBulkIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[Solution]:
    ensure_bulk_payload(payload.items, "Solution")
    ensure_unique_bulk_slugs(db, Solution, [item.slug for item in payload.items])
    solutions = [Solution(**item.model_dump()) for item in payload.items]
    db.add_all(solutions)
    db.flush()
    record_operation(
        db,
        current_user,
        "解决方案",
        "批量导入解决方案",
        None,
        {"count": len(solutions), "items": [model_snapshot(solution) for solution in solutions]},
    )
    solution_ids = [solution.id for solution in solutions]
    db.commit()
    return list(db.scalars(select(Solution).where(Solution.id.in_(solution_ids)).order_by(Solution.sort_order, Solution.id)))


@router.put("/solutions/{solution_id}", response_model=ManagementSolutionOut)
def update_solution(
    solution_id: int,
    payload: ManagementSolutionIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Solution:
    solution = get_or_404(db, Solution, solution_id)
    ensure_unique_slug(db, Solution, payload.slug, solution_id)
    before = model_snapshot(solution)
    for key, value in payload.model_dump().items():
        setattr(solution, key, value)
    db.add(solution)
    record_operation(db, current_user, "解决方案", "编辑解决方案", before, solution)
    db.commit()
    db.refresh(solution)
    return solution


@router.delete("/solutions/{solution_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_solution(
    solution_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> None:
    solution = get_or_404(db, Solution, solution_id)
    before = model_snapshot(solution)
    db.delete(solution)
    record_operation(db, current_user, "解决方案", "删除解决方案", before, None)
    db.commit()


@router.patch("/solutions/{solution_id}/active", response_model=ManagementSolutionOut)
def set_solution_active(
    solution_id: int,
    payload: ActiveStateIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Solution:
    solution = get_or_404(db, Solution, solution_id)
    before = model_snapshot(solution)
    solution.is_active = payload.is_active
    db.add(solution)
    record_operation(db, current_user, "解决方案", "修改解决方案状态", before, solution)
    db.commit()
    db.refresh(solution)
    return solution


@router.get("/news", response_model=list[ManagementNewsArticleListItemOut])
def list_news_articles(
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[NewsArticle]:
    return list(db.scalars(select(NewsArticle).options(load_only(
        NewsArticle.id,
        NewsArticle.title,
        NewsArticle.slug,
        NewsArticle.source,
        NewsArticle.published_at,
        NewsArticle.sort_order,
        NewsArticle.is_active,
    )).order_by(NewsArticle.sort_order, NewsArticle.published_at.desc(), NewsArticle.id)))


@router.get("/news/{article_id}", response_model=ManagementNewsArticleOut)
def get_news_article(
    article_id: int,
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> NewsArticle:
    article = db.get(NewsArticle, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="News article not found")
    return article


@router.post("/news", response_model=ManagementNewsArticleOut, status_code=status.HTTP_201_CREATED)
def create_news_article(
    payload: ManagementNewsArticleIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> NewsArticle:
    ensure_unique_slug(db, NewsArticle, payload.slug)
    article = NewsArticle(**payload.model_dump())
    db.add(article)
    db.flush()
    record_operation(db, current_user, "资讯管理", "新增资讯", None, article)
    db.commit()
    db.refresh(article)
    return article


@router.post("/news/bulk", response_model=list[ManagementNewsArticleOut], status_code=status.HTTP_201_CREATED)
def bulk_create_news_articles(
    payload: ManagementNewsArticleBulkIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[NewsArticle]:
    ensure_bulk_payload(payload.items, "News")
    ensure_unique_bulk_slugs(db, NewsArticle, [item.slug for item in payload.items])
    articles = [NewsArticle(**item.model_dump()) for item in payload.items]
    db.add_all(articles)
    db.flush()
    record_operation(
        db,
        current_user,
        "资讯管理",
        "批量导入资讯",
        None,
        {"count": len(articles), "items": [model_snapshot(article) for article in articles]},
    )
    article_ids = [article.id for article in articles]
    db.commit()
    return list(db.scalars(select(NewsArticle).where(NewsArticle.id.in_(article_ids)).order_by(NewsArticle.sort_order, NewsArticle.id)))


@router.put("/news/{article_id}", response_model=ManagementNewsArticleOut)
def update_news_article(
    article_id: int,
    payload: ManagementNewsArticleIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> NewsArticle:
    article = get_or_404(db, NewsArticle, article_id)
    ensure_unique_slug(db, NewsArticle, payload.slug, article_id)
    before = model_snapshot(article)
    for key, value in payload.model_dump().items():
        setattr(article, key, value)
    db.add(article)
    record_operation(db, current_user, "资讯管理", "编辑资讯", before, article)
    db.commit()
    db.refresh(article)
    return article


@router.delete("/news/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news_article(
    article_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> None:
    article = get_or_404(db, NewsArticle, article_id)
    before = model_snapshot(article)
    db.delete(article)
    record_operation(db, current_user, "资讯管理", "删除资讯", before, None)
    db.commit()


@router.patch("/news/{article_id}/active", response_model=ManagementNewsArticleOut)
def set_news_article_active(
    article_id: int,
    payload: ActiveStateIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> NewsArticle:
    article = get_or_404(db, NewsArticle, article_id)
    before = model_snapshot(article)
    article.is_active = payload.is_active
    db.add(article)
    record_operation(db, current_user, "资讯管理", "修改资讯状态", before, article)
    db.commit()
    db.refresh(article)
    return article


@router.get("/delivery-cases", response_model=list[ManagementDeliveryCaseListItemOut])
def list_delivery_cases(
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[DeliveryCase]:
    return list(db.scalars(select(DeliveryCase).options(load_only(
        DeliveryCase.id,
        DeliveryCase.title,
        DeliveryCase.slug,
        DeliveryCase.industry,
        DeliveryCase.delivered_at,
        DeliveryCase.sort_order,
        DeliveryCase.is_active,
    )).order_by(DeliveryCase.sort_order, DeliveryCase.delivered_at.desc(), DeliveryCase.id)))


@router.get("/delivery-cases/{case_id}", response_model=ManagementDeliveryCaseOut)
def get_delivery_case(
    case_id: int,
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> DeliveryCase:
    delivery_case = db.get(DeliveryCase, case_id)
    if delivery_case is None:
        raise HTTPException(status_code=404, detail="Delivery case not found")
    return delivery_case


@router.post("/delivery-cases", response_model=ManagementDeliveryCaseOut, status_code=status.HTTP_201_CREATED)
def create_delivery_case(
    payload: ManagementDeliveryCaseIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> DeliveryCase:
    ensure_unique_slug(db, DeliveryCase, payload.slug)
    case = DeliveryCase(**payload.model_dump())
    db.add(case)
    db.flush()
    record_operation(db, current_user, "交付案例管理", "新增交付案例", None, case)
    db.commit()
    db.refresh(case)
    return case


@router.post("/delivery-cases/bulk", response_model=list[ManagementDeliveryCaseOut], status_code=status.HTTP_201_CREATED)
def bulk_create_delivery_cases(
    payload: ManagementDeliveryCaseBulkIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[DeliveryCase]:
    ensure_bulk_payload(payload.items, "Delivery case")
    ensure_unique_bulk_slugs(db, DeliveryCase, [item.slug for item in payload.items])
    cases = [DeliveryCase(**item.model_dump()) for item in payload.items]
    db.add_all(cases)
    db.flush()
    record_operation(
        db,
        current_user,
        "交付案例管理",
        "批量导入交付案例",
        None,
        {"count": len(cases), "items": [model_snapshot(case) for case in cases]},
    )
    case_ids = [case.id for case in cases]
    db.commit()
    return list(db.scalars(select(DeliveryCase).where(DeliveryCase.id.in_(case_ids)).order_by(DeliveryCase.sort_order, DeliveryCase.id)))


@router.put("/delivery-cases/{case_id}", response_model=ManagementDeliveryCaseOut)
def update_delivery_case(
    case_id: int,
    payload: ManagementDeliveryCaseIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> DeliveryCase:
    case = get_or_404(db, DeliveryCase, case_id)
    ensure_unique_slug(db, DeliveryCase, payload.slug, case_id)
    before = model_snapshot(case)
    for key, value in payload.model_dump().items():
        setattr(case, key, value)
    db.add(case)
    record_operation(db, current_user, "交付案例管理", "编辑交付案例", before, case)
    db.commit()
    db.refresh(case)
    return case


@router.delete("/delivery-cases/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_delivery_case(
    case_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> None:
    case = get_or_404(db, DeliveryCase, case_id)
    before = model_snapshot(case)
    db.delete(case)
    record_operation(db, current_user, "交付案例管理", "删除交付案例", before, None)
    db.commit()


@router.patch("/delivery-cases/{case_id}/active", response_model=ManagementDeliveryCaseOut)
def set_delivery_case_active(
    case_id: int,
    payload: ActiveStateIn,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> DeliveryCase:
    case = get_or_404(db, DeliveryCase, case_id)
    before = model_snapshot(case)
    case.is_active = payload.is_active
    db.add(case)
    record_operation(db, current_user, "交付案例管理", "修改交付案例状态", before, case)
    db.commit()
    db.refresh(case)
    return case
