from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.catalog import AssuranceItem, FulfillmentItem, PriceTier, ProcessItem, ProductDetailBlock, fulfillment_items_from_legacy
from app.schemas.translations import Translations, sanitize_translations, translations_field
from app.services.content_sanitizer import sanitize_rich_html
from app.services.product_tags import normalize_tag_more


class ManagementCategoryIn(BaseModel):
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
    sort_order: int = 0
    is_active: bool = True

    _sanitize_translations = field_validator("translations")(sanitize_translations)

    @model_validator(mode="before")
    @classmethod
    def normalize_fulfillment_items(cls, value):
        if not isinstance(value, dict):
            return value
        normalized = dict(value)
        normalized["fulfillment_items"] = fulfillment_items_from_legacy(
            normalized.get("fulfillment_items"),
            normalized.get("fulfillment_methods"),
        )
        return normalized


class ManagementCategoryOut(ManagementCategoryIn):
    id: int

    model_config = {"from_attributes": True}


class ManagementCategoryListItemOut(BaseModel):
    id: int
    name: str
    slug: str
    parent_id: int | None = None
    color: str | None = None
    sort_order: int
    is_active: bool

    model_config = {"from_attributes": True}


class ManagementCategoryBulkIn(BaseModel):
    items: list[ManagementCategoryIn] = Field(default_factory=list)


class ManagementSeoGeoIn(BaseModel):
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


class ManagementProductIn(ManagementSeoGeoIn):
    product_code: str | None = Field(default=None, max_length=24)
    batch_number: int = Field(default=1, ge=1)
    category_id: int
    name: str
    slug: str
    model: str
    summary: str
    description: str | None = None
    detail_blocks: list[ProductDetailBlock] = Field(default_factory=list)
    main_image: str | None = None
    images: list[str] = Field(default_factory=list)
    highlights: list[str] = Field(default_factory=list)
    specifications: list[dict[str, str]] = Field(default_factory=list)
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
    price_mode: str = "contact_only"
    image_tone: str | None = None
    tag: str | None = None
    tag_more: list[str] = Field(default_factory=list)
    is_hot: bool = False
    is_active: bool = True
    sort_order: int = 0

    _sanitize_description = field_validator("description")(lambda value: sanitize_rich_html(value) if value else value)
    _normalize_tag_more = field_validator("tag_more", mode="before")(normalize_tag_more)
    _sanitize_translations = field_validator("translations")(sanitize_translations)

    @model_validator(mode="before")
    @classmethod
    def normalize_fulfillment_items(cls, value):
        if not isinstance(value, dict):
            return value
        normalized = dict(value)
        normalized["fulfillment_items"] = fulfillment_items_from_legacy(
            normalized.get("fulfillment_items"),
            normalized.get("fulfillment_methods"),
        )
        return normalized


class ManagementProductOut(ManagementProductIn):
    id: int
    product_code: str
    category: ManagementCategoryOut
    content_updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ManagementProductListCategoryOut(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class ManagementProductListItemOut(BaseModel):
    id: int
    product_code: str
    batch_number: int
    category_id: int
    name: str
    slug: str
    model: str
    price_mode: str
    is_hot: bool
    is_active: bool
    sort_order: int
    category: ManagementProductListCategoryOut

    model_config = {"from_attributes": True}


class ManagementProductListOut(BaseModel):
    items: list[ManagementProductListItemOut]
    total: int
    all_total: int
    active_total: int
    page: int
    page_size: int


class ManagementCatalogCountsOut(BaseModel):
    categories: int
    products: int
    active_products: int
    solutions: int
    news: int
    delivery_cases: int


class ManagementProductBulkIn(BaseModel):
    items: list[ManagementProductIn] = Field(default_factory=list)


class ProductDetailUploadOut(BaseModel):
    blocks: list[dict[str, object]] = Field(default_factory=list)


class ManagementSolutionIn(ManagementSeoGeoIn):
    title: str
    slug: str
    icon: str | None = None
    summary: str
    content: str
    document_sections: list[dict[str, object]] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)
    scenarios: list[str] = Field(default_factory=list)
    equipment: list[str] = Field(default_factory=list)
    benefits: list[str] = Field(default_factory=list)
    detailed_description: str | None = None
    pitfalls: list[str] = Field(default_factory=list)
    core_parameters: list[dict[str, str]] = Field(default_factory=list)
    special_contributions: list[str] = Field(default_factory=list)
    related_products: list[str] = Field(default_factory=list)
    translations: Translations = translations_field()
    sort_order: int = 0
    is_active: bool = True

    _sanitize_content = field_validator("content")(sanitize_rich_html)
    _sanitize_detailed_description = field_validator("detailed_description")(lambda value: sanitize_rich_html(value) if value else value)
    _sanitize_translations = field_validator("translations")(sanitize_translations)


class ManagementSolutionOut(ManagementSolutionIn):
    id: int
    content_updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ManagementSolutionListItemOut(BaseModel):
    id: int
    title: str
    slug: str
    scenarios: list[str] = Field(default_factory=list)
    sort_order: int
    is_active: bool

    model_config = {"from_attributes": True}


class ManagementSolutionBulkIn(BaseModel):
    items: list[ManagementSolutionIn] = Field(default_factory=list)


class ManagementNewsArticleIn(ManagementSeoGeoIn):
    title: str
    slug: str
    summary: str
    content: str
    thumbnail_url: str | None = None
    source: str
    translations: Translations = translations_field()
    published_at: date
    sort_order: int = 0
    is_active: bool = True

    _sanitize_content = field_validator("content")(sanitize_rich_html)
    _sanitize_translations = field_validator("translations")(sanitize_translations)


class ManagementNewsArticleOut(ManagementNewsArticleIn):
    id: int
    content_updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ManagementNewsArticleListItemOut(BaseModel):
    id: int
    title: str
    slug: str
    source: str
    published_at: date
    sort_order: int
    is_active: bool

    model_config = {"from_attributes": True}


class ManagementNewsArticleBulkIn(BaseModel):
    items: list[ManagementNewsArticleIn] = Field(default_factory=list)


class ManagementDeliveryCaseIn(ManagementSeoGeoIn):
    title: str
    slug: str
    summary: str
    content: str
    project_overview: str = ""
    indonesia_fit: str = ""
    professional_configuration: str = ""
    key_parameter_table: list[list[str]] = Field(default_factory=list)
    delivery_challenges: list[dict[str, str]] = Field(default_factory=list)
    project_results: str = ""
    client_name: str
    industry: str
    translations: Translations = translations_field()
    delivered_at: date
    sort_order: int = 0
    is_active: bool = True

    _sanitize_content = field_validator("content")(sanitize_rich_html)
    _sanitize_project_overview = field_validator("project_overview")(sanitize_rich_html)
    _sanitize_indonesia_fit = field_validator("indonesia_fit")(sanitize_rich_html)
    _sanitize_professional_configuration = field_validator("professional_configuration")(sanitize_rich_html)
    _sanitize_project_results = field_validator("project_results")(sanitize_rich_html)
    _sanitize_translations = field_validator("translations")(sanitize_translations)


class ManagementDeliveryCaseOut(ManagementDeliveryCaseIn):
    id: int
    content_updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ManagementDeliveryCaseListItemOut(BaseModel):
    id: int
    title: str
    slug: str
    industry: str
    delivered_at: date
    sort_order: int
    is_active: bool

    model_config = {"from_attributes": True}


class ManagementDeliveryCaseBulkIn(BaseModel):
    items: list[ManagementDeliveryCaseIn] = Field(default_factory=list)


class ActiveStateIn(BaseModel):
    is_active: bool
