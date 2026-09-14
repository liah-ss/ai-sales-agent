import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const imageManagerSource = await readFile(new URL('./ProductImageManager.vue', import.meta.url), 'utf8')
const catalogEditorSource = await readFile(new URL('./CatalogEditor.vue', import.meta.url), 'utf8')
const styleSource = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')

test('product image manager does not expose image paths', () => {
  assert.doesNotMatch(imageManagerSource, /v-model="imageText"/)
  assert.doesNotMatch(imageManagerSource, /placeholder="\/uploads\/images/)
})

test('product editor does not display the multi-variant JSON field', () => {
  assert.doesNotMatch(catalogEditorSource, />多规格 JSON</)
})

test('product editor uses functional-use and one product-detail field', () => {
  assert.match(catalogEditorSource, /<label>功能用途（应用场景）<textarea/)
  assert.match(catalogEditorSource, /<span>商品详情<\/span>/)
  assert.match(catalogEditorSource, /<RichTextEditor v-model="form\.description"/)
  assert.match(catalogEditorSource, /支持标题层级、正文、字号、颜色、对齐、列表、表格、链接和图片/)
  assert.doesNotMatch(catalogEditorSource, /ProductDetailContentEditor|商品详情内容|详情描述/)
})

test('product editor preserves untouched rich detail and legacy delivery methods', () => {
  assert.match(catalogEditorSource, /originalProductDescription/)
  assert.match(catalogEditorSource, /productDescriptionTouched/)
  assert.match(catalogEditorSource, /fulfillment_methods: fulfillmentItems\.map\(item => item\.name\)/)
  assert.match(catalogEditorSource, /normalizeProcessItems\(product\.process_items, false\)/)
})

test('product image manager uses the full editor width and keeps all actions visible', () => {
  assert.doesNotMatch(catalogEditorSource, /<div class="field-grid two">\s*<ProductImageManager/)
  const actionStyles = styleSource.match(/\.image-thumb-actions button \{[\s\S]*?\n\}/)?.[0] ?? ''
  assert.match(actionStyles, /width:\s*100%/)
})

test('delivery cases keep image upload but never expose cover controls or URL fields', () => {
  const deliveryCaseSection = catalogEditorSource.match(/<template v-else-if="kind === 'delivery-cases'">[\s\S]*?<\/template>\s*\n\s*<template v-else>/)?.[0] ?? ''
  assert.match(deliveryCaseSection, /<ContentImageUploader/)
  assert.match(deliveryCaseSection, /:allow-cover="false"/)
  assert.match(deliveryCaseSection, /@insert-image="insertContentImage"/)
  assert.doesNotMatch(deliveryCaseSection, /封面图 URL|交付地区|@set-cover/)
})
