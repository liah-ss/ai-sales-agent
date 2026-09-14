import type { H3Event } from 'h3'

interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export type SitemapLocale = 'id' | 'en' | 'zh-cn'
export type SitemapType = 'pages' | 'products' | 'solutions' | 'delivery-cases' | 'news'

interface TranslationPayload {
  _meta?: { status?: string }
  name?: string
  title?: string
}

interface SlugItem {
  id?: number
  slug: string
  public_slug?: string
  translations?: Partial<Record<'id' | 'en', TranslationPayload>>
  is_indexable?: boolean
  content_updated_at?: string | null
}

function publicProductSlug(item: SlugItem) {
  const slug = item.public_slug || item.slug
  return slug.endsWith('.html') ? slug : `${slug}.html`
}

function uniqueProductPages(items: SlugItem[]): SitemapPage[] {
  const pages = new Map<string, SitemapPage>()
  for (const item of items) {
    if (item.is_indexable === false) continue
    const slug = publicProductSlug(item)
    const path = `/products/${slug}`
    const existing = pages.get(path)
    if (!existing) {
      pages.set(path, {
        path,
        locales: itemLocales(item),
        lastmod: item.content_updated_at,
      })
      continue
    }
    existing.locales = [...new Set([...existing.locales, ...itemLocales(item)])]
    if (item.content_updated_at && (!existing.lastmod || item.content_updated_at > existing.lastmod)) {
      existing.lastmod = item.content_updated_at
    }
  }
  return [...pages.values()]
}

interface CategoryItem extends SlugItem {
  name: string
  children?: CategoryItem[]
}

export interface SitemapPage {
  path: string
  locales: SitemapLocale[]
  lastmod?: string | null
}

export const sitemapLocales: SitemapLocale[] = ['id', 'en', 'zh-cn']
export const sitemapTypes: SitemapType[] = ['pages', 'products', 'solutions', 'delivery-cases', 'news']

const localeInfo = {
  id: { hreflang: 'id-ID' },
  en: { hreflang: 'en' },
  'zh-cn': { hreflang: 'zh-CN' },
} as const

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, character => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character]!)
}

function flattenCategories(categories: CategoryItem[]): CategoryItem[] {
  return categories.flatMap(category => [category, ...flattenCategories(category.children || [])])
}

function hasUsableTranslation(item: SlugItem, locale: SitemapLocale) {
  if (locale === 'zh-cn') return true
  const payload = item.translations?.[locale]
  const status = payload?._meta?.status
  if (status === 'missing' || status === 'failed') return false
  return Boolean(String(payload?.name || payload?.title || '').trim())
}

function itemLocales(item: SlugItem): SitemapLocale[] {
  return sitemapLocales.filter(locale => hasUsableTranslation(item, locale))
}

function paginatedDirectory(path: string, total: number, pageSize: number): SitemapPage[] {
  return Array.from({ length: Math.max(0, Math.ceil(total / pageSize) - 1) }, (_, index) => ({
    path: `${path}/page/${index + 2}`,
    locales: sitemapLocales,
  }))
}

function apiRequest<T>(event: H3Event, url: string) {
  return $fetch<T>(url, {
    timeout: 180_000,
    retry: 2,
    retryDelay: 300,
    retryStatusCodes: [408, 425, 429, 500, 502, 503, 504],
    headers: { 'X-Request-ID': String(event.context.requestId || '') },
  })
}

async function fetchAllPaged(event: H3Event, base: string, path: string, pageSize = 40) {
  const first = await apiRequest<ListResponse<SlugItem>>(event, `${base}${path}?page=1&page_size=${pageSize}`)
  const items = [...first.items]
  const pages = Math.ceil(first.total / first.page_size)
  for (let page = 2; page <= pages; page += 1) {
    const response = await apiRequest<ListResponse<SlugItem>>(event, `${base}${path}?page=${page}&page_size=${pageSize}`)
    items.push(...response.items)
  }
  return items
}

export async function getSitemapPages(event: H3Event, type: SitemapType): Promise<SitemapPage[]> {
  const config = useRuntimeConfig(event)
  const apiBase = `${String(config.apiInternalBase).replace(/\/$/, '')}/api`

  if (type === 'pages') {
    return ['/', '/about', '/contact', '/faq', '/privacy-policy'].map(path => ({ path, locales: sitemapLocales }))
  }
  if (type === 'products') {
    const [categories, products] = await Promise.all([
      apiRequest<CategoryItem[]>(event, `${apiBase}/categories`),
      apiRequest<SlugItem[]>(event, `${apiBase}/products/sitemap`),
    ])
    return [
      { path: '/products', locales: sitemapLocales },
      ...paginatedDirectory('/products', products.length, 24),
      ...flattenCategories(categories).map(item => ({
        path: `/products/category/${encodeURIComponent(item.slug)}`,
        locales: itemLocales(item),
      })),
      ...uniqueProductPages(products),
    ]
  }
  if (type === 'solutions') {
    const items = await apiRequest<SlugItem[]>(event, `${apiBase}/solutions`)
    return items.filter(item => item.is_indexable !== false).map(item => ({
      path: `/solutions/${item.slug}`,
      locales: itemLocales(item),
      lastmod: item.content_updated_at,
    }))
  }

  const path = type === 'delivery-cases' ? '/delivery-cases' : '/news'
  const items = await fetchAllPaged(event, apiBase, path)
  return [
    { path, locales: sitemapLocales },
    ...paginatedDirectory(path, items.length, 8),
    ...items.filter(item => item.is_indexable !== false).map(item => ({
      path: `${path}/${item.slug}`,
      locales: itemLocales(item),
      lastmod: item.content_updated_at,
    })),
  ]
}

export function localizedUrl(siteUrl: string, locale: SitemapLocale, path: string) {
  return `${siteUrl}/${locale}${path === '/' ? '/' : path}`
}

export function renderUrlSet(
  siteUrl: string,
  pages: SitemapPage[],
  locale: SitemapLocale,
  visibleLocales: SitemapLocale[] = sitemapLocales,
) {
  const urls = pages.filter(page => page.locales.includes(locale)).map((page) => {
    const pageLocales = page.locales.filter(alternate => visibleLocales.includes(alternate))
    const defaultLocale = pageLocales.includes('id') ? 'id' : pageLocales[0]
    const alternates = pageLocales.map(alternate => (
      `<xhtml:link rel="alternate" hreflang="${localeInfo[alternate].hreflang}" href="${escapeXml(localizedUrl(siteUrl, alternate, page.path))}"/>`
    ))
    if (defaultLocale) {
      alternates.push(`<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(localizedUrl(siteUrl, defaultLocale, page.path))}"/>`)
    }
    const lastmod = page.lastmod ? `<lastmod>${escapeXml(page.lastmod.slice(0, 10))}</lastmod>` : ''
    return `<url><loc>${escapeXml(localizedUrl(siteUrl, locale, page.path))}</loc>${lastmod}${alternates.join('')}</url>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`
}

export function renderSitemapIndex(siteUrl: string, locales: SitemapLocale[] = sitemapLocales) {
  const entries = locales.flatMap(locale => sitemapTypes.map(type => (
    `<sitemap><loc>${escapeXml(`${siteUrl}/sitemaps/${locale}/${type}.xml`)}</loc></sitemap>`
  )))
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</sitemapindex>`
}
