import assert from 'node:assert/strict'
import { isIP } from 'node:net'

const requestBaseUrl = (process.env.SEO_BASE_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')
const baseUrl = (process.env.SEO_EXPECTED_SITE_URL || requestBaseUrl).replace(/\/$/, '')
const concurrency = Math.max(1, Number(process.env.SEO_CONCURRENCY) || 12)
const requestTimeoutMs = Math.max(1_000, Number(process.env.SEO_REQUEST_TIMEOUT_MS) || 20_000)
const requestOrigin = new URL(requestBaseUrl).origin
const canonicalOrigin = new URL(baseUrl).origin
const hideZhCn = process.env.SEO_HIDE_ZH_CN === '1'
const localeSegments = hideZhCn ? ['id', 'en'] : ['id', 'en', 'zh-cn']

if (process.env.SEO_REQUIRE_PRODUCTION_ORIGIN === '1') {
  const canonicalUrl = new URL(baseUrl)
  assert.equal(canonicalUrl.protocol, 'https:', `Production canonical origin must use HTTPS: ${baseUrl}`)
  assert.equal(canonicalUrl.port, '', `Production canonical origin must not expose a port: ${baseUrl}`)
  assert.equal(isIP(canonicalUrl.hostname.replace(/^\[|\]$/g, '')), 0, `Production canonical origin must not use an IP address: ${baseUrl}`)
  assert.notEqual(canonicalUrl.hostname.toLowerCase(), 'localhost', `Production canonical origin must not be local: ${baseUrl}`)
  assert.doesNotMatch(canonicalUrl.hostname, /(?:^|\.)example\.(?:com|net|org)$/i, `Production canonical origin must not use a placeholder domain: ${baseUrl}`)
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function parseAttributes(tag) {
  return Object.fromEntries(Array.from(tag.matchAll(/([:\w-]+)=(?:"([^"]*)"|'([^']*)')/g), match => [
    match[1].toLowerCase(),
    decodeEntities(match[2] ?? match[3] ?? ''),
  ]))
}

function tags(html, name) {
  return Array.from(html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi')), match => parseAttributes(match[0]))
}

function visibleText(html) {
  return decodeEntities(html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim())
}

function one(values, label, url) {
  assert.equal(values.length, 1, `${url}: expected exactly one ${label}, found ${values.length}`)
  return values[0]
}

function schemaNodes(value) {
  if (Array.isArray(value)) return value.flatMap(schemaNodes)
  if (!value || typeof value !== 'object') return []
  return [value, ...Object.values(value).flatMap(schemaNodes)]
}

function expectedSchemaType(url) {
  const { pathname } = new URL(url)
  if (/\/(?:id|en|zh-cn)\/$/.test(pathname)) return 'Organization'
  if (/\/products\/[^/]+\.html$/.test(pathname)) return 'Product'
  if (/\/solutions\/[^/]+$/.test(pathname)) return 'WebPage'
  if (/\/delivery-cases\/[^/]+$/.test(pathname)) return 'Article'
  if (/\/news\/[^/]+$/.test(pathname)) return 'NewsArticle'
  if (pathname.endsWith('/about')) return 'AboutPage'
  if (pathname.endsWith('/contact')) return 'ContactPage'
  if (pathname.endsWith('/faq')) return 'FAQPage'
  if (pathname.endsWith('/privacy-policy')) return 'WebPage'
  return 'CollectionPage'
}

function validateSchema(nodes, type, url) {
  const node = nodes.find(item => item['@type'] === type)
  assert.ok(node, `${url}: missing ${type} schema`)
  const required = {
    Product: ['name', 'description', 'sku', 'image', 'brand'],
    Service: ['name', 'description', 'provider', 'areaServed'],
    Article: ['headline', 'description', 'datePublished', 'publisher'],
    NewsArticle: ['headline', 'description', 'datePublished', 'publisher'],
    Organization: ['name', 'url', 'logo'],
    CollectionPage: ['name'],
    AboutPage: ['name'],
    ContactPage: ['name'],
    FAQPage: ['name', 'mainEntity'],
    WebPage: ['name'],
  }[type] || []
  for (const field of required) assert.ok(node[field], `${url}: ${type}.${field} is required`)
  if (type === 'WebPage' && /\/solutions\/[^/]+$/.test(new URL(url).pathname)) {
    for (const field of ['description', 'url', 'breadcrumb']) {
      assert.ok(node[field], `${url}: solution WebPage.${field} is required`)
    }
  }
}

async function request(url, options = {}) {
  const requestedUrl = new URL(url)
  const fetchUrl = requestedUrl.origin === canonicalOrigin && requestOrigin !== canonicalOrigin
    ? new URL(`${requestedUrl.pathname}${requestedUrl.search}`, `${requestBaseUrl}/`).toString()
    : requestedUrl.toString()
  const response = await fetch(fetchUrl, { redirect: 'manual', signal: AbortSignal.timeout(requestTimeoutMs), ...options })
  const body = options.method === 'HEAD' ? '' : await response.text()
  return { response, body }
}

async function mapConcurrent(items, worker) {
  const results = new Array(items.length)
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index], index)
    }
  }))
  return results
}

