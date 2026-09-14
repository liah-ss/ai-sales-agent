import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const productDetailSource = await readFile(new URL('./ProductDetailView.vue', import.meta.url), 'utf8')
const productsSource = await readFile(new URL('./ProductsView.vue', import.meta.url), 'utf8')
const paginationSource = await readFile(new URL('../components/common/PaginationControls.vue', import.meta.url), 'utf8')
const productCatalogPageSource = await readFile(new URL('../composables/useProductCatalogPage.ts', import.meta.url), 'utf8')
const pageSeoSource = await readFile(new URL('../composables/usePageSeo.ts', import.meta.url), 'utf8')
const productNuxtPageSource = await readFile(new URL('../pages/[locale]/products/[slug].vue', import.meta.url), 'utf8')
const newsPageSource = await readFile(new URL('../pages/[locale]/news/index.vue', import.meta.url), 'utf8')
const deliveryCasesPageSource = await readFile(new URL('../pages/[locale]/delivery-cases/index.vue', import.meta.url), 'utf8')
const homeSource = await readFile(new URL('./HomeView.vue', import.meta.url), 'utf8')
const styleSource = await readFile(new URL('../style.css', import.meta.url), 'utf8')

test('product detail page does not render the detail banner', () => {
  assert.doesNotMatch(productDetailSource, /product-detail-template-hero/)
})

