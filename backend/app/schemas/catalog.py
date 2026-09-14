from datetime import date, datetime
import re
from typing import Any, Literal

from pydantic import BaseModel, Field, computed_field, field_validator, model_validator

from app.schemas.translations import Translations, translations_field
from app.services.product_public_slug import product_public_slug


class SeoGeoFields(BaseModel):
    seo_title: str | None = Field(default=None, max_length=180)
    seo_description: str | None = Field(default=None, max_length=320)
    answer_summary: str | None = None
    author_name: str | None = Field(default=None, max_length=120)
    technical_reviewer: str | None = Field(default=None, max_length=120)
    evidence_urls: list[str] = Field(default_factory=list)
    standards: list[str] = Field(default_factory=list)
    applicable_markets: list[str] = Field(default_factory=list)
    unsuitable_conditions: list[str] = Field(default_factory=list)
    is_indexable: bool = True
    content_updated_at: datetime | None = None


class AssuranceItem(BaseModel):
    duration: str = Field(default="", max_length=40)
    title: str = Field(min_length=1, max_length=80)
    copy: str = Field(default="", max_length=240)

    @model_validator(mode="before")
    @classmethod
    def normalize_legacy_title(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        normalized = dict(value)
        title = str(normalized.get("title") or "").strip()
        duration = str(normalized.get("duration") or "").strip()
        if not duration:
            match = re.search(r"\d+\s*年", title)
            if match:
                duration = re.sub(r"\s+", "", match.group(0))
                title = f"{title[:match.start()]}{title[match.end():]}".strip()
        normalized["duration"] = duration
        normalized["title"] = title
        normalized["copy"] = str(normalized.get("copy") or "").strip()
        return normalized


class PriceTier(BaseModel):
    label: str = Field(default="", max_length=80)
    range: str = Field(min_length=1, max_length=120)
    price: str = Field(min_length=1, max_length=120)
    visible: bool = True


class FulfillmentItem(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    copy: str = Field(default="", max_length=300)


class ProcessItem(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    copy: str = Field(default="", max_length=300)


class ProductDetailBlock(BaseModel):
    type: Literal["rich-text", "heading", "text", "image", "table", "pdf"]
    content: str | None = None
    url: str | None = None
    name: str | None = None
    alt: str | None = None
    rows: list[list[str]] | None = None

    @field_validator("content")
    @classmethod
    def sanitize_content(cls, value: str | None) -> str | None:
        from app.services.content_sanitizer import sanitize_rich_html

        return sanitize_rich_html(value) if value else value


def fulfillment_items_from_legacy(value: Any, legacy_methods: list[str] | None = None) -> list[dict[str, str]]:
    if isinstance(value, list) and value:
        return [
            {"name": item, "copy": ""} if isinstance(item, str) else item
            for item in value
        ]
    return [{"name": item, "copy": ""} for item in legacy_methods or [] if item.strip()]


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    parent_id: int | None = None
    color: str | None = None
    fulfillment_methods: list[str] = Field(default_factory=list)
    fulfillment_items: list[FulfillmentItem] = Field(default_factory=list)
    fulfillment_title: str | None = None
    fulfillment_copy: str | None = None
    assurance_items: list[AssuranceItem] = Field(default_factory=list, max_length=4)
    translations: Translations = translations_field()
    sort_order: int

    model_config = {"from_attributes": True}


class CategoryTreeOut(CategoryOut):
    children: list["CategoryTreeOut"] = Field(default_factory=list)

    @field_validator("translations", mode="before")
    @classmethod
    def compact_tree_translations(cls, value: Any) -> Translations:
        if not isinstance(value, dict):
            return {}
        return {
            locale: {"name": payload["name"]}
            for locale, payload in value.items()
            if isinstance(payload, dict) and isinstance(payload.get("name"), str)
        }


class ProductCategoryOut(BaseModel):
    name: str
    slug: str
    color: str | None = None
    fulfillment_methods: list[str] = Field(default_factory=list)
    fulfillment_items: list[FulfillmentItem] = Field(default_factory=list)
    fulfillment_title: str | None = None
    fulfillment_copy: str | None = None
    assurance_items: list[AssuranceItem] = Field(default_factory=list, max_length=4)
    translations: Translations = translations_field()

    model_config = {"from_attributes": True}


def compact_translations(value: Any, allowed_fields: set[str]) -> Translations:
    if not isinstance(value, dict):
        return {}
    return {
        locale: {
            key: field_value
            for key, field_value in payload.items()
            if key in allowed_fields
        }
        for locale, payload in value.items()
        if isinstance(payload, dict)
    }


class ProductListCategoryOut(BaseModel):
    name: str
    slug: str
    color: str | None = None
    translations: Translations = translations_field()

    @field_validator("translations", mode="before")
    @classmethod
    def compact_list_translations(cls, value: Any) -> Translations:
        return compact_translations(value, {"name"})

    model_config = {"from_attributes": True}


class ProductListItemOut(BaseModel):
    id: int
    product_code: str
    slug: str
    name: str
    model: str
    summary: str
    main_image: str | None = None
    image_tone: str | None = None
    tag: str | None = None
    tag_more: list[str] = Field(default_factory=list)
    is_hot: bool
    sort_order: int
    is_indexable: bool
    content_updated_at: datetime | None = None
    category: ProductListCategoryOut
    translations: Translations = translations_field()

    @computed_field
    @property
    def public_slug(self) -> str:
        return product_public_slug(self)

    @field_validator("translations", mode="before")
    @classmethod
    def compact_list_translations(cls, value: Any) -> Translations:
        return compact_translations(value, {"name", "model", "summary", "tag"})

    model_config = {"from_attributes": True}


class ProductOut(SeoGeoFields):
    id: int
    product_code: str
    slug: str
    name: str
    model: str
    summary: str
    description: str | None = None
    detail_blocks: list[ProductDetailBlock] = Field(default_factory=list)
    main_image: str | None = None
    images: list[str]
    highlights: list[str]
    specifications: list[dict[str, str]]
    variants: list[dict[str, object]] = Field(default_factory=list)
    price_tiers: list[PriceTier] = Field(default_factory=list, max_length=3)
    show_surprise_only: bool = True
    fulfillment_methods: list[str] = Field(default_factory=list)
    fulfillment_items: list[FulfillmentItem] = Field(default_factory=list)
    fulfillment_title: str | None = None
    fulfillment_copy: str | None = None
    assurance_items: list[AssuranceItem] = Field(default_factory=list, max_length=4)
    process_items: list[ProcessItem] = Field(default_factory=list, max_length=4)
    translations: Translations = translations_field()
    moq: str | None = None
    price_mode: str
    image_tone: str | None = None
    tag: str | None = None
    tag_more: list[str] = Field(default_factory=list)
    is_hot: bool
    sort_order: int
    category: ProductCategoryOut

    @computed_field
    @property
    def public_slug(self) -> str:
        return product_public_slug(self)

    model_config = {"from_attributes": True}


class ProductListOut(BaseModel):
    items: list[ProductListItemOut]
    total: int
    page: int
    page_size: int


class ProductSitemapItemOut(BaseModel):
    id: int
    slug: str
    public_slug: str
    is_indexable: bool
    content_updated_at: datetime | None = None
    translations: Translations = translations_field()


class NewsArticleOut(SeoGeoFields):
    id: int
    title: str
    slug: str
    summary: str
    content: str
    thumbnail_url: str | None = None
    source: str
    translations: Translations = translations_field()
    published_at: date
    sort_order: int

    model_config = {"from_attributes": True}


class NewsArticleListItemOut(BaseModel):
    id: int
    title: str
    slug: str
    summary: str
    thumbnail_url: str | None = None
    source: str
    translations: Translations = translations_field()
    published_at: date
    sort_order: int
    is_indexable: bool
    content_updated_at: datetime | None = None

    @field_validator("translations", mode="before")
    @classmethod
    def compact_list_translations(cls, value: Any) -> Translations:
        return compact_translations(value, {"title", "summary", "source"})

    model_config = {"from_attributes": True}


class NewsArticleListOut(BaseModel):
    items: list[NewsArticleListItemOut]
    total: int
    page: int
    page_size: int


class DeliveryCaseOut(SeoGeoFields):
    id: int
    title: str
    slug: str
    summary: str
    content: str
    project_overview: str
    indonesia_fit: str
    professional_configuration: str
    key_parameter_table: list[list[str]] = Field(default_factory=list)
    delivery_challenges: list[dict[str, str]] = Field(default_factory=list)
    project_results: str
    thumbnail_url: str | None = None
    client_name: str
    industry: str
    location: str
    translations: Translations = translations_field()
    delivered_at: date
    sort_order: int

    model_config = {"from_attributes": True}


class DeliveryCaseListItemOut(BaseModel):
    id: int
    title: str
    slug: str
    summary: str
    thumbnail_url: str | None = None
    client_name: str
    industry: str
    location: str
    translations: Translations = translations_field()
    delivered_at: date
    sort_order: int
    is_indexable: bool
    content_updated_at: datetime | None = None

    @field_validator("translations", mode="before")
    @classmethod
    def compact_list_translations(cls, value: Any) -> Translations:
        return compact_translations(value, {"title", "summary", "client_name", "industry"})

    model_config = {"from_attributes": True}


class DeliveryCaseListOut(BaseModel):
    items: list[DeliveryCaseListItemOut]
    total: int
    page: int
    page_size: int


class SolutionOut(SeoGeoFields):
    id: int
    title: str
    slug: str
    icon: str | None = None
    summary: str
    content: str
    document_sections: list[dict[str, object]] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)
    scenarios: list[str]
    equipment: list[str]
    benefits: list[str]
    detailed_description: str | None = None
    pitfalls: list[str] = Field(default_factory=list)
    core_parameters: list[dict[str, str]] = Field(default_factory=list)
    special_contributions: list[str] = Field(default_factory=list)
    related_products: list[str]
    translations: Translations = translations_field()
    sort_order: int

    model_config = {"from_attributes": True}


class SolutionListItemOut(BaseModel):
    id: int
    title: str
    slug: str
    icon: str | None = None
    summary: str
    scenarios: list[str] = Field(default_factory=list)
    translations: Translations = translations_field()
    sort_order: int
    is_indexable: bool
    content_updated_at: datetime | None = None

    @field_validator("translations", mode="before")
    @classmethod
    def compact_list_translations(cls, value: Any) -> Translations:
        return compact_translations(value, {"title", "summary", "scenarios"})

    model_config = {"from_attributes": True}


class BannerOut(BaseModel):
    id: int
    title: str
    subtitle: str | None = None
    badge_text: str | None = None
    image_url: str
    mobile_image_url: str | None = None
    cta_text: str | None = None
    cta_url: str | None = None
    product_slug: str | None = None
    sort_order: int

    model_config = {"from_attributes": True}


class BannerCarouselOut(BaseModel):
    autoplay: bool = True
    intervalSeconds: int = 5


class HomeMetricOut(BaseModel):
    id: int
    value: str
    label: str
    description: str | None = None
    sort_order: int

    model_config = {"from_attributes": True}


class ContentBlockOut(BaseModel):
    id: int
    block_type: str
    title: str
    subtitle: str | None = None
    content: str | None = None
    icon: str | None = None
    image_url: str | None = None
    extra: dict
    sort_order: int

    model_config = {"from_attributes": True}


class HomeOut(BaseModel):
    site: dict[str, object]
    banners: list[BannerOut]
    banner_carousel: BannerCarouselOut
    trust_badges: list[ContentBlockOut]
    metrics: list[HomeMetricOut]
    features: list[ContentBlockOut]
    hot_products: list[ProductListItemOut]
    solutions: list[SolutionListItemOut]
    quality_steps: list[ContentBlockOut]
