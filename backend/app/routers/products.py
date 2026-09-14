import logging
import re
from types import SimpleNamespace

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select, true
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import Category, Product
from app.schemas.catalog import ProductListItemOut, ProductListOut, ProductOut, ProductSitemapItemOut
from app.services.search_filter import compact_search_text, fuzzy_text_filter
from app.services.product_public_slug import product_public_slug, product_public_slug_key

router = APIRouter(prefix="/products", tags=["products"])
logger = logging.getLogger(__name__)

PRODUCT_SORT_MAP = {
    "default": (Product.sort_order, Product.id),
    "name_asc": (Product.name.asc(), Product.id),
    "name_desc": (Product.name.desc(), Product.id.desc()),
}

PRODUCT_LIST_TRANSLATION_FIELDS = ("name", "model", "summary", "tag")
PUBLIC_LIST_LOCALES = ("en", "id")


def compact_product_list_records(db: Session, product_ids: list[int]) -> list[dict[str, object]]:
    if not product_ids:
        return []
    translation_columns = [
        Product.translations[locale][field].as_string().label(f"product_{locale}_{field}")
        for locale in PUBLIC_LIST_LOCALES
        for field in PRODUCT_LIST_TRANSLATION_FIELDS
    ]
    category_translation_columns = [
        Category.translations[locale]["name"].as_string().label(f"category_{locale}_name")
        for locale in PUBLIC_LIST_LOCALES
    ]
    rows = db.execute(
        select(
            Product.id,
            Product.product_code,
            Product.slug,
            Product.name,
            Product.model,
            Product.summary,
            Product.main_image,
            Product.image_tone,
            Product.tag,
            Product.tag_more,
            Product.is_hot,
            Product.sort_order,
            Product.is_indexable,
            Product.content_updated_at,
            Category.name.label("category_name"),
            Category.slug.label("category_slug"),
            Category.color.label("category_color"),
            *translation_columns,
            *category_translation_columns,
        )
        .join(Category, Category.id == Product.category_id)
        .where(Product.id.in_(product_ids))
    ).mappings()
    records: dict[int, dict[str, object]] = {}
    for row in rows:
        product_translations: dict[str, dict[str, str]] = {}
        category_translations: dict[str, dict[str, str]] = {}
        for locale in PUBLIC_LIST_LOCALES:
            translated_fields = {
                field: value
                for field in PRODUCT_LIST_TRANSLATION_FIELDS
                if (value := row[f"product_{locale}_{field}"])
            }
            if translated_fields:
                product_translations[locale] = translated_fields
            category_name = row[f"category_{locale}_name"]
            if category_name:
                category_translations[locale] = {"name": category_name}
        records[int(row["id"])] = {
            "id": row["id"],
            "product_code": row["product_code"],
            "slug": row["slug"],
            "name": row["name"],
            "model": row["model"],
            "summary": row["summary"],
            "main_image": row["main_image"],
            "image_tone": row["image_tone"],
            "tag": row["tag"],
            "tag_more": row["tag_more"] or [],
            "is_hot": row["is_hot"],
            "sort_order": row["sort_order"],
            "is_indexable": row["is_indexable"],
            "content_updated_at": row["content_updated_at"],
            "translations": product_translations,
            "category": {
                "name": row["category_name"],
                "slug": row["category_slug"],
                "color": row["category_color"],
                "translations": category_translations,
            },
        }
    return [records[product_id] for product_id in product_ids if product_id in records]


def resolve_product(db: Session, key: str) -> Product | None:
    if key.startswith("p-id-") and key[5:].isdigit():
        return db.scalar(select(Product).where(Product.id == int(key[5:]), Product.is_active == true()))

    indexed_key = key if key.casefold().endswith(".html") else f"{key}.html"
    product = db.scalar(
        select(Product).where(
            Product.public_slug_key == indexed_key.casefold(),
            Product.is_active == true(),
        )
    )
    if product is not None:
        return product

    product = db.scalar(select(Product).where(Product.slug == key, Product.is_active == true()))
    if product is not None:
        return product
    match = re.search(r"--(\d+)(?:\.html)?$", key)
    if match:
        return db.scalar(
            select(Product).where(Product.id == int(match.group(1)), Product.is_active == true())
        )

    # Temporary compatibility path for rows missed by an interrupted migration.
    public_name = key.removesuffix(".html").casefold()
    candidates = db.execute(
        select(
            Product.id,
            Product.name,
            Product.translations["en"]["name"].as_string().label("en_name"),
        )
        .where(Product.is_active == true())
    )
    for product_id, name, english_name in candidates:
        candidate = SimpleNamespace(
            id=product_id,
            name=name,
            translations={"en": {"name": english_name}} if english_name else {},
        )
        if product_public_slug_key(candidate).removesuffix(".html") == public_name:
            logger.warning("Product %s resolved through public slug migration fallback", product_id)
            return db.scalar(select(Product).where(Product.id == product_id, Product.is_active == true()))
    return None


