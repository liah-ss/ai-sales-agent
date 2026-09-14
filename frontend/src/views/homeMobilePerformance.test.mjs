import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const styleSource = await readFile(new URL('../style.css', import.meta.url), 'utf8')
const nuxtConfigSource = await readFile(new URL('../../nuxt.config.ts', import.meta.url), 'utf8')
const homePageSource = await readFile(new URL('../pages/[locale]/index.vue', import.meta.url), 'utf8')
const homeViewSource = await readFile(new URL('./HomeView.vue', import.meta.url), 'utf8')

test('mobile carousel controls keep a 48px touch target without changing the visible dot size', () => {
  assert.match(styleSource, /@media \(max-width: 768px\) \{[\s\S]*?\.banner-dot-row button,[\s\S]*?\.banner-dot-row button\.active[\s\S]*?width:\s*48px;[\s\S]*?height:\s*48px;[\s\S]*?border:\s*18px solid transparent;/)
})

test('the initial document preconnects to the image origin used by the LCP banner', () => {
  assert.match(nuxtConfigSource, /rel: 'preconnect', href: assetBaseUrl, crossorigin: ''/)
  assert.match(nuxtConfigSource, /rel: 'dns-prefetch', href: assetBaseUrl/)
})

test('the LCP banner declares the actual source image ratio', async () => {
  assert.match(homeViewSource, /class="banner-carousel-image"[\s\S]*?width="1600"[\s\S]*?height="413"/)
})

test('the SSR head preloads the same responsive LCP source used by the hero', () => {
  assert.match(homePageSource, /rel: 'preload'/)
  assert.match(homePageSource, /as: 'image'/)
  assert.match(homePageSource, /imagesrcset: heroImage\.value\.srcset/)
  assert.match(homePageSource, /imagesizes: '\(max-width: 1024px\) 100vw, 834px'/)
  assert.match(homePageSource, /quality: 76/)
  assert.match(homeViewSource, /quality: 76/)
})

test('homepage reuses solutions already present in the home response', () => {
  assert.doesNotMatch(homePageSource, /\$fetch<SolutionSummary\[]>\('\/api\/solutions'/)
  assert.match(homePageSource, /const initialSolutions = initialHome\?\.solutions \?\? \[]/)
})
