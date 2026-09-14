import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const styleSource = await readFile(new URL('./style.css', import.meta.url), 'utf8')
const headerSource = await readFile(new URL('./components/layout/AppHeader.vue', import.meta.url), 'utf8')
const footerSource = await readFile(new URL('./components/layout/AppFooter.vue', import.meta.url), 'utf8')
const homeSource = await readFile(new URL('./views/HomeView.vue', import.meta.url), 'utf8')

test('defines the compact professional type scale', () => {
  assert.match(styleSource, /--font-xs:\s*12px/)
  assert.match(styleSource, /--font-sm:\s*13px/)
  assert.match(styleSource, /--font-body:\s*14px/)
  assert.match(styleSource, /--font-body-lg:\s*15px/)
  assert.match(styleSource, /--font-card-title:\s*18px/)
  assert.match(styleSource, /--font-process-number:\s*20px/)
  assert.match(styleSource, /--font-section-title:\s*28px/)
  assert.match(styleSource, /--font-page-title:\s*36px/)
  assert.match(styleSource, /--font-hero-title:\s*40px/)
})

test('defines responsive content and shell widths', () => {
  assert.match(styleSource, /--site-layout-max:\s*1265px/)
  assert.match(styleSource, /--site-content-max:\s*var\(--site-layout-max\)/)
  assert.match(styleSource, /--site-shell-max:\s*var\(--site-layout-max\)/)
  assert.match(styleSource, /--site-gutter:\s*20px/)
})

test('desktop header, navigation, pages, and footer share one outer container', () => {
  const canonicalLayer = styleSource.slice(styleSource.indexOf('Canonical public style system'))
  assert.match(canonicalLayer, /\.site-content-container,[\s\S]*?\.news-page-inner[\s\S]*?width:\s*min\(var\(--site-layout-max\),\s*calc\(100% - 2 \* var\(--site-gutter\)\)\)/)
  assert.match(canonicalLayer, /\.site-header-inner,[\s\S]*?\.site-footer-inner[\s\S]*?width:\s*min\(var\(--site-layout-max\),\s*calc\(100% - 2 \* var\(--site-gutter\)\)\)/)
})

test('desktop header and homepage hero use the same column lines', () => {
  const canonicalLayer = styleSource.slice(styleSource.indexOf('Canonical public style system'))
  assert.match(canonicalLayer, /--home-category-column:\s*240px/)
  assert.match(canonicalLayer, /--home-assurance-column:\s*280px/)
  assert.match(canonicalLayer, /--home-grid-gap:\s*20px/)
  assert.match(canonicalLayer, /\.header-main-inner\s*\{[\s\S]*?grid-template-columns:\s*var\(--home-category-column\)\s+minmax\(0,\s*1fr\)/)
  assert.match(canonicalLayer, /\.procurement-hero\s*\{[\s\S]*?grid-template-columns:\s*var\(--home-category-column\)\s+minmax\(0,\s*1fr\)\s+var\(--home-assurance-column\)/)
  assert.match(canonicalLayer, /\.site-nav \.category-tab\s*\{[\s\S]*?width:\s*var\(--home-category-column\)/)
})

test('header and footer expose constrained inner wrappers', () => {
  assert.match(headerSource, /class="site-header-inner header-top-inner"/)
  assert.match(headerSource, /class="site-header-inner header-main-inner"/)
  assert.match(headerSource, /class="site-header-inner site-nav-inner"/)
  assert.match(footerSource, /class="site-footer-inner"/)
})

test('primary navigation hides on downward scroll and returns on upward scroll', () => {
  assert.match(headerSource, /const navHidden = shallowRef\(false\)/)
  assert.match(headerSource, /window\.addEventListener\('scroll', updateNavVisibility/)
  assert.match(headerSource, /window\.removeEventListener\('scroll', updateNavVisibility\)/)
  assert.match(headerSource, /let navTransitionLocked = false/)
  assert.match(headerSource, /window\.setTimeout\(\(\) => \{[\s\S]*?navTransitionLocked = false/)
  assert.match(headerSource, /:class="\{ 'nav-hidden': navHidden \}"/)
  const canonicalLayer = styleSource.slice(styleSource.indexOf('Canonical public style system'))
  assert.match(canonicalLayer, /\.site-header\.nav-hidden \.site-nav\s*\{[\s\S]*?max-height:\s*0/)
})

test('canonical category hover uses brand blue rather than market red', () => {
  const markerIndex = styleSource.indexOf('Canonical public style system')
  assert.notEqual(markerIndex, -1)
  const canonicalLayer = styleSource.slice(markerIndex)
  assert.match(canonicalLayer, /\.rail-category:hover[\s\S]*?color:\s*var\(--market-blue\)/)
  assert.match(canonicalLayer, /\.rail-subcategory:hover[\s\S]*?background:\s*#eef5f7/)
  assert.doesNotMatch(canonicalLayer, /var\(--market-red(?:-dark)?\)/)
})

test('category subpanel stays inside tablet and mobile layouts', () => {
  const canonicalLayer = styleSource.slice(styleSource.indexOf('Canonical public style system'))
  assert.match(canonicalLayer, /@media \(max-width: 1024px\)[\s\S]*?\.rail-subpanel\s*\{[\s\S]*?left:\s*auto;[\s\S]*?right:\s*0;/)
  assert.match(canonicalLayer, /@media \(max-width: 768px\)[\s\S]*?\.category-rail\s*\{[\s\S]*?min-height:\s*0;/)
  assert.match(canonicalLayer, /@media \(max-width: 768px\)[\s\S]*?\.rail-subpanel\s*\{[\s\S]*?position:\s*static;/)
})

test('canonical layer maps shared page roles to typography tokens', () => {
  const canonicalLayer = styleSource.slice(styleSource.indexOf('Canonical public style system'))
  assert.match(canonicalLayer, /\.request-stage h1[\s\S]*?font-size:\s*var\(--font-hero-title\)/)
  assert.match(canonicalLayer, /\.procurement-heading h2[\s\S]*?font-size:\s*var\(--font-section-title\)/)
  assert.match(canonicalLayer, /\.product-card h3[\s\S]*?font-size:\s*var\(--font-card-title\)/)
})

test('homepage category directory follows the application scenario card layout', () => {
  assert.match(homeSource, /function categoryVisual\(/)
  assert.match(homeSource, /transformer-accessory/)
  assert.match(homeSource, /switchgear-cabinet/)
  assert.match(homeSource, /class="category-tile-summary"/)
  assert.match(homeSource, /class="category-tile-action"/)
  const canonicalLayer = styleSource.slice(styleSource.indexOf('Canonical public style system'))
  assert.match(canonicalLayer, /\.category-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,[\s\S]*?grid-auto-rows:\s*1fr/)
  assert.match(canonicalLayer, /\.category-tile\s*\{[\s\S]*?justify-items:\s*center;[\s\S]*?text-align:\s*center;/)
  assert.doesNotMatch(canonicalLayer, /\.category-tile:nth-last-child\(2\):nth-child\(4n \+ 1\)/)
  assert.match(canonicalLayer, /\.category-tile-icon\.tone-transformer-accessory/)
  assert.match(canonicalLayer, /\.category-tile-icon\.tone-switchgear-cabinet/)
})
