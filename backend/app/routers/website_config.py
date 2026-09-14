from pathlib import Path
from uuid import uuid4
from copy import deepcopy

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models import AdminUser, Banner, WebsiteConfig
from app.schemas.website_config import ParsedDocxOut, UploadedFileOut, WebsiteConfigPayload, normalize_banner_link
from app.services.docx_parser import parse_docx_bytes
from app.services.cos_storage import get_cos_storage
from app.services.operation_logger import record_operation
from app.services.website_config_defaults import get_default_website_config

CONFIG_KEY = "website_content"
UPLOAD_ROOT = Path("backend/uploads")
IMAGE_UPLOAD_DIR = UPLOAD_ROOT / "images"


def normalize_banner_links(payload: dict[str, object]) -> None:
    banners = payload.get("banners")
    if not isinstance(banners, list):
        return
    normalized_banners: list[object] = []
    for banner in banners:
        if not isinstance(banner, dict):
            normalized_banners.append(banner)
            continue
        normalized = dict(banner)
        normalized["linkUrl"] = normalize_banner_link(str(normalized.get("linkUrl") or ""))
        normalized_banners.append(normalized)
    payload["banners"] = normalized_banners


def normalize_banner_images(payload: dict[str, object], defaults: dict[str, object]) -> None:
    """Never expose editor-local blob URLs as public banner assets."""
    banners = payload.get("banners")
    default_banners = defaults.get("banners")
    if not isinstance(banners, list) or not isinstance(default_banners, list):
        return
    for index, banner in enumerate(banners):
        if not isinstance(banner, dict):
            continue
        image_url = str(banner.get("imageUrl") or "").strip()
        is_local_asset = (
            not image_url
            or image_url.lower().startswith("blob:")
            or "localhost" in image_url.lower()
            or image_url.startswith("http://127.")
            or image_url.startswith("http://192.168.")
            or image_url.startswith("http://10.")
        )
        if not is_local_asset:
            continue
        fallback = default_banners[index] if index < len(default_banners) else None
        if isinstance(fallback, dict):
            banner["imageUrl"] = fallback.get("imageUrl", "")

public_router = APIRouter(prefix="/website-config", tags=["website-config"])
management_router = APIRouter(prefix="/management/website-config", tags=["management-website-config"])

LEGACY_PLATFORM_SELLING_POINT_COPY: dict[str, set[tuple[str, str]]] = {
    "platform-certified": {
        ("ISO & CE assurance", "International quality systems and export-ready product compliance."),
        ("ISO & CE 认证保障", "国际质量体系认证，出口产品资料与合规文件齐全。"),
    },
    "platform-service": {
        ("7x24 dedicated service", "Power sourcing consultants respond to procurement requirements quickly."),
        ("7x24 专属客服", "电力选型顾问快速响应采购需求，协助完成方案确认。"),
    },
    "platform-delivery": {
        ("Global delivery network", "One-stop logistics and customs support for 50+ countries and regions."),
        ("Global delivery network", "Logistics, customs and delivery support across 50+ countries and regions."),
        ("全球交付网络", "覆盖 50+ 国家和地区，提供物流、报关与交付支持。"),
    },
}

PAGE_HERO_IMAGE_URLS: dict[str, str] = {
    "product": "/page-assets/products-banner.jpg",
    "solution": "/page-assets/solutions-banner.jpg",
    "about": "/page-assets/about-banner.jpg",
    "contact": "/page-assets/contact-banner.jpg",
}


def should_update_page_hero_image(current: object) -> bool:
    image_url = str(current or "")
    return (
        not image_url
        or "images.unsplash.com" in image_url
        or image_url.startswith("/banner-assets/")
    )