def descendant_category_ids(db: Session, slug: str) -> set[int]:
    categories = list(
        db.scalars(
            select(Category)
            .where(Category.is_active == true())
            .order_by(Category.sort_order, Category.id)
        )
    )
    by_parent: dict[int | None, list[Category]] = {}
    for category in categories:
        by_parent.setdefault(category.parent_id, []).append(category)
    root = next((category for category in categories if category.slug == slug), None)
    if root is None:
        return set()
    result = {root.id}
    stack = [root.id]
    while stack:
        current_id = stack.pop()
        for child in by_parent.get(current_id, []):
            if child.id in result:
                continue
            result.add(child.id)
            stack.append(child.id)
    return result


@router.get("", response_model=ProductListOut)
def list_products(
    category: str | None = Query(default=None),
    q: str | None = Query(default=None),
    hot: bool | None = Query(default=None),
    sort: str = Query(default="default", pattern="^(default|name_asc|name_desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=500),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    active_category_ids = select(Category.id).where(Category.is_active == true())
    statement = (
        select(Product)
        .where(
            Product.is_active == true(),
            Product.category_id.in_(active_category_ids),
        )
    )

    if category:
        category_ids = descendant_category_ids(db, category)
        if not category_ids:
            return {"items": [], "total": 0, "page": page, "page_size": page_size}
        statement = statement.where(Product.category_id.in_(category_ids))

    if hot is not None:
        statement = statement.where(Product.is_hot == hot)

    if q:
        compact_query = compact_search_text(q)
        if compact_query.startswith("p") and compact_query[1:].isdigit():
            compact_code = func.replace(func.replace(func.lower(Product.product_code), "-", ""), " ", "")
            statement = statement.where(compact_code == compact_query)
        else:
            statement = statement.where(or_(
                fuzzy_text_filter(
                    q,
                    Product.name,
                    Product.product_code,
                    Product.model,
                    Product.slug,
                    Product.summary,
                    Product.description,
                    Product.highlights,
                    Product.specifications,
                    Product.translations,
                ),
                Product.category.has(fuzzy_text_filter(
                    q,
                    Category.name,
                    Category.slug,
                    Category.translations,
                )),
            ))

    total = db.scalar(select(func.count()).select_from(statement.order_by(None).subquery())) or 0
    item_ids = list(
        db.scalars(
            statement.with_only_columns(Product.id)
            .order_by(*PRODUCT_SORT_MAP[sort])
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    )
    items = compact_product_list_records(db, item_ids)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/sitemap", response_model=list[ProductSitemapItemOut])
def product_sitemap(db: Session = Depends(get_db)) -> list[dict[str, object]]:
    rows = db.execute(
        select(
            Product.id,
            Product.slug,
            Product.name,
            Product.is_indexable,
            Product.content_updated_at,
            Product.translations["en"]["name"].as_string().label("en_name"),
            Product.translations["en"]["_meta"]["status"].as_string().label("en_status"),
            Product.translations["id"]["name"].as_string().label("id_name"),
            Product.translations["id"]["_meta"]["status"].as_string().label("id_status"),
        ).where(Product.is_active == true())
    )
    items: list[dict[str, object]] = []
    for row in rows:
        translations: dict[str, object] = {}
        for locale in ("en", "id"):
            name = getattr(row, f"{locale}_name")
            status = getattr(row, f"{locale}_status")
            if name or status:
                payload: dict[str, object] = {}
                if name:
                    payload["name"] = name
                if status:
                    payload["_meta"] = {"status": status}
                translations[locale] = payload
        product = SimpleNamespace(id=row.id, name=row.name, translations={"en": {"name": row.en_name}})
        items.append({
            "id": row.id,
            "slug": row.slug,
            "public_slug": product_public_slug(product),
            "is_indexable": row.is_indexable,
            "content_updated_at": row.content_updated_at,
            "translations": translations,
        })
    return items


@router.get("/{slug}/related", response_model=list[ProductListItemOut])
def get_related_products(
    slug: str,
    limit: int = Query(default=3, ge=1, le=6),
    db: Session = Depends(get_db),
) -> list[dict[str, object]]:
    product = resolve_product(db, slug)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    related_ids = list(
        db.scalars(
            select(Product.id)
            .where(
                Product.category_id == product.category_id,
                Product.id != product.id,
                Product.is_active == true(),
            )
            .order_by(Product.sort_order, Product.id)
            .limit(limit)
        )
    )
    return compact_product_list_records(db, related_ids)


@router.get("/{slug}", response_model=ProductOut)
def get_product(slug: str, db: Session = Depends(get_db)) -> Product:
    product = resolve_product(db, slug)
    if product is not None:
        product = db.scalar(select(Product).options(joinedload(Product.category)).where(Product.id == product.id))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
