import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const nuxtConfigSource = await readFile(new URL('../nuxt.config.ts', import.meta.url), 'utf8')
const pageViewPluginSource = await readFile(new URL('./plugins/google-page-view.client.ts', import.meta.url), 'utf8')
const baiduPluginSource = await readFile(new URL('./plugins/baidu-analytics.client.ts', import.meta.url), 'utf8')

test('loads Google Tag Manager after a real interaction or outside the initial render window', async () => {
  const gtmPluginSource = await readFile(new URL('./plugins/google-tag-manager.client.ts', import.meta.url), 'utf8')
  assert.match(gtmPluginSource, /const GTM_CONTAINER_ID = 'GTM-K55FPT6T'/)
  assert.match(gtmPluginSource, /googletagmanager\.com\/gtm\.js\?id=/)
  assert.match(gtmPluginSource, /GTM_FALLBACK_DELAY_MS = 15_000/)
  assert.match(gtmPluginSource, /\['pointerdown', 'keydown', 'touchstart'\]/)
  assert.match(gtmPluginSource, /window\.setTimeout\(start, GTM_FALLBACK_DELAY_MS\)/)
  assert.doesNotMatch(nuxtConfigSource, /google-tag-loader/)
  assert.doesNotMatch(nuxtConfigSource, /google-tag-manager-noscript/)
})

test('installs Baidu Analytics at the end of every document', () => {
  assert.match(baiduPluginSource, /hm\.baidu\.com\/hm\.js\?1fe5a4264130c1259ba1ed81cfbad7ef/)
  assert.match(baiduPluginSource, /document\.createElement\('script'\)/)
  assert.match(baiduPluginSource, /document\.body\.append\(script\)/)
  assert.match(baiduPluginSource, /window\.setTimeout\(loadBaiduAnalytics, 1_000\)/)
  assert.doesNotMatch(nuxtConfigSource, /hm\.baidu\.com\/hm\.js/)
})

test('allows crawlers to see search-page noindex directives', async () => {
  const robotsSource = await readFile(new URL('./server/routes/robots.txt.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(robotsSource, /Disallow: \/\*\/search/)
})

test('reports client-side Nuxt navigations after the destination page finishes', () => {
  assert.match(pageViewPluginSource, /nuxtApp\.hook\('page:finish'/)
  assert.match(pageViewPluginSource, /event: 'virtual_page_view'/)
  assert.match(pageViewPluginSource, /gtag\?\.\('event', 'page_view'/)
  assert.match(pageViewPluginSource, /page_location: window\.location\.href/)
  assert.match(pageViewPluginSource, /page_title: document\.title/)
  assert.match(pageViewPluginSource, /if \(route\.fullPath === trackedPath\) return/)
  assert.match(pageViewPluginSource, /await nextTick\(\)/)
  assert.match(pageViewPluginSource, /requestAnimationFrame/)
  assert.match(pageViewPluginSource, /router\.currentRoute\.value\.fullPath !== destinationPath/)
  assert.match(pageViewPluginSource, /waitForDestinationMetadata/)
  assert.match(pageViewPluginSource, /!\/\^Memuat\\b\/i\.test\(title\)/)
})