def normalize_platform_selling_points(payload: dict, defaults: dict) -> None:
    default_points = defaults["platformSellingPoints"]
    if not isinstance(payload.get("platformSellingPoints"), list) or not payload["platformSellingPoints"]:
        payload["platformSellingPoints"] = default_points
        return

    defaults_by_id = {str(point.get("id")): point for point in default_points}
    migrated_ids: set[str] = set()
    for point in payload["platformSellingPoints"]:
        if not isinstance(point, dict):
            continue
        point_id = str(point.get("id") or "")
        legacy_values = LEGACY_PLATFORM_SELLING_POINT_COPY.get(point_id, set())
        fallback = defaults_by_id.get(point_id)
        if not fallback:
            continue
        if (str(point.get("title") or ""), str(point.get("content") or "")) in legacy_values:
            enabled = bool(point.get("enabled", True))
            point.clear()
            point.update(deepcopy(fallback))
            point["enabled"] = enabled
            migrated_ids.add(point_id)
        title = str(point.get("title") or point.get("titleTranslations", {}).get("zh-CN") or fallback.get("title") or "")
        content = str(point.get("content") or point.get("contentTranslations", {}).get("zh-CN") or fallback.get("content") or "")
        point["title"] = title
        point["content"] = content
        title_translations = point.get("titleTranslations") if isinstance(point.get("titleTranslations"), dict) else {}
        content_translations = point.get("contentTranslations") if isinstance(point.get("contentTranslations"), dict) else {}
        point["titleTranslations"] = {**fallback.get("titleTranslations", {}), **title_translations, "zh-CN": title}
        point["contentTranslations"] = {**fallback.get("contentTranslations", {}), **content_translations, "zh-CN": content}

    for fallback in default_points:
        if not any(isinstance(point, dict) and point.get("id") == fallback["id"] for point in payload["platformSellingPoints"]):
            payload["platformSellingPoints"].append(fallback)

    if migrated_ids == set(defaults_by_id):
        points_by_id = {
            str(point.get("id")): point
            for point in payload["platformSellingPoints"]
            if isinstance(point, dict) and point.get("id") in defaults_by_id
        }
        custom_points = [
            point for point in payload["platformSellingPoints"]
            if not isinstance(point, dict) or point.get("id") not in defaults_by_id
        ]
        payload["platformSellingPoints"] = [
            points_by_id[str(fallback["id"])] for fallback in default_points
        ] + custom_points


def normalize_list_with_defaults(payload: dict, defaults: dict, key: str, match_key: str = "id") -> None:
    default_items = defaults.get(key, [])
    if not isinstance(default_items, list):
        return

    if not isinstance(payload.get(key), list):
        payload[key] = deepcopy(default_items)
        return

    for fallback in default_items:
        if not isinstance(fallback, dict):
            continue
        fallback_id = fallback.get(match_key)
        if not any(isinstance(item, dict) and item.get(match_key) == fallback_id for item in payload[key]):
            payload[key].append(deepcopy(fallback))


def normalize_page_metadata(payload: dict, defaults: dict) -> None:
    if not isinstance(payload.get("pages"), list):
        payload["pages"] = deepcopy(defaults.get("pages", []))
        return

    defaults_by_key = {
        page.get("key"): page
        for page in defaults.get("pages", [])
        if isinstance(page, dict)
    }
    pages_by_key = {
        page.get("key"): page
        for page in payload["pages"]
        if isinstance(page, dict)
    }

    for page_key, fallback in defaults_by_key.items():
        page = pages_by_key.get(page_key)
        if page is None:
            payload["pages"].append(deepcopy(fallback))
            continue

        if page_key == "product":
            for field in ("label", "pagePath", "headline", "summary"):
                page[field] = fallback[field]
        expected_hero_image = PAGE_HERO_IMAGE_URLS.get(str(page_key))
        if expected_hero_image and should_update_page_hero_image(page.get("heroImageUrl")):
            page["heroImageUrl"] = expected_hero_image


def merge_missing_localized_values(current: object, fallback: object) -> dict:
    current_values = current if isinstance(current, dict) else {}
    fallback_values = fallback if isinstance(fallback, dict) else {}
    merged = deepcopy(current_values)

    for locale, fallback_value in fallback_values.items():
        current_value = merged.get(locale)
        if isinstance(fallback_value, dict):
            merged[locale] = merge_missing_localized_values(current_value, fallback_value)
        elif not isinstance(current_value, str) or not current_value.strip():
            merged[locale] = deepcopy(fallback_value)

    return merged


