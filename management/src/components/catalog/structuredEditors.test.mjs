import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = file => readFile(new URL(file, import.meta.url), 'utf8')

test('price editor enforces three tiers and keeps total and row visibility controls', async () => {
  const value = await source('./PriceTierEditor.vue')
  assert.match(value, /items\.length >= 3/)
  assert.match(value, /展示价格/)
  assert.match(value, /显示此档/)
  assert.match(value, /添加价格档位/)
})

test('new products hide prices by default', async () => {
  const value = await source('./CatalogEditor.vue')
  assert.match(value, /showPrices: false/)
  assert.match(value, /product\?\.show_surprise_only \?\? true/)
})

test('fulfillment, highlight, and specification editors expose structured row actions', async () => {
  const fulfillment = await source('./FulfillmentItemsEditor.vue')
  const highlights = await source('./HighlightsEditor.vue')
  const specs = await source('./SpecificationsEditor.vue')
  assert.match(fulfillment, /方式名称/)
  assert.match(fulfillment, /添加物流方式/)
  assert.match(highlights, /添加亮点/)
  assert.match(specs, /参数名/)
  assert.match(specs, /参数值/)
  for (const value of [fulfillment, highlights, specs]) {
    assert.match(value, /ArrowUp/)
    assert.match(value, /ArrowDown/)
    assert.match(value, /Trash2/)
  }
})

test('product editor exposes a four-item procurement process editor', async () => {
  const catalog = await source('./CatalogEditor.vue')
  const editor = await source('./ProcessItemsEditor.vue')
  assert.match(catalog, /<ProcessItemsEditor v-model="form\.processItems"/)
  assert.match(catalog, /process_items: cleanProcessItems\(form\.processItems\)/)
  assert.match(editor, /采购流程/)
  assert.match(editor, /items\.length >= 4/)
  assert.match(editor, /流程名称/)
  assert.match(editor, /流程说明/)
})

test('catalog and Indonesian forms use the reusable structured editors', async () => {
  const catalog = await source('./CatalogEditor.vue')
  const localized = await source('./LocalizedCatalogFields.vue')
  assert.match(catalog, /<PriceTierEditor/)
  assert.match(catalog, /<FulfillmentItemsEditor/)
  assert.match(catalog, /<HighlightsEditor/)
  assert.match(catalog, /<SpecificationsEditor/)
  assert.match(localized, /<FulfillmentItemsEditor/)
  assert.match(localized, /<HighlightsEditor/)
  assert.match(localized, /<SpecificationsEditor/)
})

test('rich text editor exposes the formatting controls needed for product details', async () => {
  const editor = await source('./RichTextEditor.vue')
  for (const toolbarKey of [
    'headerSelect',
    'fontSize',
    'fontFamily',
    'color',
    'lineHeight',
    'justifyLeft',
    'justifyCenter',
    'indent',
    'bulletedList',
    'insertTable',
    'uploadImage',
  ]) {
    assert.match(editor, new RegExp(`['"]${toolbarKey}['"]`))
  }
})
