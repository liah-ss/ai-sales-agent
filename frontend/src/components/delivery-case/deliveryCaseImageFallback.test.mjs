import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const cardSource = await readFile(new URL('./DeliveryCaseCard.vue', import.meta.url), 'utf8')
const detailSource = await readFile(new URL('../../views/DeliveryCaseDetailView.vue', import.meta.url), 'utf8')

test('case card uses responsive COS thumbnails and native lazy loading', () => {
  assert.match(cardSource, /resolveResponsiveAsset\(props\.deliveryCase\.thumbnail_url/)
  assert.match(cardSource, /:srcset="thumbnail\.srcset/)
  assert.match(cardSource, /sizes="\(max-width: 720px\) 100vw, 400px"/)
  assert.match(cardSource, /loading="lazy"/)
})

test('case detail prefers the first body image and falls back to the legacy image', () => {
  assert.match(detailSource, /image \|\| deliveryCase\.value\?\.thumbnail_url/)
})