def normalize_faq(payload: dict, defaults: dict) -> None:
    fallback_faq = defaults.get("faq")
    if not isinstance(fallback_faq, dict):
        return

    current_faq = payload.get("faq")
    if not isinstance(current_faq, dict):
        payload["faq"] = deepcopy(fallback_faq)
        return

    current_faq.pop("heroImageUrl", None)
    for key, fallback_value in fallback_faq.items():
        if key in {"translations", "categories"}:
            continue
        current_value = current_faq.get(key)
        if current_value is None or (isinstance(current_value, str) and not current_value.strip()):
            current_faq[key] = deepcopy(fallback_value)

    current_faq["translations"] = merge_missing_localized_values(
        current_faq.get("translations"), fallback_faq.get("translations")
    )

    fallback_categories = fallback_faq.get("categories")
    if not isinstance(fallback_categories, list):
        return
    if not isinstance(current_faq.get("categories"), list):
        current_faq["categories"] = deepcopy(fallback_categories)
        return

    categories_by_id = {
        str(category.get("id")): category
        for category in current_faq["categories"]
        if isinstance(category, dict) and category.get("id")
    }
    for fallback_category in fallback_categories:
        if not isinstance(fallback_category, dict):
            continue
        category_id = str(fallback_category.get("id") or "")
        category = categories_by_id.get(category_id)
        if category is None:
            current_faq["categories"].append(deepcopy(fallback_category))
            continue

        category["titleTranslations"] = merge_missing_localized_values(
            category.get("titleTranslations"), fallback_category.get("titleTranslations")
        )
        fallback_items = fallback_category.get("items")
        if not isinstance(fallback_items, list):
            continue
        if not isinstance(category.get("items"), list):
            category["items"] = deepcopy(fallback_items)
            continue

        items_by_id = {
            str(item.get("id")): item
            for item in category["items"]
            if isinstance(item, dict) and item.get("id")
        }
        for fallback_item in fallback_items:
            if not isinstance(fallback_item, dict):
                continue
            item_id = str(fallback_item.get("id") or "")
            item = items_by_id.get(item_id)
            if item is None:
                category["items"].append(deepcopy(fallback_item))
                continue
            item["questionTranslations"] = merge_missing_localized_values(
                item.get("questionTranslations"), fallback_item.get("questionTranslations")
            )
            item["answerTranslations"] = merge_missing_localized_values(
                item.get("answerTranslations"), fallback_item.get("answerTranslations")
            )


def get_config_record(db: Session) -> WebsiteConfig:
    record = db.scalar(select(WebsiteConfig).where(WebsiteConfig.key == CONFIG_KEY))
    if record is None:
        record = WebsiteConfig(key=CONFIG_KEY, payload=get_default_website_config())
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    defaults = get_default_website_config()
    payload = {**defaults, **(record.payload or {})}
    if not isinstance(payload.get("banners"), list) or len(payload["banners"]) < 3:
        payload["banners"] = defaults["banners"]
    normalize_banner_images(payload, defaults)
    if not isinstance(payload.get("bannerCarousel"), dict):
        payload["bannerCarousel"] = defaults["bannerCarousel"]
    normalize_banner_links(payload)
    if not isinstance(payload.get("searchSettings"), dict):
        payload["searchSettings"] = defaults["searchSettings"]
    else:
        payload["searchSettings"] = {**defaults["searchSettings"], **payload["searchSettings"]}
    normalize_list_with_defaults(payload, defaults, "homeText", "key")
    if not isinstance(payload.get("featureCards"), list):
        payload["featureCards"] = defaults["featureCards"]
    normalize_platform_selling_points(payload, defaults)
    if not isinstance(payload.get("homeWhyChoose"), dict):
        payload["homeWhyChoose"] = defaults["homeWhyChoose"]
    else:
        payload["homeWhyChoose"] = {**defaults["homeWhyChoose"], **payload["homeWhyChoose"]}
        if not isinstance(payload["homeWhyChoose"].get("reasons"), list):
            payload["homeWhyChoose"]["reasons"] = defaults["homeWhyChoose"]["reasons"]
    normalize_list_with_defaults(payload, defaults, "homeProcurementModes")
    normalize_list_with_defaults(payload, defaults, "homeScenarios")
    normalize_list_with_defaults(payload, defaults, "homeSuppliers")
    normalize_list_with_defaults(payload, defaults, "homeCategoryFallback", "slug")
    normalize_list_with_defaults(payload, defaults, "homeProductFallback", "slug")
    normalize_faq(payload, defaults)
    normalize_page_metadata(payload, defaults)
    if payload != record.payload:
        record.payload = payload
        db.add(record)
        db.commit()
        db.refresh(record)
    return record


