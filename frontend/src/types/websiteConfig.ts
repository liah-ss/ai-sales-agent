export interface HomeSectionConfig {
  id: string
  name: string
  anchor: string
  description: string
  enabled: boolean
}

export interface BannerConfig {
  id: string
  title: string
  subtitle: string
  titleTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  subtitleTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  imageUrl: string
  linkUrl: string
  slot: string
  enabled: boolean
}

export interface BannerCarouselSettings {
  autoplay: boolean
  intervalSeconds: number
}

export interface SearchSettingsConfig {
  placeholder: string
  placeholderTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
}

export interface HomeTextConfig {
  key: string
  label: string
  value: string
  translations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
}

export interface FeatureCardConfig {
  id: string
  icon: string
  title: string
  content: string
  enabled: boolean
}

export interface PlatformSellingPointConfig {
  id: string
  icon: string
  title: string
  content: string
  titleTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  contentTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  enabled: boolean
}

export interface HomeWhyChooseReasonConfig {
  id: string
  number: string
  title: string
  subtitle: string
  quote: string
  bullets: string[]
  titleTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  subtitleTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  quoteTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  bulletTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string[]>>
  enabled: boolean
}

export interface HomeWhyChooseConfig {
  title: string
  ctaText: string
  titleTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  ctaTextTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  reasons: HomeWhyChooseReasonConfig[]
}

export interface HomeProcurementModeConfig {
  id: string
  badge: string
  title: string
  copy: string
  steps: string[]
  action: string
  to: string
  badgeTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  titleTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  copyTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  stepTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string[]>>
  actionTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  enabled: boolean
}

export interface HomeScenarioConfig {
  id: string
  icon: string
  title: string
  copy: string
  demand: string
  titleTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  copyTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  demandTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  enabled: boolean
}

export interface HomeSupplierConfig {
  id: string
  icon: string
  name: string
  badge: string
  scope: string
  nameTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  badgeTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  scopeTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  enabled: boolean
}

export interface HomeCategoryFallbackConfig {
  slug: string
  name: string
  icon: string
  sku: string
  tags: string[]
  nameTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  tagTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string[]>>
  enabled: boolean
}

export interface HomeProductFallbackConfig {
  slug: string
  name: string
  tag: string
  categorySlug: string
  icon: string
  nameTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  tagTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  enabled: boolean
}

export interface ContentBlockConfig {
  id: string
  type: string
  title: string
  body: string
  titleTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  bodyTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
}

export type WebsiteLocale = 'en' | 'zh-CN' | 'id'
export type WebsiteTranslations = Partial<Record<WebsiteLocale, string>>

export interface FaqItemConfig {
  id: string
  question: string
  answer: string
  questionTranslations?: WebsiteTranslations
  answerTranslations?: WebsiteTranslations
  popular: boolean
  enabled: boolean
}

export interface FaqCategoryConfig {
  id: string
  icon: string
  title: string
  titleTranslations?: WebsiteTranslations
  items: FaqItemConfig[]
  enabled: boolean
}

export interface FaqPageConfig {
  eyebrow: string
  title: string
  accent: string
  summary: string
  searchPlaceholder: string
  searchHint: string
  allLabel: string
  popularLabel: string
  questionUnit: string
  emptyTitle: string
  emptyMessage: string
  emptyAction: string
  quickJumpLabel: string
  ctaTitle: string
  ctaBody: string
  primaryAction: string
  secondaryAction: string
  primaryPath: string
  secondaryPath: string
  translations?: Partial<Record<WebsiteLocale, Partial<Record<FaqPageTextKey, string>>>>
  categories: FaqCategoryConfig[]
}

export type FaqPageTextKey = Exclude<keyof FaqPageConfig, 'primaryPath' | 'secondaryPath' | 'translations' | 'categories'>

export interface PageContentConfig {
  key: 'product' | 'solution' | 'about' | 'contact'
  label: string
  pagePath: string
  headline: string
  summary: string
  headlineTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  summaryTranslations?: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  heroImageUrl: string
  format: string
  seoTitle: string
  seoDescription: string
  importEnabled: boolean
  imports: Array<{
    id: string
    fileName: string
    fileType: string
    fileSize: string
    status: string
  }>
  blocks: ContentBlockConfig[]
}

export interface WebsiteConfigPayload {
  homeSections: HomeSectionConfig[]
  banners: BannerConfig[]
  bannerCarousel?: BannerCarouselSettings
  searchSettings?: SearchSettingsConfig
  homeText?: HomeTextConfig[]
  featureCards?: FeatureCardConfig[]
  platformSellingPoints?: PlatformSellingPointConfig[]
  homeWhyChoose?: HomeWhyChooseConfig
  homeProcurementModes?: HomeProcurementModeConfig[]
  homeScenarios?: HomeScenarioConfig[]
  homeSuppliers?: HomeSupplierConfig[]
  homeCategoryFallback?: HomeCategoryFallbackConfig[]
  homeProductFallback?: HomeProductFallbackConfig[]
  faq: FaqPageConfig
  pages: PageContentConfig[]
}