const root = await request(`${baseUrl}/`)
assert.equal(root.response.status, 301)
const rootLocation = root.response.headers.get('location')
assert.equal(new URL(rootLocation, requestBaseUrl).pathname, '/id/')

const robots = await request(`${baseUrl}/robots.txt`)
assert.equal(robots.response.status, 200)
assert.match(robots.body, new RegExp(`Sitemap: ${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/sitemap\\.xml`))
assert.match(robots.body, /User-agent: OAI-SearchBot/)
assert.match(robots.body, /User-agent: ClaudeBot/)
assert.match(robots.body, /User-agent: Bytespider/)

const llms = await request(`${baseUrl}/llms.txt`)
assert.equal(llms.response.status, 200)
assert.match(llms.body, /^# ExampleCorp/m)
assert.match(llms.body, new RegExp(`${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/sitemap\\.xml`))
assert.match(llms.body, /^## Canonical language hubs$/m)
assert.match(llms.body, /^## Entity, trust, and support sources$/m)
for (const locale of localeSegments) {
  for (const path of ['/products', '/solutions', '/delivery-cases', '/news', '/about', '/contact', '/faq', '/privacy-policy']) {
    assert.match(llms.body, new RegExp(`${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${locale}${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[)\\s|]|$)`))
  }
}
const llmsUrls = [...new Set(Array.from(llms.body.matchAll(/https?:\/\/[^\s)]+/g), match => match[0]))]
assert.ok(llmsUrls.length >= (hideZhCn ? 20 : 29), `llms.txt exposes only ${llmsUrls.length} canonical discovery links`)
if (hideZhCn) assert.doesNotMatch(llms.body, /\/zh-cn\//, 'llms.txt must hide the disabled Chinese locale')
await mapConcurrent(llmsUrls, async (url) => {
  assert.equal(new URL(url).origin, new URL(baseUrl).origin, `llms.txt contains an unexpected external URL: ${url}`)
  const { response } = await request(url, { method: 'HEAD' })
  assert.ok([200, 301].includes(response.status), `llms.txt target ${url}: expected 200 or 301, received ${response.status}`)
})

const sitemap = await request(`${baseUrl}/sitemap.xml`)
assert.equal(sitemap.response.status, 200)
assert.match(sitemap.body, /<sitemapindex[^>]+>/)
const sitemapUrls = Array.from(sitemap.body.matchAll(/<loc>([\s\S]*?)<\/loc>/g), match => decodeEntities(match[1].trim()))
assert.equal(sitemapUrls.length, localeSegments.length * 5, 'Sitemap index contains an unexpected locale/type count')
if (hideZhCn) assert.ok(sitemapUrls.every(url => !url.includes('/sitemaps/zh-cn/')), 'Sitemap index must hide Chinese child sitemaps')
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'Sitemap index contains duplicate child sitemaps')
const childSitemaps = await mapConcurrent(sitemapUrls, async (url) => {
  const child = await request(url)
  assert.equal(child.response.status, 200, `${url}: child sitemap must return 200`)
  assert.match(child.body, /<urlset[^>]+xmlns:xhtml=/, `${url}: child sitemap must be a URL set`)
  return Array.from(child.body.matchAll(/<loc>([\s\S]*?)<\/loc>/g), match => decodeEntities(match[1].trim()))
})
const urls = childSitemaps.flat()
assert.ok(urls.length > 20, `Sitemap unexpectedly contains only ${urls.length} URLs`)
assert.equal(new Set(urls).size, urls.length, 'Sitemap contains duplicate URLs')
assert.ok(
  urls.every(url => !/\/(?:id|en|zh-cn)\/products\/\d+\//.test(new URL(url).pathname)),
  'Product sitemap URLs must not expose numeric ID segments',
)

const categoryUrl = urls.find(url => /\/(?:id|en|zh-cn)\/products\/category\/[^/?#]+$/.test(url))
assert.ok(categoryUrl, 'Sitemap must expose at least one clean product category URL')
const categoryLocation = new URL(categoryUrl)
const categorySlug = categoryLocation.pathname.split('/').at(-1)
const localeSegment = categoryLocation.pathname.split('/').filter(Boolean)[0]
const legacyCategoryUrl = `${baseUrl}/${localeSegment}/products?category=${encodeURIComponent(categorySlug)}`
const legacyCategory = await request(legacyCategoryUrl)
assert.ok([200, 301].includes(legacyCategory.response.status), 'Legacy category query URL must return a valid static response')
if (legacyCategory.response.status === 301) {
  assert.equal(new URL(legacyCategory.response.headers.get('location'), requestBaseUrl).pathname, categoryLocation.pathname)
}

const productDirectoryUrl = `${baseUrl}/${localeSegment}/products`
const productDirectory = await request(productDirectoryUrl)
assert.equal(productDirectory.response.status, 200)
const pageTwoLink = tags(productDirectory.body, 'a').find(tag => tag.href === `/${localeSegment}/products/page/2`)
assert.ok(pageTwoLink, `${productDirectoryUrl}: second product page must be a crawlable link`)
const productPageTwoUrl = `${productDirectoryUrl}/page/2`
const productPageTwo = await request(productPageTwoUrl)
assert.equal(productPageTwo.response.status, 200)
assert.equal(
  one(tags(productPageTwo.body, 'link').filter(tag => tag.rel === 'prev').map(tag => tag.href), 'previous-page link', productPageTwoUrl),
  productDirectoryUrl,
)
assert.equal(
  one(tags(productPageTwo.body, 'link').filter(tag => tag.rel === 'next').map(tag => tag.href), 'next-page link', productPageTwoUrl),
  `${productDirectoryUrl}/page/3`,
)
const invalidProductPage = await request(`${productDirectoryUrl}/page/999999`)
assert.equal(invalidProductPage.response.status, 404, 'Out-of-range product pages must return 404')
const invalidNewsPage = await request(`${baseUrl}/${localeSegment}/news/page/999999`)
assert.equal(invalidNewsPage.response.status, 404, 'Out-of-range news pages must return 404')

const trackingParams = {
  utm_source: 'google',
  utm_medium: 'cpc',
  utm_campaign: 'seo-geo-verification',
  gclid: 'test-google-click-id',
  fbclid: 'test-meta-click-id',
}
function trackedUrl(url) {
  const tracked = new URL(url)
  for (const [key, value] of Object.entries(trackingParams)) tracked.searchParams.set(key, value)
  return tracked.toString()
}
function headValues(body, relOrName) {
  if (relOrName === 'robots') return tags(body, 'meta').filter(tag => tag.name === 'robots').map(tag => tag.content)
  return tags(body, 'link').filter(tag => tag.rel === relOrName).map(tag => tag.href)
}

const productDetailUrl = urls.find(url => /\/(?:id|en|zh-cn)\/products\/[^/?#]+\.html$/.test(url))
assert.ok(productDetailUrl, 'Sitemap must expose at least one product detail URL for campaign canonical verification')
const campaignLandingPages = [
  productDirectoryUrl,
  productPageTwoUrl,
  `${baseUrl}/${localeSegment}/faq`,
  productDetailUrl,
]
await mapConcurrent(campaignLandingPages, async (canonicalUrl) => {
  const tracked = await request(trackedUrl(canonicalUrl))
  assert.equal(tracked.response.status, 200, `${canonicalUrl}: campaign landing page must return 200`)
  assert.equal(one(headValues(tracked.body, 'canonical'), 'campaign canonical', canonicalUrl), canonicalUrl)
  assert.equal(one(headValues(tracked.body, 'robots'), 'campaign robots meta', canonicalUrl), 'index,follow')
})

const filteredProductsUrl = new URL(productDirectoryUrl)
filteredProductsUrl.searchParams.set('q', 'transformer')
for (const [key, value] of Object.entries(trackingParams)) filteredProductsUrl.searchParams.set(key, value)
const filteredProducts = await request(filteredProductsUrl.toString())
assert.equal(filteredProducts.response.status, 200)
assert.equal(one(headValues(filteredProducts.body, 'canonical'), 'filtered-products canonical', filteredProductsUrl.toString()), productDirectoryUrl)
const filteredRobots = filteredProducts.response.headers.get('x-robots-tag')
  || one(headValues(filteredProducts.body, 'robots'), 'filtered-products robots directive', filteredProductsUrl.toString())
assert.equal(filteredRobots.replace(/\s+/g, ''), 'noindex,follow')

const searchLandingUrl = new URL(`${baseUrl}/${localeSegment}/search`)
searchLandingUrl.searchParams.set('q', 'transformer')
for (const [key, value] of Object.entries(trackingParams)) searchLandingUrl.searchParams.set(key, value)
const searchLanding = await request(searchLandingUrl.toString())
assert.equal(searchLanding.response.status, 200)
assert.equal(one(headValues(searchLanding.body, 'canonical'), 'search canonical', searchLandingUrl.toString()), `${baseUrl}/${localeSegment}/search`)
assert.equal(one(headValues(searchLanding.body, 'robots'), 'search robots meta', searchLandingUrl.toString()), 'noindex,follow')

const seen = {
  title: new Map(),
  description: new Map(),
  canonical: new Map(),
  h1: new Map(),
}
const alternateTargets = new Set()

await mapConcurrent(urls, async (url) => {
  const { response, body } = await request(url)
  assert.equal(response.status, 200, `${url}: expected 200, received ${response.status}`)

  const title = decodeEntities(one(Array.from(body.matchAll(/<title>([\s\S]*?)<\/title>/gi), match => match[1].trim()), 'title', url))
  const description = one(tags(body, 'meta').filter(tag => tag.name === 'description').map(tag => tag.content), 'meta description', url)
  const canonical = one(tags(body, 'link').filter(tag => tag.rel === 'canonical').map(tag => tag.href), 'canonical', url)
  const robotsMeta = one(tags(body, 'meta').filter(tag => tag.name === 'robots').map(tag => tag.content), 'robots meta', url)
  const h1 = decodeEntities(one(Array.from(body.matchAll(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/gi), match => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()), 'H1', url))
  const readableBody = visibleText(body)
  const crawlableLinks = tags(body, 'a').filter(tag => tag.href && !tag.href.startsWith('javascript:'))

  assert.ok(title.length >= 5 && title.length <= 180, `${url}: invalid title length ${title.length}`)
  assert.ok(description.length >= 20 && description.length <= 320, `${url}: invalid description length ${description.length}`)
  assert.ok(h1.length >= 2, `${url}: empty H1`)
  assert.ok(readableBody.length >= 500, `${url}: initial HTML exposes only ${readableBody.length} readable characters`)
  assert.ok(crawlableLinks.length >= 5, `${url}: initial HTML exposes only ${crawlableLinks.length} crawlable links`)
  assert.doesNotMatch(body, /id="__nuxt"\s*>\s*<\/div>/i, `${url}: Nuxt root is an empty JavaScript-only shell`)
  assert.equal(canonical, url, `${url}: canonical mismatch (${canonical})`)
  assert.equal(robotsMeta, 'index,follow', `${url}: sitemap URL must be indexable`)
  assert.doesNotMatch(`${title} ${description}`, /ExampleCorp/i, `${url}: legacy brand in metadata`)

  const contentLocale = new URL(url).pathname.split('/').filter(Boolean)[0] || 'default'
  for (const [key, value] of Object.entries({ title, description, canonical, h1 })) {
    const localizedValue = `${contentLocale}:${value}`
    const previous = seen[key].get(localizedValue)
    assert.ok(!previous, `${url}: duplicate ${key} with ${previous}: ${value}`)
    seen[key].set(localizedValue, url)
  }

  const alternates = tags(body, 'link').filter(tag => tag.rel === 'alternate' && tag.hreflang)
  assert.ok(alternates.some(item => item.hreflang === 'x-default'), `${url}: missing x-default`)
  if (hideZhCn) {
    assert.ok(
      alternates.every(item => item.hreflang !== 'zh-CN' && !item.href?.includes('/zh-cn/')),
      `${url}: hidden Chinese locale is still exposed through hreflang`,
    )
  }
  for (const alternate of alternates) alternateTargets.add(alternate.href)

  const scripts = Array.from(body.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi), match => match[1].trim())
  assert.ok(scripts.length, `${url}: missing JSON-LD`)
  const parsedSchemas = scripts.map((script) => {
    try { return JSON.parse(script) }
    catch (error) { throw new Error(`${url}: invalid JSON-LD: ${error.message}`) }
  })
  const nodes = parsedSchemas.flatMap(schemaNodes)
  const type = expectedSchemaType(url)
  validateSchema(nodes, type, url)
  if (!/\/(?:id|en|zh-cn)\/$/.test(new URL(url).pathname)) {
    assert.ok(nodes.some(item => item['@type'] === 'BreadcrumbList'), `${url}: missing BreadcrumbList`)
  }
})

const sitemapUrlSet = new Set(urls)
const additionalAlternateTargets = [...alternateTargets].filter(url => !sitemapUrlSet.has(url))
await mapConcurrent(additionalAlternateTargets, async (url) => {
  const { response } = await request(url, { method: 'HEAD' })
  assert.equal(response.status, 200, `hreflang target ${url}: expected 200, received ${response.status}`)
})

const notFound = await request(`${baseUrl}/id/not-a-real-page`)
assert.equal(notFound.response.status, 404)
assert.match(notFound.body, /noindex,nofollow/)

const fetchNote = requestBaseUrl === baseUrl ? '' : ` (fetched through ${requestBaseUrl})`
console.log(`SEO verification passed for ${sitemapUrls.length} child sitemaps, ${urls.length} URLs and ${alternateTargets.size} hreflang targets at ${baseUrl}${fetchNote}`)
