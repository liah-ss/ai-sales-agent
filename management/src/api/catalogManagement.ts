import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client'
import type {
  CategoryPayload,
  DeliveryCasePayload,
  ManagementCategory,
  ManagementCategorySummary,
  ManagementCatalogCounts,
  ManagementDeliveryCase,
  ManagementDeliveryCaseSummary,
  ManagementNewsArticle,
  ManagementNewsArticleSummary,
  ManagementProduct,
  ManagementProductListResponse,
  ManagementSolution,
  ManagementSolutionSummary,
  NewsArticlePayload,
  ProductPayload,
  SolutionPayload,
  TranslationStatusResponse,
} from '../types/catalog'

export function getManagementCatalogCounts(token: string) {
  return apiGet<ManagementCatalogCounts>('/management/catalog/counts', token)
}

export function getManagementCategories(token: string) {
  return apiGet<ManagementCategorySummary[]>('/management/catalog/categories', token)
}

export function getManagementCategory(id: number, token: string) {
  return apiGet<ManagementCategory>(`/management/catalog/categories/${id}`, token)
}

export function createManagementCategory(payload: CategoryPayload, token: string) {
  return apiPost<ManagementCategory, CategoryPayload>('/management/catalog/categories', payload, token)
}

export function updateManagementCategory(id: number, payload: CategoryPayload, token: string) {
  return apiPut<ManagementCategory, CategoryPayload>(`/management/catalog/categories/${id}`, payload, token)
}

export function setManagementCategoryActive(id: number, isActive: boolean, token: string) {
  return apiPatch<ManagementCategory, { is_active: boolean }>(`/management/catalog/categories/${id}/active`, { is_active: isActive }, token)
}

export function deleteManagementCategory(id: number, token: string) {
  return apiDelete(`/management/catalog/categories/${id}`, token)
}

