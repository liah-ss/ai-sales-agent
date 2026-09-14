import json
import re

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models import AdminUser, SiteSetting
from app.schemas.site_settings import SiteSettingsPayload
from app.services.operation_logger import record_operation

router = APIRouter(prefix="/site-settings", tags=["site-settings"])
management_router = APIRouter(prefix="/management/site-settings", tags=["management-site-settings"])

DEFAULT_SETTINGS: dict[str, object] = {
    "brand_name": "ExampleCorp",
    "tagline": "Power equipment global sourcing platform",
    "seo_title": "ExampleCorp | Power Equipment Global Sourcing Platform",
    "seo_description": "ExampleCorp helps global buyers source certified power equipment through scenario procurement, engineering selection and managed delivery.",
    "whatsapp_number": "+00 000-0000-0000",
    "facebook_url": "https://www.facebook.com/examplecorp",
    "linkedin_url": "https://www.linkedin.com/in/俊-李-667388422?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    "sales_email": "consultant@example.com",
    "phone": "0000-0000-0000",
    "topbar_slogan_text": "⚡ 全球工业设备直采 · 场景化采购 · 一站式交付",
    "topbar_phone_text": "📞 0000-0000-0000",
    "topbar_whatsapp_text": "WhatsApp",
    "topbar_login_text": "登录",
    "topbar_register_text": "注册",
    "company_address": "上海虹桥阿里中心",
    "supported_languages": ["en", "id", "zh-CN"],
    "footer_description": "Engineer-led power equipment sourcing platform with selection, quotation, quality control, delivery and after-sales support.",
    "home_hero_title": "Tell us your power application scenario",
    "home_hero_subtitle": "Our sourcing team matches the right equipment portfolio from demand intake to delivery.",
    "home_hero_badge": "Scenario procurement platform",
    "home_primary_cta_text": "Contact Sales",
    "home_primary_cta_url": "/contact",
    "home_secondary_cta_text": "Explore Products",
    "home_secondary_cta_url": "/products",
    "home_contact_title": "Get In Touch",
    "home_contact_subtitle": "Start your sourcing request with ExampleCorp today.",
    "home_metrics": [
        {"value": "20+", "label": "Years Experience", "description": "Power and electrical supply experience"},
        {"value": "1,000+", "label": "Projects Delivered", "description": "Commercial and infrastructure projects"},
        {"value": "50+", "label": "Export Countries", "description": "Global delivery and service network"},
        {"value": "500+", "label": "Skilled Employees", "description": "Engineering, production and support team"},
    ],
    "translations": {
        "en": {
            "company_address": "Alibaba Center, Hongqiao, Shanghai, China",
            "topbar_phone_text": "📞 0000-0000-0000",
        },
        "id": {
            "company_address": "Alibaba Center Hongqiao, Shanghai, China",
            "topbar_phone_text": "📞 0000-0000-0000",
        },
    },
}


@router.get("")
def get_site_settings(db: Session = Depends(get_db)) -> dict[str, object]:
    return read_settings(db)


@management_router.get("", response_model=SiteSettingsPayload)
def get_management_site_settings(
    _current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    return read_settings(db)


@management_router.put("", response_model=SiteSettingsPayload)
def save_management_site_settings(
    payload: SiteSettingsPayload,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    before = read_settings(db)
    after = payload.model_dump()
    for key, value in after.items():
        row = db.scalar(select(SiteSetting).where(SiteSetting.key == key))
        serialized = serialize_value(value)
        if row is None:
            db.add(SiteSetting(key=key, value=serialized))
        else:
            row.value = serialized
            db.add(row)
    record_operation(db, current_user, "站点设置", "保存站点设置", before, after)
    db.commit()
    return read_settings(db)


def read_settings(db: Session) -> dict[str, object]:
    rows = db.scalars(select(SiteSetting)).all()
    settings: dict[str, object] = {row.key: parse_value(row.value) for row in rows}
    for key, value in DEFAULT_SETTINGS.items():
        settings.setdefault(key, value)
    sync_phone_display_text(settings)
    return settings


def sync_phone_display_text(settings: dict[str, object]) -> None:
    """Keep legacy topbar phone text aligned with the canonical phone field.

    The management UI exposes ``phone`` and ``topbar_phone_text`` separately.
    When an older topbar value still contains a phone number, replace that
    number at read time so a phone edit is reflected everywhere immediately.
    Custom topbar copy without a phone number remains untouched.
    """
    phone = str(settings.get("phone") or "").strip()
    if not phone:
        return

    def replace(value: object) -> object:
        if not isinstance(value, str):
            return value
        return re.sub(r"(?<!\d)\+?\d[\d\s().-]{5,}\d(?!\d)", phone, value, count=1)

    settings["topbar_phone_text"] = replace(settings.get("topbar_phone_text"))
    translations = settings.get("translations")
    if isinstance(translations, dict):
        for locale, localized in translations.items():
            if isinstance(localized, dict) and "topbar_phone_text" in localized:
                localized["topbar_phone_text"] = replace(localized["topbar_phone_text"])


def parse_value(value: str) -> object:
    # Site settings are mostly text. Only structured values are JSON-encoded;
    # numeric-looking text such as a phone number must remain a string.
    if not value.lstrip().startswith(("{", "[")):
        return value
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


def serialize_value(value: object) -> str:
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)
