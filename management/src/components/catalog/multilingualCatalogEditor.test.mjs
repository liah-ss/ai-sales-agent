import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(name) {
  return readFile(new URL(name, import.meta.url), 'utf8')
}

test('catalog editor exposes editable Chinese, Indonesian, and English panels', async () => {
  const editorSource = await source('./CatalogEditor.vue')
  const localeTabsSource = await source('./LocaleTabs.vue')

  assert.match(editorSource, /<LocaleTabs/)
  assert.match(editorSource, /<LocalizedCatalogFields/)
  assert.match(editorSource, /v-model="form\.translations\.en"/)
  assert.match(editorSource, /:locale="'en'"/)
  assert.match(localeTabsSource, /Bahasa Indonesia/)
  assert.match(localeTabsSource, /English/)
})

test('translated catalog panels reuse Chinese media without exposing upload controls', async () => {
  const editorSource = await source('./CatalogEditor.vue')
  const localizedSource = await source('./LocalizedCatalogFields.vue')

  assert.match(editorSource, /const mediaImages = computed/)
  assert.match(editorSource, /:media-images="mediaImages"/)
  assert.match(localizedSource, /:images="mediaImages \?\? \[\]"/)
  assert.match(editorSource, /v-model="form\.translations\.en"/)
  assert.match(localizedSource, /:readonly="true"/)
})

test('translated product fields follow the Chinese content order and include all translatable sections', async () => {
  const localizedSource = await source('./LocalizedCatalogFields.vue')
  const description = localizedSource.indexOf('v-model="form.description"')
  const media = localizedSource.indexOf(':images="mediaImages ?? []"')
  const fulfillment = localizedSource.indexOf('v-model="form.fulfillment_items"')
  const assurance = localizedSource.indexOf('v-model="form.assurance_items"')
  const highlights = localizedSource.indexOf('v-model="form.highlights"')
  const specifications = localizedSource.indexOf('v-model="form.specifications"')
  const process = localizedSource.indexOf('v-model="form.process_items"')
  const seo = localizedSource.indexOf('<SeoGeoFieldsEditor')

  assert.ok(description < media)
  assert.ok(media < fulfillment)
  assert.ok(fulfillment < assurance)
  assert.ok(assurance < highlights)
  assert.ok(highlights < specifications)
  assert.ok(specifications < process)
  assert.ok(process < seo)
})

test('rich editor blocks base64 images and destroys its editor instance', async () => {
  const richEditorSource = await source('./RichTextEditor.vue')

  assert.match(richEditorSource, /base64LimitSize:\s*0/)
  assert.match(richEditorSource, /onBeforeUnmount/)
  assert.match(richEditorSource, /editorRef\.value\?\.destroy\(\)/)
})

test('rich editor preserves Word HTML paste and the catalog uses one product detail field', async () => {
  const richEditorSource = await source('./RichTextEditor.vue')
  const catalogSource = await source('./CatalogEditor.vue')

  assert.match(richEditorSource, /customPaste/)
  assert.match(richEditorSource, /dangerouslyInsertHtml/)
  assert.match(catalogSource, /<span>商品详情<\/span>/)
  assert.doesNotMatch(catalogSource, /ProductDetailContentEditor|商品详情内容|detailBlocks/)
})

test('rich editors are not wrapped in labels that reactivate the first toolbar menu', async () => {
  const catalogSource = await source('./CatalogEditor.vue')
  const localizedSource = await source('./LocalizedCatalogFields.vue')

  assert.doesNotMatch(catalogSource, /<label>[^<\n]*\s*<RichTextEditor/)
  assert.doesNotMatch(localizedSource, /<label>[^<\n]*\s*<RichTextEditor/)
  assert.match(catalogSource, /class="rich-editor-field"/)
  assert.match(localizedSource, /class="rich-editor-field"/)
})
