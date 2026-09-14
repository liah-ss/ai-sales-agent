import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = file => readFile(new URL(file, import.meta.url), 'utf8')

test('purchase panel renders every derived price tier', async () => {
  const value = await source('./ProductPurchasePanel.vue')
  assert.match(value, /v-for="\(tier, index\) in priceBreaks"/)
  assert.match(value, /tier\.quantity/)
  assert.match(value, /tier\.price/)
})

test('purchase panel uses shared typography for product labels and values', async () => {
  const value = await source('./ProductPurchasePanel.vue')
  assert.equal((value.match(/class="product-info-label"/g) ?? []).length, 6)
  assert.match(value, /purchase-summary product-info-value/)
  assert.match(value, /<span class="product-info-value">\{\{ highlight \}\}<\/span>/)
  assert.match(value, /\.product-info-label \{[\s\S]*font-size:\s*14px;[\s\S]*font-weight:\s*850;/)
  assert.match(value, /\.product-info-value \{[\s\S]*font-size:\s*14px;[\s\S]*font-weight:\s*700;/)
})

test('assurance panel renders logistics name and optional copy', async () => {
  const value = await source('./ProductAssurancePanel.vue')
  assert.match(value, /item\.name/)
  assert.match(value, /item\.copy/)
})

test('product detail content renders the description through RichContent', async () => {
  const value = await source('./ProductDetailContent.vue')
  assert.match(value, /contentIsHtml/)
  assert.match(value, /<RichContent[\s\S]*v-if="content\.trim\(\) && contentIsHtml"[\s\S]*:html="content"/)
  assert.match(value, /preserve-authored-html/)
  assert.doesNotMatch(value, /ProductDetailBlock|blocks:/)
})

test('product detail content renders the application summary as plain introductory text', async () => {
  const value = await source('./ProductDetailContent.vue')
  assert.match(value, /v-if="intro\?\.trim\(\)" class="product-description-intro"/)
  assert.match(value, /\{\{ intro \}\}/)
  assert.match(value, /\.product-description-intro,\s*\n\.plain-product-description \{[\s\S]*font-size:\s*16px;[\s\S]*font-weight:\s*400;[\s\S]*line-height:\s*1\.9;/)
})

test('plain product descriptions remain plain text without inferred headings', async () => {
  const value = await source('./ProductDetailContent.vue')
  assert.match(value, /v-else-if="content\.trim\(\)" class="rich-detail-content plain-product-description"/)
  assert.match(value, /\.plain-product-description \{[\s\S]*white-space:\s*pre-wrap;/)
  assert.doesNotMatch(value, /classifyRichContent|rich-block-heading/)
})

test('product detail divider spans the full section independently of readable content width', async () => {
  const value = await source('./ProductDetailContent.vue')
  assert.match(value, /<div class="rich-detail-divider">[\s\S]*<RichContent/)
  assert.match(value, /\.rich-detail-divider \{[\s\S]*width:\s*100%;[\s\S]*border-top:/)
  assert.match(value, /\.rich-detail-content \{[\s\S]*width:\s*100%;[\s\S]*max-width:\s*none;/)
  assert.doesNotMatch(value, /\.rich-detail-content \{[\s\S]*border-top:/)
})
