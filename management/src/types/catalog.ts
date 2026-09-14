export type ContentLocale = 'zh-CN' | 'id' | 'en'

export interface TranslationMeta {
  status: 'missing' | 'current' | 'stale' | 'failed'
  source_locale?: 'zh-CN' | 'id' | null
  source_fingerprint?: string
  generated_at?: string | null
  provider?: string | null
  model?: string | null
  last_error?: string | null
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
  content_updated_at?: string | null
}

export interface PriceTier {
  label?: string
  range: string
  price: string
  visible: boolean
}

export type PriceTierInput = Omit<PriceTier, 'visible'> & { visible?: boolean }

export interface FulfillmentItem {
  name: string
  copy: string
}

export interface ProductSpecification {
  label: string
  value: string
}

export interface ProcessItem {
  title: string
  copy: string
}

export interface SolutionDocumentSection {
  type: 'paragraph' | 'list' | 'table'
  title: string
  content?: string
  items?: string[]
  rows?: string[][]
}

export interface DeliveryChallenge {
  challenge: string
  solution: string
}

export interface DeliveryCaseStructuredContent {
  project_overview: string
  indonesia_fit: string
  professional_configuration: string
  key_parameter_table: string[][]
  delivery_challenges: DeliveryChallenge[]
  project_results: string
}

export interface TranslationStatusResponse extends TranslationMeta {
  module: CatalogKind
  record_id: number
  translation?: LocalizedPayload
}

export interface ManagementCategorySummary {
  id: number
  name: string
  slug: string
  parent_id: number | null
  color: string | null
  sort_order: number
  is_active: boolean
}

export interface ManagementCategory extends ManagementCategorySummary {
  fulfillment_methods?: string[]
  fulfillment_items?: FulfillmentItem[]
  fulfillment_title?: string | null
  fulfillment_copy?: string | null
  assurance_items?: AssuranceItem[]
  translations: Translations
  children?: ManagementCategory[]
}

export interface ManagementCategoryTree extends ManagementCategory {
  children: ManagementCategoryTree[]
}

export interface ManagementProduct extends SeoGeoFields {
  id: number
  product_code: string
  batch_number: number
  category_id: number
  name: string
  slug: string
  model: string
  summary: string
  description: string | null
  detail_blocks: ProductDetailBlock[]
  main_image: string | null
  images: string[]
  highlights: string[]
  specifications: ProductSpecification[]
  variants?: ProductVariant[]
  price_tiers?: PriceTierInput[]
  show_surprise_only?: boolean
  fulfillment_methods?: string[]
  fulfillment_items?: FulfillmentItem[]
  fulfillment_title?: string | null
  fulfillment_copy?: string | null
  assurance_items?: AssuranceItem[]
  process_items?: ProcessItem[]
  translations: Translations
  moq: string | null
  price_mode: string
  image_tone: string | null
  tag: string | null
  tag_more: string[]
  is_hot: boolean
  is_active: boolean
  sort_order: number
  category: ManagementCategory
}

export interface ManagementProductSummary {
  id: number
  product_code: string
  batch_number: number
  category_id: number
  name: string
  slug: string
  model: string
  price_mode: string
  is_hot: boolean
  is_active: boolean
  sort_order: number
  category: Pick<ManagementCategory, 'id' | 'name' | 'slug'>
}

export interface ManagementProductListResponse {
  items: ManagementProductSummary[]
  total: number
  all_total: number
  active_total: number
  page: number
  page_size: number
}

export interface ManagementCatalogCounts {
  categories: number
  products: number
  active_products: number
  solutions: number
  news: number
  delivery_cases: number
}

export interface AssuranceItem {
  duration?: string
  title: string
  copy?: string
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
  specifications?: ProductSpecification[]
  price_tiers?: PriceTierInput[]
  price_mode?: string
  moq?: string | null
  images?: string[]
}

export interface ManagementSolutionSummary {
  id: number
  title: string
  slug: string
  scenarios: string[]
  sort_order: number
  is_active: boolean
}

export interface ManagementSolution extends ManagementSolutionSummary, SeoGeoFields {
  icon: string | null
  summary: string
  content: string
  document_sections?: SolutionDocumentSection[]
  images: string[]
  equipment: string[]
  benefits: string[]
  detailed_description: string | null
  pitfalls: string[]
  core_parameters: Array<{ label: string; value: string }>
  special_contributions: string[]
  related_products: string[]
  translations: Translations
}

export interface ManagementNewsArticleSummary {
  id: number
  title: string
  slug: string
  source: string
  published_at: string
  sort_order: number
  is_active: boolean
}

export interface ManagementNewsArticle extends ManagementNewsArticleSummary, SeoGeoFields {
  summary: string
  content: string
  thumbnail_url: string | null
  translations: Translations
}

export interface ManagementDeliveryCaseSummary {
  id: number
  title: string
  slug: string
  industry: string
  delivered_at: string
  sort_order: number
  is_active: boolean
}

export interface ManagementDeliveryCase extends ManagementDeliveryCaseSummary, SeoGeoFields {
  summary: string
  content: string
  project_overview?: string
  indonesia_fit?: string
  professional_configuration?: string
  key_parameter_table?: string[][]
  delivery_challenges?: DeliveryChallenge[]
  project_results?: string
  client_name: string
  translations: Translations
}

export type CatalogKind = 'products' | 'categories' | 'solutions' | 'news' | 'delivery-cases'

export type CatalogItem = ManagementProduct | ManagementProductSummary | ManagementCategory | ManagementCategorySummary | ManagementSolution | ManagementSolutionSummary | ManagementNewsArticle | ManagementNewsArticleSummary | ManagementDeliveryCase | ManagementDeliveryCaseSummary

export type CategoryPayload = Omit<ManagementCategory, 'id'>
export type ProductPayload = Omit<ManagementProduct, 'id' | 'category'>
export type SolutionPayload = Omit<ManagementSolution, 'id'>
export type NewsArticlePayload = Omit<ManagementNewsArticle, 'id'>
export type DeliveryCasePayload = Omit<ManagementDeliveryCase, 'id'>
