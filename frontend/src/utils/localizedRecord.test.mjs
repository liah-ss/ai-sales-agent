import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { resolveLocalizedRecord, resolveStrictLocalizedRecord } from './localizedRecord.ts'

test('requested locale wins and missing translated fields fall back to Chinese', () => {
  const result = resolveLocalizedRecord({
    title: '中文',
    summary: '中文摘要',
    translations: { id: { title: 'Indonesia', summary: '' } },
  }, 'id', ['title', 'summary'])

  assert.equal(result.title, 'Indonesia')
  assert.equal(result.summary, '中文摘要')
})

test('strict localization never leaks master-language values into another locale', () => {
  const result = resolveStrictLocalizedRecord({
    name: '中文产品',
    summary: '中文摘要',
    highlights: ['中文亮点'],
    translations: { id: { name: 'Produk Indonesia', summary: '' } },
  }, 'id', ['name', 'summary', 'highlights'])

  assert.equal(result.name, 'Produk Indonesia')
  assert.equal(result.summary, '')
  assert.deepEqual(result.highlights, [])
})

test('strict localization preserves the complete source record when a locale has no content', () => {
  const result = resolveStrictLocalizedRecord({
    name: '中文产品',
    summary: '完整中文资料',
    highlights: ['参数完整'],
    translations: {},
  }, 'id', ['name', 'summary', 'highlights'])

  assert.equal(result.name, '中文产品')
  assert.equal(result.summary, '完整中文资料')
  assert.deepEqual(result.highlights, ['参数完整'])
})

test('business localization functions use the unified resolver', async () => {
  const source = await readFile(new URL('../data/localizedContent.ts', import.meta.url), 'utf8')

  assert.match(source, /resolveLocalizedRecord/)
  assert.doesNotMatch(source, /newsTranslations\[locale\.value\]/)
  assert.doesNotMatch(source, /solutionTitleTranslations\[locale\.value\]/)
  assert.doesNotMatch(source, /deliveryCaseTranslations\[locale\.value\]/)
})
