import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('product pages use localized controls and structured translations', async () => {
  const [productsView, detailView, purchasePanel, localizedContent, footer] = await Promise.all([
    readFile(new URL('./ProductsView.vue', import.meta.url), 'utf8'),
    readFile(new URL('./ProductDetailView.vue', import.meta.url), 'utf8'),
    readFile(new URL('../components/product-detail/ProductPurchasePanel.vue', import.meta.url), 'utf8'),
    readFile(new URL('../data/localizedContent.ts', import.meta.url), 'utf8'),
    readFile(new URL('../components/layout/AppFooter.vue', import.meta.url), 'utf8'),
  ])

  assert.doesNotMatch(productsView, /aria-label="移除类目筛选"/)
  assert.match(productsView, /headlineTranslations\?\.\[locale\.value\] \|\| t\('products\.title'\)/)
  assert.match(productsView, /summaryTranslations\?\.\[locale\.value\] \|\| t\('products\.subtitle'\)/)
  assert.doesNotMatch(purchasePanel, />规格选择</)
  assert.match(detailView, /:variants="localizedProduct\?\.variants \?\? \[\]"/)
  assert.match(localizedContent, /resolveStrictLocalizedRecord\(product/)
  assert.match(localizedContent, /'fulfillment_items'/)
  assert.match(footer, /if \(locale\.value === 'en'/)
  assert.match(footer, /return t\('footer\.description'\)/)
})