export function getManagementProducts(token: string, params: { q?: string; page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('page_size', String(params.pageSize))
  const query = search.toString()
  return apiGet<ManagementProductListResponse>(`/management/catalog/products${query ? `?${query}` : ''}`, token)
}

export function getManagementProduct(id: number, token: string) {
  return apiGet<ManagementProduct>(`/management/catalog/products/${id}`, token)
}

export function createManagementProduct(payload: ProductPayload, token: string) {
  return apiPost<ManagementProduct, ProductPayload>('/management/catalog/products', payload, token)
}

export function updateManagementProduct(id: number, payload: ProductPayload, token: string) {
  return apiPut<ManagementProduct, ProductPayload>(`/management/catalog/products/${id}`, payload, token)
}

export function setManagementProductActive(id: number, isActive: boolean, token: string) {
  return apiPatch<ManagementProduct, { is_active: boolean }>(`/management/catalog/products/${id}/active`, { is_active: isActive }, token)
}

export function deleteManagementProduct(id: number, token: string) {
  return apiDelete(`/management/catalog/products/${id}`, token)
}

export function bulkCreateManagementCategories(payload: CategoryPayload[], token: string) {
  return apiPost<ManagementCategory[], { items: CategoryPayload[] }>('/management/catalog/categories/bulk', { items: payload }, token)
}

export function bulkCreateManagementProducts(payload: ProductPayload[], token: string) {
  return apiPost<ManagementProduct[], { items: ProductPayload[] }>('/management/catalog/products/bulk', { items: payload }, token)
}

export function getManagementSolutions(token: string) {
  return apiGet<ManagementSolutionSummary[]>('/management/catalog/solutions', token)
}

export function getManagementSolution(id: number, token: string) {
  return apiGet<ManagementSolution>(`/management/catalog/solutions/${id}`, token)
}

export function createManagementSolution(payload: SolutionPayload, token: string) {
  return apiPost<ManagementSolution, SolutionPayload>('/management/catalog/solutions', payload, token)
}

export function updateManagementSolution(id: number, payload: SolutionPayload, token: string) {
  return apiPut<ManagementSolution, SolutionPayload>(`/management/catalog/solutions/${id}`, payload, token)
}

export function setManagementSolutionActive(id: number, isActive: boolean, token: string) {
  return apiPatch<ManagementSolution, { is_active: boolean }>(`/management/catalog/solutions/${id}/active`, { is_active: isActive }, token)
}

export function deleteManagementSolution(id: number, token: string) {
  return apiDelete(`/management/catalog/solutions/${id}`, token)
}

export function bulkCreateManagementSolutions(payload: SolutionPayload[], token: string) {
  return apiPost<ManagementSolution[], { items: SolutionPayload[] }>('/management/catalog/solutions/bulk', { items: payload }, token)
}

export function getManagementNews(token: string) {
  return apiGet<ManagementNewsArticleSummary[]>('/management/catalog/news', token)
}

export function getManagementNewsArticle(id: number, token: string) {
  return apiGet<ManagementNewsArticle>(`/management/catalog/news/${id}`, token)
}

export function createManagementNewsArticle(payload: NewsArticlePayload, token: string) {
  return apiPost<ManagementNewsArticle, NewsArticlePayload>('/management/catalog/news', payload, token)
}

export function updateManagementNewsArticle(id: number, payload: NewsArticlePayload, token: string) {
  return apiPut<ManagementNewsArticle, NewsArticlePayload>(`/management/catalog/news/${id}`, payload, token)
}

export function setManagementNewsArticleActive(id: number, isActive: boolean, token: string) {
  return apiPatch<ManagementNewsArticle, { is_active: boolean }>(`/management/catalog/news/${id}/active`, { is_active: isActive }, token)
}

export function deleteManagementNewsArticle(id: number, token: string) {
  return apiDelete(`/management/catalog/news/${id}`, token)
}

export function bulkCreateManagementNews(payload: NewsArticlePayload[], token: string) {
  return apiPost<ManagementNewsArticle[], { items: NewsArticlePayload[] }>('/management/catalog/news/bulk', { items: payload }, token)
}

export function getManagementDeliveryCases(token: string) {
  return apiGet<ManagementDeliveryCaseSummary[]>('/management/catalog/delivery-cases', token)
}

export function getManagementDeliveryCase(id: number, token: string) {
  return apiGet<ManagementDeliveryCase>(`/management/catalog/delivery-cases/${id}`, token)
}

export function createManagementDeliveryCase(payload: DeliveryCasePayload, token: string) {
  return apiPost<ManagementDeliveryCase, DeliveryCasePayload>('/management/catalog/delivery-cases', payload, token)
}

export function updateManagementDeliveryCase(id: number, payload: DeliveryCasePayload, token: string) {
  return apiPut<ManagementDeliveryCase, DeliveryCasePayload>(`/management/catalog/delivery-cases/${id}`, payload, token)
}

export function setManagementDeliveryCaseActive(id: number, isActive: boolean, token: string) {
  return apiPatch<ManagementDeliveryCase, { is_active: boolean }>(`/management/catalog/delivery-cases/${id}/active`, { is_active: isActive }, token)
}

export function deleteManagementDeliveryCase(id: number, token: string) {
  return apiDelete(`/management/catalog/delivery-cases/${id}`, token)
}

export function bulkCreateManagementDeliveryCases(payload: DeliveryCasePayload[], token: string) {
  return apiPost<ManagementDeliveryCase[], { items: DeliveryCasePayload[] }>('/management/catalog/delivery-cases/bulk', { items: payload }, token)
}

export function getTranslationStatus(kind: string, id: number, token: string) {
  return apiGet<TranslationStatusResponse>(`/management/translations/${kind}/${id}`, token)
}

export function generateEnglishTranslation(kind: string, id: number, force: boolean, token: string) {
  return apiPost<TranslationStatusResponse, { force: boolean }>(
    `/management/translations/${kind}/${id}/generate`,
    { force },
    token,
  )
}

export function batchGenerateEnglishTranslations(kind: string, force: boolean, token: string, limit = 50) {
  return apiPost<{
    processed: number
    current: number
    failed: number
    skipped: number
    results: TranslationStatusResponse[]
  }, { force: boolean, limit: number }>(
    `/management/translations/${kind}/batch`,
    { force, limit },
    token,
  )
}
