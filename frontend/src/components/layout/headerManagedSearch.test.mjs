import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const headerSource = await readFile(new URL('./AppHeader.vue', import.meta.url), 'utf8')
const i18nSource = await readFile(new URL('../../composables/useI18n.ts', import.meta.url), 'utf8')

test('header search placeholder follows managed multilingual website configuration', () => {
  assert.match(headerSource, /useWebsiteConfig\(\)/)
  assert.match(headerSource, /websiteConfig\.value\?\.searchSettings/)
  assert.match(headerSource, /placeholderTranslations\?\.\[locale\.value\]/)
  assert.match(headerSource, /:placeholder="searchPlaceholder"/)
})

test('Chinese primary navigation labels solutions as scenario solutions', () => {
  assert.match(i18nSource, /'zh-CN': \{[\s\S]*'nav\.solutions': '场景方案'/)
  assert.match(i18nSource, /en: \{[\s\S]*'nav\.solutions': 'Solutions'/)
  assert.match(i18nSource, /id: \{[\s\S]*'nav\.solutions': 'Solusi'/)
})