test('product pages expose product Open Graph and complete commerce structured data', () => {
  assert.match(productNuxtPageSource, /ogType: 'product'/)
  assert.match(productNuxtPageSource, /additionalProperty: \[/)
  assert.match(productNuxtPageSource, /localizedSpecifications\.value\.map/)
  assert.match(productNuxtPageSource, /localizedHighlights\.value\.map/)
  assert.match(productNuxtPageSource, /'@type': 'Offer'/)
  assert.match(productNuxtPageSource, /availability: 'https:\/\/schema\.org\/InStock'/)
  assert.match(productNuxtPageSource, /property: 'product:availability'/)
})

test('global SEO emits site identity, locale alternates, breadcrumb ids and encoded schema images', () => {
  assert.match(pageSeoSource, /ogSiteName: 'ExampleCorp'/)
  assert.match(pageSeoSource, /openGraphLocaleMap\[locale\]/)
  assert.match(pageSeoSource, /'@id': `\$\{canonical\.value\}#breadcrumb`/)
  assert.match(pageSeoSource, /encodeURI\(absoluteUrl\(assetBaseUrl, child\)\)/)
})

test('product detail does not request an undefined slug while leaving the route', () => {
  assert.match(productDetailSource, /typeof route\.params\.slug === 'string' \? route\.params\.slug : ''/)
  assert.match(productDetailSource, /async function loadProduct\(apiKey = productApiKey\.value, options: \{ background\?: boolean \} = \{\}\)/)
  assert.match(productDetailSource, /if \(!apiKey\) return/)
  assert.doesNotMatch(productDetailSource, /watch\(productApiKey/)
  assert.match(productDetailSource, /getRelatedProducts\(`p-id-\$\{initialProduct\.id\}`\)/)
})

test('product detail refreshes prerendered product data after the first interaction window', () => {
  assert.match(productDetailSource, /initialRefreshTimer = setTimeout\(refreshProductInBackground, 1_500\)/)
  assert.match(productDetailSource, /if \(initialRefreshTimer\) clearTimeout\(initialRefreshTimer\)/)
  assert.match(productDetailSource, /const background = options\.background === true && Boolean\(product\.value\)/)
  assert.match(productDetailSource, /if \(!background\) isLoading\.value = false/)
  assert.doesNotMatch(productDetailSource, /if \(!props\.initialProduct\) void loadProduct/)
})

test('background product and related requests use the indexed product id', () => {
  assert.match(productDetailSource, /\? `p-id-\$\{currentProduct\.id\}`/)
  assert.match(productDetailSource, /getProduct\(requestKey\)/)
  assert.match(productDetailSource, /getRelatedProducts\(requestKey\)/)
})

test('product detail SSR does not wait for non-critical related products', () => {
  const ssrRequest = productNuxtPageSource.match(/useAsyncData\([\s\S]*?\n\}\)/)?.[0] ?? ''
  assert.match(ssrRequest, /\$fetch<Product>\(`\/api\/products\/\$\{slug\.value\}`/)
  assert.match(ssrRequest, /\$fetch<CategoryTree\[]>\('\/api\/categories'/)
  assert.doesNotMatch(ssrRequest, /related\?limit=/)
  assert.doesNotMatch(productNuxtPageSource, /:initial-related-products=/)
})

test('product detail navigation is non-blocking on the client while SSR stays complete', () => {
  assert.match(productNuxtPageSource, /lazy: import\.meta\.client/)
  assert.match(productNuxtPageSource, /if \(import\.meta\.server && \(error\.value \|\| !product\.value\)\)/)
  assert.match(productDetailSource, /publicProductSlug\(initialProduct\) !== routeSlug/)
})

test('product detail refreshes after returning from the management tab', () => {
  assert.match(productDetailSource, /window\.addEventListener\('focus', refreshProductInBackground\)/)
  assert.match(productDetailSource, /document\.addEventListener\('visibilitychange', refreshVisibleProduct\)/)
  assert.match(productDetailSource, /document\.visibilityState === 'visible'/)
  assert.match(productDetailSource, /window\.removeEventListener\('focus', refreshProductInBackground\)/)
  assert.match(productDetailSource, /document\.removeEventListener\('visibilitychange', refreshVisibleProduct\)/)
})

test('product search runs only from the search button', () => {
  assert.doesNotMatch(productsSource, /scheduleSearch/)
  assert.doesNotMatch(productsSource, /@input="scheduleSearch"/)
  assert.match(productsSource, /const searchInput = shallowRef\(props\.initialQuery \|\| ''\)/)
  assert.match(productsSource, /replaceFilters\(\{ q: searchInput\.value \}\)/)
  assert.match(productsSource, /type="button"\s+@click="submitSearch"/)
})

test('search input and button use separate non-overlapping controls', () => {
  const searchStyles = styleSource.match(/\.catalog-search \{[\s\S]*?\n\}/)?.[0] ?? ''
  const inputStyles = styleSource.match(/\.catalog-search \.search-input \{[\s\S]*?\n\}/)?.[0] ?? ''
  const buttonStyles = styleSource.match(/\.catalog-search-button \{[\s\S]*?\n\}/)?.[0] ?? ''

  assert.match(searchStyles, /gap:\s*10px/)
  assert.match(inputStyles, /min-width:\s*0/)
  assert.match(inputStyles, /border-radius:\s*8px/)
  assert.match(buttonStyles, /border-radius:\s*8px/)
  assert.doesNotMatch(buttonStyles, /border-left:\s*0/)
})

test('product category filters render database-backed localized names', () => {
  assert.match(productsSource, /const \{ localizedCategory \} = useLocalizedContent\(\)/)
  assert.match(productsSource, /localizedCategory\(category\)\.name/)
})

test('product center uses server pagination with exactly 24 products per page', () => {
  assert.match(productsSource, /const PRODUCT_PAGE_SIZE = 24/)
  assert.match(productsSource, /pageSize: PRODUCT_PAGE_SIZE/)
  assert.match(productsSource, /<PaginationControls/)
  assert.match(productsSource, /route\.query\.page/)
  assert.doesNotMatch(productsSource, /IntersectionObserver|loadMoreProducts|product-load-more/)
})

test('product empty state is exclusive with any non-empty result page', () => {
  assert.match(productsSource, /<template v-else-if="products\.length">/)
  assert.match(productsSource, /<PaginationControls\s+v-if="totalPages > 1"/)
  assert.match(productsSource, /<StatusPanel\s+v-else\s+variant="empty"/)
  assert.doesNotMatch(productsSource, /v-if="products\.length && totalPages > 1"/)
})

test('product pagination keeps edge pages and collapses middle pages', () => {
  assert.match(paginationSource, /'ellipsis-start'/)
  assert.match(paginationSource, /'ellipsis-end'/)
  assert.match(paginationSource, /catalog-pagination-ellipsis/)
})

test('directory pagination is crawlable and declares adjacent page relationships', () => {
  assert.match(paginationSource, /<RouterLink/)
  assert.match(paginationSource, /rel="prev"/)
  assert.match(paginationSource, /rel="next"/)
  assert.doesNotMatch(paginationSource, /@click="changePage/)
  assert.match(pageSeoSource, /rel: 'prev'/)
  assert.match(pageSeoSource, /rel: 'next'/)
  assert.match(productCatalogPageSource, /previousPath:/)
  assert.match(productCatalogPageSource, /nextPath:/)
  assert.match(newsPageSource, /previousPath:/)
  assert.match(deliveryCasesPageSource, /nextPath:/)
})

test('product pagination gives every indexable page a unique localized SEO description', () => {
  assert.match(productCatalogPageSource, /'zh-CN': ` 第 \$\{page\.value\} 页。`/)
  assert.match(productCatalogPageSource, /en: ` Page \$\{page\.value\}\.`/)
  assert.match(productCatalogPageSource, /id: ` Halaman \$\{page\.value\}\.`/)
  assert.match(productCatalogPageSource, /productSeoCopy\.value\}\$\{pageDescriptionSuffix\.value\}/)
})

test('other directory pagination also appends a localized page number to SEO descriptions', () => {
  for (const source of [newsPageSource, deliveryCasesPageSource]) {
    assert.match(source, /'zh-CN': ` 第 \$\{page\.value\} 页。`/)
    assert.match(source, /en: ` Page \$\{page\.value\}\.`/)
    assert.match(source, /id: ` Halaman \$\{page\.value\}\.`/)
    assert.match(source, /descriptions\[locale\.value\]\}\$\{pageDescriptionSuffix\.value\}/)
  }
})

test('directory pages reject pagination beyond the last result page', () => {
  assert.match(productCatalogPageSource, /page\.value > totalPages\.value[\s\S]*statusCode: 404/)
  assert.match(newsPageSource, /page\.value > totalPages\.value[\s\S]*statusCode: 404/)
  assert.match(deliveryCasesPageSource, /page\.value > totalPages\.value[\s\S]*statusCode: 404/)
})

test('product card images use native lazy loading', async () => {
  const cardSource = await readFile(new URL('../components/product/ProductCard.vue', import.meta.url), 'utf8')
  assert.match(cardSource, /loading="lazy"/)
})

test('product cards expose an SSR link before Vue hydration', async () => {
  const cardSource = await readFile(new URL('../components/product/ProductCard.vue', import.meta.url), 'utf8')
  const languageFixSource = await readFile(new URL('../../public/language-fix.js', import.meta.url), 'utf8')

  assert.match(cardSource, /class="product-card-link"/)
  assert.match(cardSource, /:to="publicProductPath\(product\)"/)
  assert.doesNotMatch(cardSource, /role="link"|router\.push|@click="openProductDetail"/)
  assert.doesNotMatch(languageFixSource, /product-card|detailLink/)
})

test('product cards warm one shared detail request before navigation', async () => {
  const cardSource = await readFile(new URL('../components/product/ProductCard.vue', import.meta.url), 'utf8')

  assert.match(cardSource, /getProduct\(`p-id-\$\{props\.product\.id\}`, \[publicProductSlug\(props\.product\)\]\)/)
  assert.match(cardSource, /@pointerenter="warmProductDetail"/)
  assert.match(cardSource, /@pointerdown="warmProductDetail"/)
  assert.match(cardSource, /:prefetch-on="\{ interaction: true \}"/)
})

test('client detail navigation waits only for the product request', () => {
  assert.match(productNuxtPageSource, /if \(import\.meta\.client\)[\s\S]*getProduct\(slug\.value\)/)
  assert.match(productNuxtPageSource, /return \{ product, categories: undefined \}/)
})

test('product detail redirects legacy slugs and publishes the name-based canonical path', async () => {
  const pageSource = await readFile(new URL('../pages/[locale]/products/[slug].vue', import.meta.url), 'utf8')
  const urlSource = await readFile(new URL('../utils/productUrl.ts', import.meta.url), 'utf8')
  const sitemapSource = await readFile(new URL('../server/utils/sitemap.ts', import.meta.url), 'utf8')
  const seoVerifierSource = await readFile(new URL('../../scripts/verify-seo.mjs', import.meta.url), 'utf8')
  const legacyRouteSource = await readFile(new URL('../pages/[locale]/products/[productId]/[slug].vue', import.meta.url), 'utf8')

  assert.match(urlSource, /product\.public_slug/)
  assert.match(urlSource, /endsWith\('\.html'\)/)
  assert.doesNotMatch(urlSource, /p-id-/)
  assert.match(urlSource, /products\/\$\{publicProductSlug\(product\)\}/)
  assert.doesNotMatch(urlSource, /products\/\$\{product\.id\}/)
  assert.match(pageSource, /`\/api\/products\/\$\{slug\.value\}`/)
  assert.doesNotMatch(pageSource, /productKey|p-id-/)
  assert.match(pageSource, /navigateTo\(canonicalPath, \{ redirectCode: 301, replace: true \}\)/)
  assert.match(pageSource, /path: currentProduct \? publicProductPath\(currentProduct\)/)
  assert.match(sitemapSource, /item\.public_slug/)
  assert.doesNotMatch(sitemapSource, /p-id-/)
  assert.match(sitemapSource, /`\/products\/\$\{slug\}`/)
  assert.doesNotMatch(sitemapSource, /`\/products\/\$\{item\.id\}/)
  assert.match(sitemapSource, /\/products\/sitemap/)
  assert.match(sitemapSource, /new Map<string, SitemapPage>\(\)/)
  assert.match(sitemapSource, /uniqueProductPages\(products\)/)
  assert.ok(seoVerifierSource.includes("/\\/products\\/[^/]+\\.html$/"))
  assert.ok(seoVerifierSource.includes("/\\/(?:id|en|zh-cn)\\/products\\/[^/?#]+\\.html$/"))
  assert.match(legacyRouteSource, /\/api\/products\/p-id-\$\{productId\}/)
  assert.match(legacyRouteSource, /redirectCode: 301/)
  assert.match(legacyRouteSource, /publicProductPath\(product\.value\)/)
})

test('product-facing title stays clean while identity details show the product code', async () => {
  const purchasePanelSource = await readFile(new URL('../components/product-detail/ProductPurchasePanel.vue', import.meta.url), 'utf8')
  const cardSource = await readFile(new URL('../components/product/ProductCard.vue', import.meta.url), 'utf8')

  assert.doesNotMatch(productNuxtPageSource, /productCodeLabel|product\.value\.product_code/)
  assert.match(productDetailSource, /:product-name="productName"/)
  assert.match(productDetailSource, /:product-code="product\.product_code"/)
  assert.match(productDetailSource, /:product-code-label="t\('detail\.productCode'\)"/)
  assert.doesNotMatch(productDetailSource, /product-name="`\$\{productName\}[^\n]*product_code/)
  assert.match(purchasePanelSource, /productCodeLabel/)
  assert.match(purchasePanelSource, /selectedCode/)
  assert.match(purchasePanelSource, /categoryLabel[\s\S]*productCodeLabel[\s\S]*modelLabel/)
  assert.doesNotMatch(cardSource, /localizedProduct\.category\.name \}\} · \{\{ product\.product_code/)
})

test('product cards keep application scenarios out of the catalog summary', async () => {
  const cardSource = await readFile(new URL('../components/product/ProductCard.vue', import.meta.url), 'utf8')

  assert.match(cardSource, /splitProductSummary\(localizedProduct\.value\.summary\)/)
  assert.match(cardSource, /\{\{ productSummary\.functionalSummary \}\}/)
  assert.doesNotMatch(cardSource, /\{\{ localizedProduct\.summary \}\}/)
})

test('product social and gallery images have descriptive alt text', async () => {
  const pageSource = await readFile(new URL('../pages/[locale]/products/[slug].vue', import.meta.url), 'utf8')
  const gallerySource = await readFile(new URL('../components/product-detail/ProductGallery.vue', import.meta.url), 'utf8')
  const seoSource = await readFile(new URL('../composables/usePageSeo.ts', import.meta.url), 'utf8')

  assert.match(pageSource, /imageAlt: localizedName\.value/)
  assert.match(seoSource, /ogImageAlt: socialImageAlt/)
  assert.match(seoSource, /twitterImageAlt: socialImageAlt/)
  assert.match(gallerySource, /:alt="`\$\{productName\} - \$\{index \+ 1\}`"/)
  assert.doesNotMatch(gallerySource, /<img[^>]+alt=""/)
})

test('product selection uses the native checkbox across the full visible control', () => {
  const inputStyles = styleSource.match(/\.product-select-control input \{[\s\S]*?\n\}/)?.[0] ?? ''
  const indicatorStyles = styleSource.match(/\.product-select-control span \{[\s\S]*?\n\}/)?.[0] ?? ''
  assert.match(inputStyles, /inset:\s*0/)
  assert.match(inputStyles, /width:\s*100%/)
  assert.match(inputStyles, /height:\s*100%/)
  assert.doesNotMatch(inputStyles, /pointer-events:\s*none/)
  assert.match(indicatorStyles, /pointer-events:\s*none/)
})

test('homepage category rail and grid render database-backed localized names', () => {
  assert.match(homeSource, /localizeSolution, localizedCategory \} = useLocalizedContent\(\)/)
  assert.match(homeSource, /name: localizedCategory\(category\)\.name/)
  assert.match(homeSource, /name: localizedCategory\(child\)\.name/)
  assert.doesNotMatch(homeSource, /text\(`categories\.\$\{(?:category|child)\.slug\}`/)
})

test('product detail breadcrumbs render database-backed localized category names', () => {
  assert.match(productDetailSource, /const \{ localizeProduct, localizedCategory \} = useLocalizedContent\(\)/)
  assert.match(productDetailSource, /return path\.map\(category => localizedCategory\(category\)\)/)
  assert.match(productDetailSource, /\{\{ category\.name \}\}/)
  assert.doesNotMatch(productDetailSource, /text\(`categories\.\$\{category\.slug\}`/)
})

test('product detail passes normalized structured logistics items to the assurance panel', () => {
  assert.match(productDetailSource, /resolveProductFulfillmentItems\(localizedProduct\.value\)/)
  assert.match(productDetailSource, /:logistics-items="fulfillmentItems"/)
  assert.doesNotMatch(productDetailSource, /:logistics-items="fulfillmentMethods"/)
})

test('product detail moves only the application scenario into the product description section', async () => {
  const purchasePanelSource = await readFile(new URL('../components/product-detail/ProductPurchasePanel.vue', import.meta.url), 'utf8')

  assert.match(productDetailSource, /splitProductSummary\(productSummary\.value\)/)
  assert.match(productDetailSource, /:summary="productSummarySections\.functionalSummary"/)
  assert.match(productDetailSource, /:intro="productSummarySections\.applicationScenario"/)
  assert.match(productDetailSource, /:content="productDescription"/)
  assert.match(purchasePanelSource, /v-if="summary\.trim\(\)" class="purchase-summary-block"/)
  assert.doesNotMatch(productDetailSource, /:blocks="product\.detail_blocks/)
})

test('product procurement process prefers product configuration and keeps four defaults', () => {
  assert.match(productDetailSource, /localizedProduct\.value\?\.process_items/)
  assert.match(productDetailSource, /\.slice\(0, 4\)/)
  assert.match(productDetailSource, /if \(configured\.length\) return configured/)
  for (const key of ['processRequirementTitle', 'processFactoryTitle', 'processDocumentTitle', 'processShipmentTitle']) {
    assert.match(productDetailSource, new RegExp(key))
  }
  assert.doesNotMatch(productDetailSource, /processFactoryTitle[\s\S]*processFactoryTitle[\s\S]*processDocumentTitle/)
})
