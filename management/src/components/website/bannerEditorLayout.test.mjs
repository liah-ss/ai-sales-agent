import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('./BannerEditor.vue', import.meta.url), 'utf8')

test('banner management follows the catalog table and modal editing pattern', () => {
  assert.match(source, /class="data-table banner-data-table"/)
  assert.match(source, /class="modal-panel banner-editor-modal"/)
  assert.match(source, /<th>标题 \/ 副标题<\/th>/)
  assert.match(source, /<th>状态<\/th>/)
  assert.doesNotMatch(source, /<th>跳转目标<\/th>|<th>展示端<\/th>/)
  assert.match(source, />\s*跳转链接\s*</)
  assert.match(source, /activeBanner\.linkUrl/)
  assert.match(source, /\{ linkUrl:/)
  assert.match(source, /function normalizeBannerLink/)
  assert.match(source, /@blur="normalizeBannerLink\(activeBanner, \$event\)"/)
  assert.doesNotMatch(source, />展示端\s*</)
  assert.match(source, /aria-label="编辑 Banner"/)
  assert.match(source, /aria-label="删除 Banner"/)
  assert.match(source, /保存中\.\.\.' : '保存'/)
  assert.doesNotMatch(source, /Banner 内容编辑|图片建议使用 16:9 横图|banner-editor-heading|banner-modal-delete/)
  assert.match(source, /<span>更换图片<\/span>/)
  assert.match(source, /:disabled="isSaving"/)
  assert.match(source, /class="banner-library-title">首页首屏资源/)
  assert.match(source, /<span>新增<\/span>/)
  assert.doesNotMatch(source, /Banner 列表|统一维护轮播图片/)
})

test('banner editor keeps existing update, upload, carousel and create contracts', () => {
  assert.match(source, /updateCarousel: \[patch: Partial<BannerCarouselSettings>\]/)
  assert.match(source, /upload: \[id: string, file: File\]/)
  assert.match(source, /emit\('add'\)/)
  assert.match(source, /emit\('remove', banner\.id\)/)
  assert.match(source, /emit\('save'\)/)
  assert.match(source, /function updateCarousel/)
  assert.match(source, /function toggleBanner/)
  assert.match(source, /window\.confirm/)
  assert.match(source, /emit\('update', banner\.id, \{ enabled: !banner\.enabled \}\)/)
  assert.match(source, /handleUpload\(activeBanner\.id, \$event\)/)
})

test('banner imagery uses the production wide-banner dimensions', () => {
  assert.match(source, /\.banner-table-thumb \{[\s\S]*?aspect-ratio: 1920 \/ 413;/)
  assert.match(source, /\.banner-editor-preview \{[\s\S]*?aspect-ratio: 1920 \/ 413;/)
})
