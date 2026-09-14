export type ContentFormat = 'standard' | 'technical' | 'case-study' | 'landing'
export type WebsiteLocale = 'zh-CN' | 'id' | 'en'
export type WebsiteTranslations<T = string> = Partial<Record<WebsiteLocale, T>>

export interface HomeSection {
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
  titleTranslations?: WebsiteTranslations
  subtitleTranslations?: WebsiteTranslations
  imageUrl: string
  linkUrl: string
  slot: 'desktop' | 'mobile'
  enabled: boolean
}

export interface BannerCarouselSettings {
  autoplay: boolean
  intervalSeconds: number
}

export interface SearchSettings {
  placeholder: string
  placeholderTranslations?: WebsiteTranslations
}

export interface HomeText {
  key: string
  label: string
  value: string
  translations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
}

export interface FeatureCard {
  id: string
  icon: 'building' | 'badge' | 'package' | 'headphones' | 'shield' | 'truck' | 'factory'
  title: string
  content: string
  enabled: boolean
}

export interface PlatformSellingPoint {
  id: string
  icon: 'shield' | 'headphones' | 'globe' | 'badge' | 'truck' | 'factory'
  title: string
  content: string
  titleTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  contentTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  enabled: boolean
}

export interface HomeWhyChooseReason {
  id: string
  number: string
  title: string
  subtitle: string
  quote: string
  bullets: string[]
  titleTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  subtitleTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  quoteTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  bulletTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string[]>>
  enabled: boolean
}

export interface HomeWhyChoose {
  title: string
  ctaText: string
  titleTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  ctaTextTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  reasons: HomeWhyChooseReason[]
}

export interface HomeProcurementMode {
  id: string
  badge: string
  title: string
  copy: string
  steps: string[]
  action: string
  to: string
  badgeTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  titleTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  copyTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  stepTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string[]>>
  actionTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  enabled: boolean
}

export interface HomeScenario {
  id: string
  icon: string
  title: string
  copy: string
  demand: string
  titleTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  copyTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  demandTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  enabled: boolean
}

export interface HomeSupplier {
  id: string
  icon: string
  name: string
  badge: string
  scope: string
  nameTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  badgeTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  scopeTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  enabled: boolean
}

export interface HomeCategoryFallback {
  slug: string
  name: string
  icon: string
  sku: string
  tags: string[]
  nameTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  tagTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string[]>>
  enabled: boolean
}

export interface HomeProductFallback {
  slug: string
  name: string
  tag: string
  categorySlug: string
  icon: string
  nameTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  tagTranslations: Partial<Record<'en' | 'zh-CN' | 'id', string>>
  enabled: boolean
}

export interface ImportRecord {
  id: string
  fileName: string
  fileType: string
  fileSize: string
  status: 'queued' | 'ready'
}

export interface ContentBlock {
  id: string
  type: 'heading' | 'paragraph' | 'image' | 'specs' | 'cta'
  title: string
  body: string
  titleTranslations?: WebsiteTranslations
  bodyTranslations?: WebsiteTranslations
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  questionTranslations: WebsiteTranslations
  answerTranslations: WebsiteTranslations
  popular: boolean
  enabled: boolean
}

export interface FaqCategory {
  id: string
  icon: string
  title: string
  titleTranslations: WebsiteTranslations
  items: FaqItem[]
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
  translations: Partial<Record<WebsiteLocale, Partial<Record<FaqPageTextKey, string>>>>
  categories: FaqCategory[]
}

export type FaqPageTextKey = Exclude<keyof FaqPageConfig, 'primaryPath' | 'secondaryPath' | 'translations' | 'categories'>

export interface PageContentConfig {
  key: 'product' | 'solution' | 'about' | 'contact'
  label: string
  pagePath: string
  headline: string
  summary: string
  headlineTranslations?: WebsiteTranslations
  summaryTranslations?: WebsiteTranslations
  heroImageUrl: string
  format: ContentFormat
  seoTitle: string
  seoDescription: string
  importEnabled: boolean
  imports: ImportRecord[]
  blocks: ContentBlock[]
}
