import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('./HomeView.vue', import.meta.url), 'utf8')
const railSource = await readFile(new URL('../components/home/HomeCategoryRail.vue', import.meta.url), 'utf8')
const styleSource = await readFile(new URL('../style.css', import.meta.url), 'utf8')

test('homepage category rail replaces the final category with a localized more action', () => {
  assert.match(source, /const heroCategoryTiles = computed<CategoryTile\[]>/)
  assert.match(source, /categoryTiles\.value\.slice\(0, 9\)/)
  assert.match(source, /name: copy\.value\.moreCategories/)
  assert.match(source, /:categories="heroCategoryTiles"/)
  assert.match(railSource, /v-for="category in categories"/)
  assert.match(railSource, /<Ellipsis class="category-more-icon"/)
})

test('more action opens the unfiltered product center', () => {
  assert.match(railSource, /v-if="category\.isMore"[\s\S]*to="\/products"/)
  assert.match(railSource, /`\/products\/category\/\$\{encodeURIComponent\(category\.slug\)\}`/)
  assert.match(railSource, /`\/products\/category\/\$\{encodeURIComponent\(child\.slug\)\}`/)
})

test('more action has Chinese, English, and Indonesian labels', () => {
  assert.match(source, /moreCategories: 'More'/)
  assert.match(source, /moreCategories: '更多'/)
  assert.match(source, /moreCategories: 'Lainnya'/)
})

test('category rail does not show redundant right arrows', () => {
  assert.match(styleSource, /\.rail-category \.rail-category-main-button::after \{\s*display:\s*none;/)
})

test('more action uses the same row surface as the other categories', () => {
  assert.doesNotMatch(styleSource, /\.rail-category\.more-category\s*\{/)
  assert.match(styleSource, /\.category-more-icon \{[\s\S]*color:\s*#6f7782;/)
})
