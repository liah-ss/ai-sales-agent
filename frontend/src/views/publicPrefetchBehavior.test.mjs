import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [appSource, homePageSource, productsPageSource, productCatalogPageSource, catalogSource, cacheSource, localizedLinkSource, headerSource, mobileMenuSource, solutionsIndexSource, revalidateSource, composeSource, defaultLayoutSource, productCardSource] = await Promise.all([
  readFile(new URL('../app.vue', import.meta.url), 'utf8'),
  readFile(new URL('../pages/[locale]/index.vue', import.meta.url), 'utf8'),
  readFile(new URL('../pages/[locale]/products/index.vue', import.meta.url), 'utf8'),
  readFile(new URL('../composables/useProductCatalogPage.ts', import.meta.url), 'utf8'),
  readFile(new URL('../api/catalog.ts', import.meta.url), 'utf8'),
  readFile(new URL('../api/requestCache.ts', import.meta.url), 'utf8'),
  readFile(new URL('../components/common/LocalizedLink.vue', import.meta.url), 'utf8'),
  readFile(new URL('../components/layout/AppHeader.vue', import.meta.url), 'utf8'),
  readFile(new URL('../components/layout/MobileMenu.vue', import.meta.url), 'utf8'),
  readFile(new URL('../pages/[locale]/solutions/index.vue', import.meta.url), 'utf8'),
  readFile(new URL('../server/api/internal/revalidate.post.ts', import.meta.url), 'utf8'),
  readFile(new URL('../../../docker-compose.yml', import.meta.url), 'utf8'),
  readFile(new URL('../layouts/default.vue', import.meta.url), 'utf8'),
  readFile(new URL('../components/product/ProductCard.vue', import.meta.url), 'utf8'),
])

const nuxtConfigSource = await readFile(new URL('../../nuxt.config.ts', import.meta.url), 'utf8')

test('Nuxt application renders route content through the shared layout', () => {
  assert.match(appSource, /<NuxtLayout>/)
  assert.match(appSource, /<NuxtPage \/>/)
})

test('primary navigation prefetches generated Nuxt payloads', () => {
  assert.match(localizedLinkSource, /<NuxtLink/)
  assert.match(localizedLinkSource, /:prefetch="props\.prefetch"/)
  for (const path of ['/products', '/solutions/ev-charging-station', '/delivery-cases', '/about', '/contact', '/faq', '/news']) {
    assert.match(headerSource, new RegExp(`to="${path.replaceAll('/', '\\/')}" prefetch`))
  }
  assert.match(mobileMenuSource, /to="\/solutions\/ev-charging-station" prefetch[^>]*>\{\{ t\('nav\.solutions'\) \}\}/)
})

test('solutions directory opens the complete default solution directly', () => {
  assert.match(solutionsIndexSource, /localizePath\('\/solutions\/ev-charging-station', locale\.value\)/)
  assert.match(solutionsIndexSource, /redirectCode: 301/)
  assert.doesNotMatch(solutionsIndexSource, /SolutionsView/)
})

test('public navigation gives immediate feedback and keeps product links crawlable', () => {
  assert.match(defaultLayoutSource, /<NuxtLoadingIndicator/)
  assert.match(defaultLayoutSource, /:throttle="0"/)
  assert.match(localizedLinkSource, /:external="props\.external"/)
  assert.match(productCardSource, /class="product-card-link"/)
  assert.doesNotMatch(productCardSource, /class="product-card-link"[\s\S]*?\n\s*external/)
})

test('critical homepage and product data is fetched during SSR', () => {
  assert.match(homePageSource, /await useAsyncData/)
  assert.match(homePageSource, /\$fetch<HomeResponse>\('\/api\/home', \{ headers: apiHeaders \}\)/)
  assert.match(homePageSource, /const apiHeaders = useApiRequestHeaders\(\)/)
  assert.match(homePageSource, /const initialHome = data\.value\?\.home/)
  assert.match(homePageSource, /:initial-home="initialHome"/)
  assert.match(productsPageSource, /await useProductCatalogPage\(\)/)
  assert.match(productCatalogPageSource, /useAsyncData/)
  assert.match(productCatalogPageSource, /\$fetch<ProductListResponse>/)
  assert.match(productCatalogPageSource, /headers: apiHeaders/)
  assert.match(productsPageSource, /:initial-products="data\?\.products"/)
})

test('stable catalog metadata is cached while product lists always refresh', () => {
  assert.match(catalogSource, /cachedRequest\('catalog:\/categories'/)
  assert.match(catalogSource, /return apiGet<ProductListResponse>\(path\)/)
  assert.doesNotMatch(catalogSource, /catalog:\/products/)
  assert.match(cacheSource, /existing\.expiresAt > now/)
  assert.match(cacheSource, /ttlMs = 5 \* 60_000/)
  assert.match(cacheSource, /requestCache\.delete\(key\)/)
})

test('public SSR pages use Redis-backed stale-while-revalidate caching', () => {
  assert.match(nuxtConfigSource, /const homePageCache = \{ swr: 300 \}/)
  assert.match(nuxtConfigSource, /const directoryPageCache = \{ swr: 900 \}/)
  assert.match(nuxtConfigSource, /const detailPageCache = \{ swr: 1800 \}/)
  assert.match(nuxtConfigSource, /'\/\*\*\/products\/category\/\*\*': directoryPageCache/)
  assert.match(nuxtConfigSource, /'\/\*\*\/news\/\*\*': detailPageCache/)
  assert.match(nuxtConfigSource, /storage: \{[\s\S]*driver: 'redis'/)
  assert.match(nuxtConfigSource, /'\/\*\*\/search': \{ cache: false \}/)
})

test('management writes selectively clear and asynchronously warm public page caches', () => {
  assert.match(composeSource, /NUXT_REVALIDATE_URL: http:\/\/frontend:3000\/api\/internal\/revalidate/)
  assert.match(revalidateSource, /const SCOPE_PATHS:/)
  assert.match(revalidateSource, /await Promise\.all\(affectedKeys\.map\(key => storage\.removeItem\(key\)\)\)/)
  assert.match(revalidateSource, /const ALL_WARM_PATHS = \['\/', '\/products'/)
  assert.match(revalidateSource, /void Promise\.allSettled/)
  assert.match(revalidateSource, /warmupTimer\.unref\?\.\(\)/)
})

test('news and delivery pagination use page-specific SSR cache keys', async () => {
  const [newsPage, deliveryPage] = await Promise.all([
    readFile(new URL('../pages/[locale]/news/index.vue', import.meta.url), 'utf8'),
    readFile(new URL('../pages/[locale]/delivery-cases/index.vue', import.meta.url), 'utf8'),
  ])
  assert.match(newsPage, /key: `news-\$\{locale\.value\}-\$\{page\.value\}`/)
  assert.match(deliveryPage, /key: `delivery-cases-\$\{locale\.value\}-\$\{page\.value\}`/)
})

test('content views render route data without duplicate browser fetch ownership', async () => {
  const sources = await Promise.all([
    'SolutionDetailView.vue', 'DeliveryCasesView.vue', 'DeliveryCaseDetailView.vue', 'NewsView.vue', 'NewsDetailView.vue',
  ].map(name => readFile(new URL(`../views/${name}`, import.meta.url), 'utf8')))
  for (const source of sources) {
    assert.doesNotMatch(source, /onMounted\(\(\) => \{[\s\S]*?load/)
    assert.doesNotMatch(source, /watch\([^)]*,\s*load/)
  }
})
