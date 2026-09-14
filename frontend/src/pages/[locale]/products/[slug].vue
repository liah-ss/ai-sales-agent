<script setup lang="ts">
import ProductDetailView from '../../../views/ProductDetailView.vue'
import { getProduct, type CategoryTree } from '../../../api/catalog'
import { useI18n } from '../../../composables/useI18n'
import type { Product } from '../../../types/catalog'
import { localizePath } from '../../../utils/localeRouting'
import { publicProductPath } from '../../../utils/productUrl'
import { availableContentLocales, hasLocalizedField, localizedField, plainText } from '../../../utils/seoContent'

const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug))
const { locale, t } = useI18n()
const apiHeaders = useApiRequestHeaders()
const { data, error, status } = await useAsyncData(`product-${locale.value}-${slug.value}`, async () => {
  // Related products are non-critical content. ProductDetailView refreshes
  // them in the background after hydration, so they must not hold up SSR.
  if (import.meta.client) {
    const product = await getProduct(slug.value)
    return { product, categories: undefined }
  }
  const [product, categories] = await Promise.all([
    $fetch<Product>(`/api/products/${slug.value}`, { headers: apiHeaders }),
    $fetch<CategoryTree[]>('/api/categories', { headers: apiHeaders }),
  ])
  return { product, categories }
}, {
  // Keep complete SSR output for SEO, but let client-side route changes render
  // immediately while the detail request finishes in the background.
  lazy: import.meta.client,
})

const product = computed(() => data.value?.product ?? null)

if (product.value) {
  const canonicalPath = localizePath(publicProductPath(product.value), locale.value)
  if (route.path !== canonicalPath) {
    await navigateTo(canonicalPath, { redirectCode: 301, replace: true })
  }
}

if (import.meta.server && (error.value || !product.value)) {
  throw createError({ statusCode: 404, statusMessage: t('detail.notFound') })
}

watch([status, error], ([currentStatus, currentError]) => {
  if (import.meta.client && (currentError || (currentStatus === 'success' && !product.value))) {
    showError(createError({ statusCode: 404, statusMessage: t('detail.notFound') }))
  }
})

const localizedName = computed(() => product.value
  ? String(localizedField(product.value, locale.value, 'name'))
  : t('detail.loadingTitle'))
const localizedSummary = computed(() => product.value
  ? String(localizedField(product.value, locale.value, 'summary'))
  : t('detail.loadingMessage'))
const seoTitle = computed(() => {
  if (!product.value) return `${t('detail.loadingTitle')} | ExampleCorp`
  const managedTitle = plainText(localizedField(product.value, locale.value, 'seo_title'))
  return `${plainText(managedTitle || localizedName.value, 160)} | ExampleCorp`
})
const productCode = computed(() => {
  const record = product.value
  if (!record) return ''
  const { product_code: code } = record
  return code || ''
})
const seoDescription = computed(() => {
  const source = product.value && (localizedField(product.value, locale.value, 'seo_description')
    || localizedField(product.value, locale.value, 'answer_summary'))
    || localizedSummary.value
  const identity = productCode.value
    ? ` Product code: ${productCode.value}.`
    : ''
  // Keep the managed copy readable while making every indexable product URL distinct.
  return plainText(`${plainText(source, 220)}${identity}`, 260)
})
const productImage = computed(() => product.value?.main_image || undefined)
const siteUrl = String(config.public.siteUrl).replace(/\/$/, '')
const localizedSpecifications = computed(() => {
  if (!product.value) return []
  const specifications = localizedField(product.value, locale.value, 'specifications')
  return Array.isArray(specifications)
    ? specifications as Array<{ label: string; value: string }>
    : []
})
const localizedHighlights = computed(() => {
  if (!product.value) return []
  const highlights = localizedField(product.value, locale.value, 'highlights')
  return Array.isArray(highlights) ? highlights.map(value => String(value)) : []
})
const quotationDescription = computed(() => ({
  'zh-CN': '按需询盘，联系获取报价',
  en: 'Contact for quotation',
  id: 'Hubungi kami untuk mendapatkan penawaran',
})[locale.value])

usePageSeo(computed(() => {
  const currentProduct = product.value
  const base = {
    title: seoTitle.value,
    description: seoDescription.value,
    path: currentProduct ? publicProductPath(currentProduct) : `/products/${slug.value}`,
    locale: locale.value,
    image: productImage.value,
    imageAlt: localizedName.value,
    ogType: 'product' as const,
    breadcrumbs: [
      { name: t('nav.home'), path: '/' },
      { name: t('products.title'), path: '/products' },
      { name: localizedName.value, path: currentProduct ? publicProductPath(currentProduct) : `/products/${slug.value}` },
    ],
  }
  if (!currentProduct) return { ...base, robots: 'noindex,follow' }

  return {
    ...base,
    robots: currentProduct.is_indexable && hasLocalizedField(currentProduct, locale.value, 'name') ? 'index,follow' : 'noindex,follow',
    availableLocales: availableContentLocales(currentProduct, 'name'),
    updatedAt: currentProduct.content_updated_at || undefined,
    schema: {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: localizedName.value,
    description: plainText(localizedField(currentProduct, locale.value, 'answer_summary') || localizedSummary.value, 500),
    sku: currentProduct.product_code,
    model: currentProduct.model,
    image: currentProduct.images.length ? currentProduct.images : productImage.value ? [productImage.value] : [],
    category: currentProduct.category.name,
    brand: { '@id': `${siteUrl}/#organization` },
    ...(currentProduct.author_name ? { author: { '@type': 'Person', name: currentProduct.author_name } } : {}),
    ...(currentProduct.technical_reviewer ? { reviewedBy: { '@type': 'Person', name: currentProduct.technical_reviewer } } : {}),
    additionalProperty: [
      ...localizedSpecifications.value.map(specification => ({
        '@type': 'PropertyValue',
        name: specification.label,
        value: specification.value,
      })),
      ...localizedHighlights.value.map(value => ({
        '@type': 'PropertyValue',
        name: 'Product highlight',
        value,
      })),
      ...currentProduct.standards.map(value => ({ '@type': 'PropertyValue', name: 'Standard', value })),
    ],
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}${localizePath(publicProductPath(currentProduct), locale.value)}`,
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'PriceSpecification',
        description: quotationDescription.value,
      },
      seller: { '@id': `${siteUrl}/#organization` },
    },
    },
  }
}))

useHead(() => ({
  meta: product.value
    ? [{ property: 'product:availability', content: 'in stock' }]
    : [],
}))
</script>

<template>
  <ProductDetailView
    :initial-product="data?.product"
    :initial-categories="data?.categories"
  />
</template>
