import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const routerSource = await readFile(new URL('../router/index.ts', import.meta.url), 'utf8')
const headerSource = await readFile(new URL('../components/layout/AppHeader.vue', import.meta.url), 'utf8')
const footerSource = await readFile(new URL('../components/layout/AppFooter.vue', import.meta.url), 'utf8')
const appShellSource = await readFile(new URL('../components/layout/AppShell.vue', import.meta.url), 'utf8')
const explorerSource = await readFile(new URL('../components/faq/FaqExplorer.vue', import.meta.url), 'utf8')
const viewSource = await readFile(new URL('./FaqView.vue', import.meta.url), 'utf8')
const nuxtPageSource = await readFile(new URL('../pages/[locale]/faq.vue', import.meta.url), 'utf8')
const defaultLayoutSource = await readFile(new URL('../layouts/default.vue', import.meta.url), 'utf8')

test('help center is a first-level public route in desktop and mobile navigation', () => {
  assert.match(routerSource, /path: 'faq', name: 'faq'/)
  assert.match(headerSource, /to="\/faq"/)
  assert.match(footerSource, /to="\/faq"/)
})

test('spa locale follows the locale segment in direct help center URLs', () => {
  assert.match(appShellSource, /watch\([\s\S]+?route\.params\.locale/)
  assert.match(appShellSource, /normalizeLocale/)
  assert.match(appShellSource, /setLocale\(routeLocale\)/)
})

test('faq explorer supports search, category filtering and accessible accordion state', () => {
  assert.match(explorerSource, /v-model="query"/)
  assert.match(explorerSource, /activeCategory/)
  assert.match(explorerSource, /:aria-expanded="openItemId === item\.id"/)
  assert.match(explorerSource, /white-space: pre-line/)
})

test('faq conversion actions lead to contact and products through managed paths', () => {
  assert.match(viewSource, /:to="faq\.primaryPath"/)
  assert.match(viewSource, /:to="faq\.secondaryPath"/)
})

test('faq hero is text-only and status controls support all public locales', () => {
  assert.doesNotMatch(viewSource, /heroImageUrl|resolveOptimizedAssetUrl|backgroundImage/)
  assert.match(viewSource, /Loading the Help Center/)
  assert.match(viewSource, /Memuat Pusat Bantuan/)
  assert.match(viewSource, /Coba lagi/)
  assert.match(explorerSource, /Hapus pencarian/)
})

test('nuxt faq page emits FAQPage structured data', () => {
  assert.match(nuxtPageSource, /'@type': 'FAQPage'/)
  assert.match(nuxtPageSource, /acceptedAnswer/)
})

test('homepage SSR defers FAQ items until the help center is opened', () => {
  assert.match(defaultLayoutSource, /isHomePage/)
  assert.match(defaultLayoutSource, /faq: \{ \.\.\.websiteConfig\.faq, categories: \[\] \}/)
  assert.match(nuxtPageSource, /faq\.categories\.length === 0/)
  assert.match(nuxtPageSource, /await loadWebsiteConfig\(\)/)
})
