from pydantic import BaseModel, Field, field_validator

PUBLIC_SITE_ORIGIN = "https://example.com"


def normalize_banner_link(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        return f"{PUBLIC_SITE_ORIGIN}/products"
    if normalized.lower().startswith("https://"):
        return normalized
    if normalized.lower().startswith("http://"):
        raise ValueError("Banner link must use HTTPS")
    if normalized.startswith("/"):
        return f"{PUBLIC_SITE_ORIGIN}{normalized}"
    if normalized.startswith("#"):
        return f"{PUBLIC_SITE_ORIGIN}/{normalized}"
    raise ValueError("Banner link must be a complete HTTPS URL")


class HomeSectionConfig(BaseModel):
    id: str
    name: str
    anchor: str
    description: str
    enabled: bool = True


class BannerConfigIn(BaseModel):
    id: str
    title: str
    subtitle: str = ""
    titleTranslations: dict[str, str] = Field(default_factory=dict)
    subtitleTranslations: dict[str, str] = Field(default_factory=dict)
    imageUrl: str = ""
    linkUrl: str = ""
    slot: str = "desktop"
    enabled: bool = True

    @field_validator("linkUrl")
    @classmethod
    def validate_link_url(cls, value: str) -> str:
        return normalize_banner_link(value)


class BannerCarouselConfig(BaseModel):
    autoplay: bool = True
    intervalSeconds: int = Field(default=5, ge=1, le=120)


class SearchSettingsConfig(BaseModel):
    placeholder: str = "输入应用场景、设备需求或技术参数，如：工业园区配电改造..."
    placeholderTranslations: dict[str, str] = Field(default_factory=dict)


class HomeTextConfig(BaseModel):
    key: str
    label: str
    value: str = ""
    translations: dict[str, str] = Field(default_factory=dict)


class FeatureCardConfig(BaseModel):
    id: str
    icon: str = "building"
    title: str
    content: str = ""
    enabled: bool = True


class PlatformSellingPointConfig(BaseModel):
    id: str
    icon: str = "shield"
    title: str
    content: str = ""
    titleTranslations: dict[str, str] = Field(default_factory=dict)
    contentTranslations: dict[str, str] = Field(default_factory=dict)
    enabled: bool = True


class HomeWhyChooseReasonConfig(BaseModel):
    id: str
    number: str
    title: str
    subtitle: str = ""
    quote: str = ""
    bullets: list[str] = Field(default_factory=list)
    titleTranslations: dict[str, str] = Field(default_factory=dict)
    subtitleTranslations: dict[str, str] = Field(default_factory=dict)
    quoteTranslations: dict[str, str] = Field(default_factory=dict)
    bulletTranslations: dict[str, list[str]] = Field(default_factory=dict)
    enabled: bool = True


class HomeWhyChooseConfig(BaseModel):
    title: str = "为什么选择 ExampleCorp"
    ctaText: str = "了解平台详情"
    titleTranslations: dict[str, str] = Field(default_factory=dict)
    ctaTextTranslations: dict[str, str] = Field(default_factory=dict)
    reasons: list[HomeWhyChooseReasonConfig] = Field(default_factory=list)


class HomeProcurementModeConfig(BaseModel):
    id: str
    badge: str
    title: str
    copy: str = ""
    steps: list[str] = Field(default_factory=list)
    action: str
    to: str = "/products"
    badgeTranslations: dict[str, str] = Field(default_factory=dict)
    titleTranslations: dict[str, str] = Field(default_factory=dict)
    copyTranslations: dict[str, str] = Field(default_factory=dict)
    stepTranslations: dict[str, list[str]] = Field(default_factory=dict)
    actionTranslations: dict[str, str] = Field(default_factory=dict)
    enabled: bool = True


class HomeScenarioConfig(BaseModel):
    id: str
    icon: str
    title: str
    copy: str = ""
    demand: str = ""
    titleTranslations: dict[str, str] = Field(default_factory=dict)
    copyTranslations: dict[str, str] = Field(default_factory=dict)
    demandTranslations: dict[str, str] = Field(default_factory=dict)
    enabled: bool = True


class HomeSupplierConfig(BaseModel):
    id: str
    icon: str
    name: str
    badge: str = ""
    scope: str = ""
    nameTranslations: dict[str, str] = Field(default_factory=dict)
    badgeTranslations: dict[str, str] = Field(default_factory=dict)
    scopeTranslations: dict[str, str] = Field(default_factory=dict)
    enabled: bool = True


class HomeCategoryFallbackConfig(BaseModel):
    slug: str
    name: str
    icon: str
    sku: str
    tags: list[str] = Field(default_factory=list)
    nameTranslations: dict[str, str] = Field(default_factory=dict)
    tagTranslations: dict[str, list[str]] = Field(default_factory=dict)
    enabled: bool = True


class HomeProductFallbackConfig(BaseModel):
    slug: str
    name: str
    tag: str = ""
    categorySlug: str
    icon: str
    nameTranslations: dict[str, str] = Field(default_factory=dict)
    tagTranslations: dict[str, str] = Field(default_factory=dict)
    enabled: bool = True


class ImportRecordConfig(BaseModel):
    id: str
    fileName: str
    fileType: str
    fileSize: str
    status: str = "queued"


class ContentBlockConfig(BaseModel):
    id: str
    type: str
    title: str
    body: str = ""
    titleTranslations: dict[str, str] = Field(default_factory=dict)
    bodyTranslations: dict[str, str] = Field(default_factory=dict)


class FaqItemConfig(BaseModel):
    id: str
    question: str
    answer: str
    questionTranslations: dict[str, str] = Field(default_factory=dict)
    answerTranslations: dict[str, str] = Field(default_factory=dict)
    popular: bool = False
    enabled: bool = True


class FaqCategoryConfig(BaseModel):
    id: str
    icon: str = "list"
    title: str
    titleTranslations: dict[str, str] = Field(default_factory=dict)
    items: list[FaqItemConfig] = Field(default_factory=list)
    enabled: bool = True


class FaqPageConfig(BaseModel):
    eyebrow: str
    title: str
    accent: str = ""
    summary: str
    searchPlaceholder: str
    searchHint: str = ""
    allLabel: str = "全部"
    popularLabel: str = "热门"
    questionUnit: str = "个问题"
    emptyTitle: str
    emptyMessage: str
    emptyAction: str
    quickJumpLabel: str = "快速跳转"
    ctaTitle: str
    ctaBody: str
    primaryAction: str
    secondaryAction: str
    primaryPath: str = "/contact"
    secondaryPath: str = "/products"
    translations: dict[str, dict[str, str]] = Field(default_factory=dict)
    categories: list[FaqCategoryConfig] = Field(default_factory=list)


class PageContentConfig(BaseModel):
    key: str
    label: str
    pagePath: str
    headline: str
    summary: str
    headlineTranslations: dict[str, str] = Field(default_factory=dict)
    summaryTranslations: dict[str, str] = Field(default_factory=dict)
    heroImageUrl: str = ""
    format: str = "standard"
    seoTitle: str = ""
    seoDescription: str = ""
    importEnabled: bool = False
    imports: list[ImportRecordConfig] = Field(default_factory=list)
    blocks: list[ContentBlockConfig] = Field(default_factory=list)


class WebsiteConfigPayload(BaseModel):
    homeSections: list[HomeSectionConfig]
    banners: list[BannerConfigIn] = Field(min_length=3)
    bannerCarousel: BannerCarouselConfig = Field(default_factory=BannerCarouselConfig)
    searchSettings: SearchSettingsConfig = Field(default_factory=SearchSettingsConfig)
    homeText: list[HomeTextConfig] = Field(default_factory=list)
    featureCards: list[FeatureCardConfig] = Field(default_factory=list)
    platformSellingPoints: list[PlatformSellingPointConfig] = Field(default_factory=list)
    homeWhyChoose: HomeWhyChooseConfig = Field(default_factory=HomeWhyChooseConfig)
    homeProcurementModes: list[HomeProcurementModeConfig] = Field(default_factory=list)
    homeScenarios: list[HomeScenarioConfig] = Field(default_factory=list)
    homeSuppliers: list[HomeSupplierConfig] = Field(default_factory=list)
    homeCategoryFallback: list[HomeCategoryFallbackConfig] = Field(default_factory=list)
    homeProductFallback: list[HomeProductFallbackConfig] = Field(default_factory=list)
    faq: FaqPageConfig
    pages: list[PageContentConfig]


class UploadedFileOut(BaseModel):
    url: str
    fileName: str
    contentType: str
    size: int


class ParsedDocxOut(BaseModel):
    fileName: str
    title: str
    paragraphs: list[str]
    tables: list[list[list[str]]]
    blocks: list[ContentBlockConfig]
