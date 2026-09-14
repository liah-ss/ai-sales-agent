import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('rich content renders server-sanitized html and keeps plain text fallback', async () => {
  const source = await readFile(new URL('./RichContent.vue', import.meta.url), 'utf8')

  assert.match(source, /v-html="html"/)
  assert.match(source, /plainText/)
  assert.match(source, /preserveAuthoredHtml/)
})

test('product, news, and delivery details use the shared rich content component', async () => {
  const files = [
    new URL('../product-detail/ProductDetailContent.vue', import.meta.url),
    new URL('../../views/NewsDetailView.vue', import.meta.url),
    new URL('../../views/DeliveryCaseDetailView.vue', import.meta.url),
  ]
  const sources = await Promise.all(files.map(file => readFile(file, 'utf8')))

  for (const source of sources) assert.match(source, /<RichContent/)
})

test('rich content renders paragraph-aware display blocks', async () => {
  const source = await readFile(new URL('./RichContent.vue', import.meta.url), 'utf8')

  assert.match(source, /classifyRichContent/)
  assert.match(source, /renderAuthoredHtml/)
  for (const className of [
    'rich-block-heading',
    'rich-block-list',
    'rich-block-labeled',
    'rich-block-pair',
    'rich-block-parameters',
    'rich-block-emphasis',
    'rich-block-paragraph',
  ]) {
    assert.match(source, new RegExp(className))
  }
})

test('rich content defines a contained desktop technical reading rhythm', async () => {
  const source = await readFile(new URL('./RichContent.vue', import.meta.url), 'utf8')

  assert.match(source, /max-width:\s*76ch/)
  assert.match(source, /font-size:\s*16px/)
  assert.match(source, /line-height:\s*1\.9/)
  assert.match(source, /overflow-wrap:\s*anywhere/)
  assert.match(source, /overflow-x:\s*auto/)
  assert.match(source, /:deep\(h1\)/)
  assert.match(source, /:deep\(h6\)/)
})
