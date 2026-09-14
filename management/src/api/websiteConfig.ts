import { apiGet, apiPut, apiUpload } from './client'
import type { ContentBlock, FaqPageConfig, PageContentConfig } from '../types/websiteConfig'

export interface UploadedFile {
  url: string
  fileName: string
  contentType: string
  size: number
}

export interface ParsedDocx {
  fileName: string
  title: string
  paragraphs: string[]
  tables: string[][][]
  blocks: ContentBlock[]
}

export interface WebsiteConfigPayload {
  homeSections: import('../types/websiteConfig').HomeSection[]
  banners: import('../types/websiteConfig').BannerConfig[]
  bannerCarousel?: import('../types/websiteConfig').BannerCarouselSettings
  searchSettings?: import('../types/websiteConfig').SearchSettings
  homeText?: import('../types/websiteConfig').HomeText[]
  featureCards?: import('../types/websiteConfig').FeatureCard[]
  platformSellingPoints?: import('../types/websiteConfig').PlatformSellingPoint[]
  homeWhyChoose?: import('../types/websiteConfig').HomeWhyChoose
  homeProcurementModes?: import('../types/websiteConfig').HomeProcurementMode[]
  homeScenarios?: import('../types/websiteConfig').HomeScenario[]
  homeSuppliers?: import('../types/websiteConfig').HomeSupplier[]
  homeCategoryFallback?: import('../types/websiteConfig').HomeCategoryFallback[]
  homeProductFallback?: import('../types/websiteConfig').HomeProductFallback[]
  faq: FaqPageConfig
  pages: PageContentConfig[]
}

export function getWebsiteConfig(token: string) {
  return apiGet<WebsiteConfigPayload>('/management/website-config', token)
}

export function saveWebsiteConfig(payload: WebsiteConfigPayload, token: string) {
  return apiPut<WebsiteConfigPayload, WebsiteConfigPayload>('/management/website-config', payload, token)
}

export function uploadWebsiteImage(file: File, token: string) {
  return apiUpload<UploadedFile>('/management/website-config/uploads/images', file, token)
}

export function parseWebsiteDocx(file: File, token: string) {
  return apiUpload<ParsedDocx>('/management/website-config/uploads/docx/parse', file, token)
}
