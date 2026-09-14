import { apiGet } from './client'
import { cachedRequest, rememberRequest } from './requestCache'
import type {
  Category,
  DeliveryCase,
  DeliveryCaseListResponse,
  HomeResponse,
  NewsArticle,
  NewsListResponse,
  Product,
  ProductListResponse,
  Solution,
  SolutionSummary,
} from '../types/catalog'

export interface CategoryTree extends Category {
  children: CategoryTree[]
}

export function getHome() {
  return apiGet<HomeResponse>('/home')
}

export function getCategories() {
  return cachedRequest('catalog:/categories', () => apiGet<CategoryTree[]>('/categories'))
}

export type ProductSort = 'default' | 'name_asc' | 'name_desc'

export function getProducts(params: {
  category?: string
  q?: string
  hot?: boolean
  sort?: ProductSort
  page?: number
  pageSize?: number
} = {}) {
  const search = new URLSearchParams()
  if (params.category) search.set('category', params.category)
  if (params.q) search.set('q', params.q)
  if (params.hot !== undefined) search.set('hot', String(params.hot))
  if (params.sort && params.sort !== 'default') search.set('sort', params.sort)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('page_size', String(params.pageSize))

  const query = search.toString()
  const path = `/products${query ? `?${query}` : ''}`
  return apiGet<ProductListResponse>(path)
}

export function getProduct(slug: string, aliases: string[] = []) {
  const request = cachedRequest(
    `product-detail:${slug}`,
    () => apiGet<Product>(`/products/${slug}`),
    30_000,
  )
  for (const alias of aliases) {
    rememberRequest(`product-detail:${alias}`, request, 30_000)
  }
  return request
}

export function getNews(params: { q?: string; page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('page_size', String(params.pageSize))
  const query = search.toString()
  const path = `/news${query ? `?${query}` : ''}`
  return cachedRequest(`catalog:${path}`, () => apiGet<NewsListResponse>(path), 60_000)
}

export function getNewsArticle(slug: string) {
  return cachedRequest(`news-detail:${slug}`, () => apiGet<NewsArticle>(`/news/${slug}`), 60_000)
}

export function getDeliveryCases(params: { q?: string; page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('page_size', String(params.pageSize))
  const query = search.toString()
  const path = `/delivery-cases${query ? `?${query}` : ''}`
  return cachedRequest(`catalog:${path}`, () => apiGet<DeliveryCaseListResponse>(path), 60_000)
}

export function getDeliveryCase(slug: string) {
  return cachedRequest(`delivery-case-detail:${slug}`, () => apiGet<DeliveryCase>(`/delivery-cases/${slug}`), 60_000)
}

export function getRelatedProducts(slug: string, limit = 3) {
  return cachedRequest(
    `product-related:${slug}?limit=${limit}`,
    () => apiGet<Product[]>(`/products/${slug}/related?limit=${limit}`),
    30_000,
  )
}

export function getSolutions(params: { q?: string } = {}) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  const query = search.toString()
  const path = `/solutions${query ? `?${query}` : ''}`
  return cachedRequest(`catalog:${path}`, () => apiGet<SolutionSummary[]>(path))
}

export function getSolution(slug: string) {
  return cachedRequest(`solution-detail:${slug}`, () => apiGet<Solution>(`/solutions/${slug}`), 60_000)
}