def sync_home_banners(db: Session, banners: list[dict[str, object]]) -> None:
    for row in db.scalars(select(Banner)).all():
        row.is_active = False
        db.add(row)

    for index, banner in enumerate(banners, start=1):
        banner_id = str(banner.get("id") or f"banner-{index}")
        row = db.scalar(select(Banner).where(Banner.product_slug == f"managed:{banner_id}"))
        if row is None:
            row = Banner(
                title=str(banner.get("title") or "Homepage banner"),
                subtitle=str(banner.get("subtitle") or ""),
                badge_text=None,
                image_url=str(banner.get("imageUrl") or ""),
                mobile_image_url=None,
                cta_text="View Details",
                cta_url=str(banner.get("linkUrl") or "/products"),
                product_slug=f"managed:{banner_id}",
                sort_order=index,
                is_active=bool(banner.get("enabled", True)) and str(banner.get("slot") or "desktop") == "desktop",
            )
            db.add(row)
        row.title = str(banner.get("title") or "Homepage banner")
        row.subtitle = str(banner.get("subtitle") or "")
        row.image_url = str(banner.get("imageUrl") or "")
        row.cta_url = str(banner.get("linkUrl") or "/products")
        row.cta_text = "View Details"
        row.product_slug = f"managed:{banner_id}"
        row.sort_order = index
        row.is_active = bool(banner.get("enabled", True)) and str(banner.get("slot") or "desktop") == "desktop"



@public_router.get("", response_model=WebsiteConfigPayload)
def get_public_website_config(db: Session = Depends(get_db)) -> dict:
    return get_config_record(db).payload


@management_router.get("", response_model=WebsiteConfigPayload)
def get_management_website_config(
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict:
    return get_config_record(db).payload


@management_router.put("", response_model=WebsiteConfigPayload)
def save_management_website_config(
    payload: WebsiteConfigPayload,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict:
    record = get_config_record(db)
    before = deepcopy(record.payload)
    after = payload.model_dump()
    normalize_banner_images(after, get_default_website_config())
    normalize_banner_links(after)
    record.payload = after
    db.add(record)
    sync_home_banners(db, after["banners"])
    record_operation(db, current_user, "网站内容", "保存网站内容", before, after)
    db.commit()
    db.refresh(record)
    return record.payload


@management_router.post("/uploads/images", response_model=UploadedFileOut)
async def upload_image(
    file: UploadFile = File(...),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> UploadedFileOut:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image uploads are supported")

    content = await file.read()
    if len(content) > 8 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image size must be under 8MB")

    extension = Path(file.filename or "image").suffix.lower() or ".jpg"
    target_name = f"{uuid4().hex}{extension}"
    target_path = IMAGE_UPLOAD_DIR / target_name
    uploaded_url = get_cos_storage().save_public_bytes(
        key=f"uploads/images/{target_name}",
        content=content,
        content_type=file.content_type,
        fallback_path=target_path,
    )

    uploaded = UploadedFileOut(
        url=uploaded_url,
        fileName=file.filename or target_name,
        contentType=file.content_type,
        size=len(content),
    )
    record_operation(db, current_user, "网站内容", "上传网站图片", None, uploaded)
    db.commit()
    return uploaded


@management_router.post("/uploads/docx/parse", response_model=ParsedDocxOut)
async def parse_docx_upload(
    file: UploadFile = File(...),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    filename = file.filename or "document.docx"
    if not filename.lower().endswith(".docx"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only .docx files can be parsed")

    content = await file.read()
    if len(content) > 12 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document size must be under 12MB")

    try:
        parsed = parse_docx_bytes(content, filename)
        record_operation(
            db,
            current_user,
            "网站内容",
            "解析 Word 文档",
            None,
            {"fileName": filename, "size": len(content), "blockCount": len(parsed.get("blocks", []))},
        )
        db.commit()
        return parsed
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to parse docx file") from exc
