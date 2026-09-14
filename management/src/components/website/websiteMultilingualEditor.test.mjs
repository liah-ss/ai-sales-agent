import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const view = readFileSync(new URL('../../views/WebsiteConfigView.vue', import.meta.url), 'utf8')
const contentEditor = readFileSync(new URL('./ContentEditorPanel.vue', import.meta.url), 'utf8')
const bannerEditor = readFileSync(new URL('./BannerEditor.vue', import.meta.url), 'utf8')
const homeEditor = readFileSync(new URL('./HomeSectionSorter.vue', import.meta.url), 'utf8')
const identityEditor = readFileSync(new URL('../settings/SiteIdentityPanel.vue', import.meta.url), 'utf8')

test('website content uses one shared locale switcher across editors', () => {
  assert.match(view, /WebsiteLocaleTabs v-model="activeLocale"/)
  assert.match(view, /:locale="activeLocale"/)
  assert.match(contentEditor, /headlineTranslations/)
  assert.match(contentEditor, /bodyTranslations/)
  assert.match(bannerEditor, /titleTranslations/)
  assert.match(homeEditor, /locale: WebsiteLocale/)
})

test('website editors no longer expose SEO controls', () => {
  for (const source of [contentEditor, identityEditor]) {
    assert.doesNotMatch(source, /SEO 标题|SEO 描述|与 SEO/)
  }
})
