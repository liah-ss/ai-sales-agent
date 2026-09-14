import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const homeSource = await readFile(new URL('./HomeView.vue', import.meta.url), 'utf8')
const styleSource = await readFile(new URL('../style.css', import.meta.url), 'utf8')

test('homepage exposes the active locale to hero rail styles', () => {
  assert.match(homeSource, /class="home-page procurement-home" :data-locale="locale"/)
})

test('homepage carousel uses the configured banner link with a safe product fallback', () => {
  assert.match(homeSource, /const activeBannerLink = computed/)
  assert.match(homeSource, /activeBanner\.value\?\.cta_url\?\.trim\(\) \|\| '\/products'/)
  assert.match(
    homeSource,
    /<LocalizedLink[\s\S]*class="banner-carousel-link"[\s\S]*:to="activeBannerLink"[\s\S]*:external="activeBannerLinkExternal"[\s\S]*prefetch/,
  )
  assert.doesNotMatch(homeSource, /openActiveBanner|heroBannerTarget|role="link"/)
  assert.match(styleSource, /\.banner-carousel-link \{[\s\S]*position:\s*absolute;[\s\S]*inset:\s*0;[\s\S]*z-index:\s*2;/)
  assert.match(styleSource, /\.banner-carousel-stage > \.banner-dot-row \{ z-index:\s*4; \}/)
})

test('managed banner media and links come from the SSR home response', () => {
  assert.match(homeSource, /const configuredBannerById = computed\(\(\) => new Map/)
  assert.match(homeSource, /const source = home\.value\?\.banners\.length \? home\.value\.banners : fallbackBanners\.value/)
  assert.match(homeSource, /The SSR home response is the single source for image, order and link/)
  assert.match(homeSource, /\{[\s\S]*?\.\.\.banner,[\s\S]*?title: configured\.titleTranslations/)
  assert.doesNotMatch(homeSource, /image_url: configured\./)
  assert.doesNotMatch(homeSource, /cta_url: configured\./)
})

test('English and Indonesian category names wrap instead of using one-line ellipsis', () => {
  assert.match(styleSource, /\.procurement-home\[data-locale="en"\] \.rail-category strong/)
  assert.match(styleSource, /\.procurement-home\[data-locale="id"\] \.rail-category strong/)
  assert.match(styleSource, /-webkit-line-clamp:\s*3/)
  assert.match(styleSource, /\.procurement-home\[data-locale="en"\] \.rail-tags,[\s\S]*display:\s*none/)
})

test('English and Indonesian hero rails receive additional reading width', () => {
  assert.match(styleSource, /\.procurement-home\[data-locale="en"\],[\s\S]*--home-category-column:\s*260px;/)
  assert.match(styleSource, /\.procurement-home\[data-locale="id"\][\s\S]*--home-assurance-column:\s*340px;/)
  assert.doesNotMatch(styleSource, /\.assurance-item strong,[\s\S]*?hyphens:\s*auto;/)
})

test('platform selling points use content-driven heights and top alignment', () => {
  assert.match(styleSource, /\.assurance-rail \{[\s\S]*grid-auto-rows:\s*auto;[\s\S]*align-content:\s*start;/)
  assert.match(styleSource, /\.assurance-item \{[\s\S]*height:\s*auto;[\s\S]*align-items:\s*start;/)
})

test('tablet and mobile breakpoints override the desktop hero columns', () => {
  const finalTabletRule = styleSource.lastIndexOf('@media (max-width: 1024px)')
  const finalMobileRule = styleSource.lastIndexOf('@media (max-width: 768px)')
  const desktopHeroRule = styleSource.lastIndexOf('.procurement-hero {', finalTabletRule - 1)

  assert.ok(finalTabletRule > desktopHeroRule)
  assert.ok(finalMobileRule > finalTabletRule)
  assert.match(styleSource.slice(finalTabletRule), /\.procurement-hero \{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\);/)
  assert.match(styleSource.slice(finalMobileRule), /\.assurance-rail \{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\);/)
})
