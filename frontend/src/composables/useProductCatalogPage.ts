import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { CategoryTree } from '../api/catalog'
import type { ProductListResponse } from '../types/catalog'
import { localizedField } from '../utils/seoContent'
import { localizePath } from '../utils/localeRouting'
import { useI18n } from './useI18n'
import { publicProductPath } from '../utils/productUrl'

interface UseProductCatalogPageOptions {
  category?: MaybeRefOrGetter<string | undefined>
}

function flattenCategories(items: CategoryTree[]): CategoryTree[] {
  return items.flatMap(item => [item, ...flattenCategories(item.children || [])])
}

export async function useProductCatalogPage(options: UseProductCatalogPageOptions = {}) {
  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()
  const { locale, t } = useI18n()
  const apiHeaders = useApiRequestHeaders()
  const category = computed(() => String(toValue(options.category) || ''))
  const query = computed(() => String(route.query.q || ''))
  const hot = computed(() => route.query.hot === '1' || route.query.hot === 'true')
  const sort = computed<'default' | 'name_asc' | 'name_desc'>(() => (
    route.query.sort === 'name_asc' || route.query.sort === 'name_desc'
      ? route.query.sort
      : 'default'
  ))
  const page = computed(() => Math.max(1, Number(route.params.page || route.query.page) || 1))

  const asyncDataKey = computed(() => [
    'products',
    locale.value,
    category.value || 'all',
    query.value || 'no-query',
    hot.value ? 'hot' : 'all-temperature',
    sort.value,
    page.value,
  ].join('-'))
  const asyncData = useAsyncData(
    asyncDataKey,
    async () => {
      const search = new URLSearchParams({ page: String(page.value), page_size: '24' })
      if (category.value) search.set('category', category.value)
      if (query.value) search.set('q', query.value)
      if (hot.value) search.set('hot', 'true')
      if (sort.value !== 'default') search.set('sort', sort.value)
      const [categories, products] = await Promise.all([
        $fetch<CategoryTree[]>('/api/categories', { headers: apiHeaders }),
        $fetch<ProductListResponse>(`/api/products?${search}`, { headers: apiHeaders }),
      ])
      return { categories, products }
    },
    { watch: [category, query, hot, sort, page] },
  )
  const { data, error } = asyncData

  const selectedCategory = computed(() => category.value
    ? flattenCategories(data.value?.categories ?? []).find(item => item.slug === category.value)
    : undefined)

  const categoryName = computed(() => {
    const selected = selectedCategory.value
    if (!selected) return ''
    const categories = flattenCategories(data.value?.categories ?? [])
    const parent = selected.parent_id == null ? undefined : categories.find(item => item.id === selected.parent_id)
    return [parent, selected]
      .filter((item): item is CategoryTree => Boolean(item))
      .map(item => String(localizedField(item, locale.value, 'name')))
      .join(' · ')
  })
  const pageSuffix = computed(() => page.value > 1 ? ` · ${page.value}` : '')
  const pageDescriptionSuffix = computed(() => page.value > 1
    ? ({
        'zh-CN': ` 第 ${page.value} 页。`,
        en: ` Page ${page.value}.`,
        id: ` Halaman ${page.value}.`,
      })[locale.value]
    : '')
  const productSeoCopy = computed(() => ({
    'zh-CN': '浏览面向印度尼西亚及海外工程项目的工业设备，按类目、型号和应用场景筛选，并获取选型、标准适配与交付支持。',
    en: 'Browse power equipment for Indonesian and international projects by category, model and application, with specification, standards and delivery support.',
    id: 'Jelajahi peralatan listrik untuk proyek Indonesia dan internasional berdasarkan kategori, model, dan aplikasi, lengkap dengan dukungan spesifikasi, standar, dan pengiriman.',
  }[locale.value]))
  const seoTitle = computed(() => categoryName.value
    ? `${categoryName.value} · ${t('products.title')}${pageSuffix.value} | ExampleCorp`
    : `${t('products.title')}${pageSuffix.value} | ExampleCorp`)
  const seoDescription = computed(() => categoryName.value
    ? `${categoryName.value}: ${productSeoCopy.value}${pageDescriptionSuffix.value}`
    : `${productSeoCopy.value}${pageDescriptionSuffix.value}`)
  const noindex = computed(() => Boolean(query.value || hot.value || sort.value !== 'default'))
  const canonicalPath = computed(() => {
    const base = category.value ? `/products/category/${category.value}` : '/products'
    return page.value > 1 ? `${base}/page/${page.value}` : base
  })
  const totalPages = computed(() => Math.max(1, Math.ceil((data.value?.products.total ?? 0) / 24)))
  const adjacentPagePath = (targetPage: number) => {
    const base = category.value ? `/products/category/${category.value}` : '/products'
    return targetPage > 1 ? `${base}/page/${targetPage}` : base
  }
  const siteUrl = String(runtimeConfig.public.siteUrl).replace(/\/$/, '')

  usePageSeo(computed(() => ({
    title: seoTitle.value,
    description: seoDescription.value,
    path: canonicalPath.value,
    locale: locale.value,
    robots: noindex.value ? 'noindex,follow' : 'index,follow',
    previousPath: page.value > 1 ? adjacentPagePath(page.value - 1) : undefined,
    nextPath: page.value < totalPages.value ? adjacentPagePath(page.value + 1) : undefined,
    breadcrumbs: [
      { name: t('nav.home'), path: '/' },
      { name: t('products.title'), path: '/products' },
      ...(categoryName.value ? [{ name: categoryName.value, path: canonicalPath.value }] : []),
    ],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: categoryName.value || t('products.title'),
      description: seoDescription.value,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: data.value?.products.total ?? 0,
        itemListElement: (data.value?.products.items ?? []).map((product, index) => ({
          '@type': 'ListItem',
          position: ((page.value - 1) * 24) + index + 1,
          name: String(localizedField(product, locale.value, 'name')),
          url: `${siteUrl}${localizePath(publicProductPath(product), locale.value)}`,
        })),
      },
    },
  })))

  await asyncData
  if (error.value) {
    throw createError({ statusCode: 503, statusMessage: 'Product catalog is temporarily unavailable' })
  }
  if (category.value && !selectedCategory.value) {
    throw createError({ statusCode: 404, statusMessage: 'Product category not found' })
  }
  if (page.value > totalPages.value) {
    throw createError({ statusCode: 404, statusMessage: 'Product page not found' })
  }

  return {
    data,
    category,
    query,
    hot,
    sort,
  }
}
