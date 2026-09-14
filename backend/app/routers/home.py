from urllib.parse import urlsplit, urlunsplit

from fastapi import APIRouter, Depends
from sqlalchemy import select, true
from sqlalchemy.orm import Session, load_only

from app.core.database import get_db
from app.core.config import get_settings
from app.models import Banner, Category, ContentBlock, HomeMetric, Product, Solution
from app.routers.site_settings import read_settings
from app.routers.website_config import get_config_record
from app.routers.products import compact_product_list_records
from app.schemas.catalog import HomeOut

router = APIRouter(prefix="/home", tags=["home"])
HOME_PRODUCT_LIMIT = 5

# These aliases were used by the original banner seed data. Product detail
# pages now use the generated public slug, so keep old managed links working.
LEGACY_BANNER_PRODUCT_SLUGS = {
    "oil-immersed-distribution-transformer": "Oil-Immersed-Transformer-MT-11-10-0-4-kV-S13-S20-S22.html",
    "low-voltage-complete-distribution-cabinet": "Low-Voltage-Drawer-Type-Switchgear-Low-Voltage-Complete-Power-Distribution-Board-Withdrawable-Switchboard-GEN-4-GEN-3-GEN-1-GEN-2-0-4-kV.html",
    "pv-box-type-substation": "Pad-mounted-Transformer-Pad-mounted-Substation-PV-Pad-mounted-Substation-EV-Charging-Station-PV-Power-Plant-with-EV-Charging-Station.html",
    "smart-ami-meter": "Smart-Electricity-Meter.html",
}


def _canonicalize_banner_link(value: str) -> str:
    parts = urlsplit(value)
    path_parts = parts.path.rstrip("/").split("/")
    if len(path_parts) >= 3 and path_parts[-2] == "products":
        legacy_slug = path_parts[-1].removesuffix(".html")
        canonical_slug = LEGACY_BANNER_PRODUCT_SLUGS.get(legacy_slug)
        if canonical_slug:
            path_parts[-1] = canonical_slug
            return urlunsplit((parts.scheme, parts.netloc, "/".join(path_parts), parts.query, parts.fragment))
    return value


def _configured_banners(payload: dict[str, object]) -> list[dict[str, object]]:
    """Adapt managed website Banner settings to the public home response."""
    configured = payload.get("banners")
    if not isinstance(configured, list):
        return []

    result: list[dict[str, object]] = []
    for index, banner in enumerate(configured, start=1):
        if not isinstance(banner, dict):
            continue
        if not bool(banner.get("enabled", True)) or str(banner.get("slot") or "desktop") != "desktop":
            continue
        banner_id = str(banner.get("id") or f"banner-{index}")
        link_url = _canonicalize_banner_link(str(banner.get("linkUrl") or "/products").strip())
        if link_url.startswith("/"):
            link_url = f"{get_settings().public_site_url.rstrip('/')}{link_url}"
        result.append({
            "id": index,
            "title": str(banner.get("title") or "Homepage banner"),
            "subtitle": str(banner.get("subtitle") or ""),
            "badge_text": None,
            "image_url": str(banner.get("imageUrl") or ""),
            "mobile_image_url": None,
            "cta_text": "View Details",
            "cta_url": link_url,
            "product_slug": f"managed:{banner_id}",
            "sort_order": index,
        })
    return result


@router.get("", response_model=HomeOut)
def get_home(db: Session = Depends(get_db)) -> dict[str, object]:
    website_payload = get_config_record(db).payload
    banner_carousel = website_payload.get("bannerCarousel") or {"autoplay": True, "intervalSeconds": 5}
    banners = _configured_banners(website_payload)
    if not banners:
        banners = list(
            db.scalars(
                select(Banner)
                .where(Banner.is_active.is_(True))
                .order_by(Banner.sort_order, Banner.id)
            )
        )
    metrics = list(
        db.scalars(
            select(HomeMetric)
            .where(HomeMetric.is_active.is_(True))
            .order_by(HomeMetric.sort_order, HomeMetric.id)
        )
    )
    active_category_ids = select(Category.id).where(Category.is_active == true())
    selected_product_ids = list(
        db.scalars(
            select(Product.id)
            .where(
                Product.is_active == true(),
                Product.is_hot == true(),
                Product.category_id.in_(active_category_ids),
            )
            .order_by(Product.sort_order, Product.id)
            .limit(HOME_PRODUCT_LIMIT)
        )
    )
    remaining_product_count = HOME_PRODUCT_LIMIT - len(selected_product_ids)
    if remaining_product_count > 0:
        filler_statement = (
            select(Product.id)
            .where(
                Product.is_active == true(),
                Product.category_id.in_(active_category_ids),
            )
        )
        if selected_product_ids:
            filler_statement = filler_statement.where(Product.id.not_in(selected_product_ids))
        selected_product_ids.extend(
            db.scalars(
                filler_statement
                .order_by(Product.product_code.asc(), Product.id)
                .limit(remaining_product_count)
            )
        )
    hot_products = compact_product_list_records(db, selected_product_ids)
    solutions = list(
        db.scalars(
            select(Solution)
            .options(load_only(
                Solution.id,
                Solution.title,
                Solution.slug,
                Solution.icon,
                Solution.summary,
                Solution.scenarios,
                Solution.translations,
                Solution.sort_order,
            ))
            .where(Solution.is_active.is_(True))
            .order_by(Solution.sort_order, Solution.id)
        )
    )
    trust_badges = list(
        db.scalars(
            select(ContentBlock)
            .where(ContentBlock.is_active.is_(True), ContentBlock.block_type == "trust_badge")
            .order_by(ContentBlock.sort_order, ContentBlock.id)
        )
    )
    features = list(
        db.scalars(
            select(ContentBlock)
            .where(ContentBlock.is_active.is_(True), ContentBlock.block_type == "feature")
            .order_by(ContentBlock.sort_order, ContentBlock.id)
        )
    )
    quality_steps = list(
        db.scalars(
            select(ContentBlock)
            .where(ContentBlock.is_active.is_(True), ContentBlock.block_type == "quality_step")
            .order_by(ContentBlock.sort_order, ContentBlock.id)
        )
    )

    return {
        "site": read_settings(db),
        "banners": banners,
        "banner_carousel": banner_carousel,
        "trust_badges": trust_badges,
        "metrics": metrics,
        "features": features,
        "hot_products": hot_products,
        "solutions": solutions,
        "quality_steps": quality_steps,
    }
