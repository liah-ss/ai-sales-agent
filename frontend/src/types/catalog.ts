import type { SiteSettings } from './site'

export interface TranslationMeta {
  status?: 'missing' | 'current' | 'stale' | 'failed'
  source_locale?: 'zh-CN' | 'id' | null
  generated_at?: string | null
}

export type LocalizedPayload = Record<string, unknown> & { _meta?: TranslationMeta }
export type Translations = Partial<Record<'id' | 'en', LocalizedPayload>>

export interface SeoGeoFields {
  seo_title: string | null
  seo_description: string | null
  answer_summary: string | null
  author_name: string | null
  technical_reviewer: string | null
  evidence_urls: string[]
  standards: string[]
  applicable_markets: string[]
  unsuitable_conditions: string[]
  is_indexable: boolean
  content_updated_at: string | null
}

export interface PriceTier {
  label?: string
  range: string
  price: string
  visible?: boolean
}

export interface FulfillmentItem {
  name: string
  copy: string
}

export interface Category {
  id: number
  name: string
  slug: string
  parent_id: number | null
  color: string | null
  sort_order: number
  translations: Translations
  children?: Category[]
}

export interface ProductCategory {
  name: string
  slug: string
  color: string | null
  fulfillment_methods?: string[]
  fulfillment_items?: FulfillmentItem[]
  fulfillment_title?: string | null
  fulfillment_copy?: string | null
  assurance_items?: AssuranceItem[]
  translations: Translations
}

export interface ProductSummary {
  id: number
  product_code: string
  slug: string
  public_slug: string
  name: string
  model: string
  summary: string
  main_image: string | null
  image_tone: string | null
  tag: string | null
  tag_more: string[]
  is_hot: boolean
  sort_order: number
  category: ProductCategory
  translations: Translations
  is_indexable: boolean
  content_updated_at: string | null
}

export interface Product extends ProductSummary, SeoGeoFields {
  description: string | null
  detail_blocks: ProductDetailBlock[]
  images: string[]
  highlights: string[]
  specifications: Array<{ label: string; value: string }>
  variants?: ProductVariant[]
  price_tiers?: PriceTier[]
  show_surprise_only?: boolean
  fulfillment_methods?: string[]
  fulfillment_items?: FulfillmentItem[]
  fulfillment_title?: string | null
  fulfillment_copy?: string | null
  assurance_items?: AssuranceItem[]
  process_items?: ProcessItem[]
  moq: string | null
  price_mode: string
}

export interface AssuranceItem {
  duration?: string
  title: string
  copy?: string
}

export interface ProcessItem {
  title: string
  copy: string
}

export interface ProductDetailBlock {
  type: 'rich-text' | 'heading' | 'text' | 'image' | 'table' | 'pdf'
  content?: string
  url?: string
  name?: string
  alt?: string
  rows?: string[][]
}

export interface ProductVariant {
  code?: string
  name: string
  model?: string
  specifications?: Array<{ label: string; value: string }>
  price_tiers?: PriceTier[]
  price_mode?: string
  moq?: string | null
  images?: string[]
}

export interface ProductListResponse {
  items: ProductSummary[]
  total: number
  page: number
  page_size: number
}

export interface NewsArticleSummary {
  id: number
  title: string
  slug: string
  summary: string
  thumbnail_url: string | null
  source: string
  published_at: string
  sort_order: number
  translations: Translations
  is_indexable: boolean
  content_updated_at: string | null
}

export interface NewsArticle extends NewsArticleSummary, SeoGeoFields {
  content: string
}

export interface NewsListResponse {
  items: NewsArticleSummary[]
  total: number
  page: number
  page_size: number
}

export interface DeliveryCaseSummary {
  id: number
  title: string
  slug: string
  summary: string
  thumbnail_url: string | null
  client_name: string
  industry: string
  location: string
  translations: Translations
  delivered_at: string
  sort_order: number
  is_indexable: boolean
  content_updated_at: string | null
}

export interface DeliveryCase extends DeliveryCaseSummary, SeoGeoFields {
  content: string
  project_overview: string
  indonesia_fit: string
  professional_configuration: string
  key_parameter_table: string[][]
  delivery_challenges: Array<{
    challenge: string
    solution: string
  }>
  project_results: string
}

export interface DeliveryCaseListResponse {
  items: DeliveryCaseSummary[]
  total: number
  page: number
  page_size: number
}

export interface SolutionSummary {
  id: number
  title: string
  slug: string
  icon: string | null
  summary: string
  scenarios: string[]
  translations: Translations
  sort_order: number
  is_indexable: boolean
  content_updated_at: string | null
}

export interface Solution extends SolutionSummary, SeoGeoFields {
  content: string
  document_sections: Array<{
    type: 'paragraph' | 'list' | 'table'
    title: string
    content?: string
    items?: string[]
    rows?: string[][]
  }>
  images: string[]
  equipment: string[]
  benefits: string[]
  detailed_description: string | null
  pitfalls: string[]
  core_parameters: Array<{ label: string; value: string }>
  special_contributions: string[]
  related_products: string[]
}

export interface Banner {
  id: number
  title: string
  subtitle: string | null
  badge_text: string | null
  image_url: string
  mobile_image_url: string | null
  cta_text: string | null
  cta_url: string | null
  product_slug: string | null
  sort_order: number
}

export interface BannerCarousel {
  autoplay: boolean
  intervalSeconds: number
}

export interface HomeMetric {
  id: number
  value: string
  label: string
  description: string | null
  sort_order: number
}

export interface ContentBlock {
  id: number
  block_type: string
  title: string
  subtitle: string | null
  content: string | null
  icon: string | null
  image_url: string | null
  extra: Record<string, unknown>
  sort_order: number
}

export interface HomeResponse {
  site: SiteSettings
  banners: Banner[]
  banner_carousel: BannerCarousel
  trust_badges: ContentBlock[]
  metrics: HomeMetric[]
  features: ContentBlock[]
  hot_products: ProductSummary[]
  solutions: SolutionSummary[]
  quality_steps: ContentBlock[]
}
