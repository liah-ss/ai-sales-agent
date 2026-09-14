const redisUrl = process.env.REDIS_URL
const configuredPrerenderConcurrency = Number.parseInt(process.env.NUXT_PRERENDER_CONCURRENCY || '1', 10)
const prerenderConcurrency = Number.isFinite(configuredPrerenderConcurrency)
  ? Math.max(1, configuredPrerenderConcurrency)
  : 1
const prerenderDisabled = process.env.NUXT_PRERENDER_DISABLED === 'true'
const targetedPrerenderRoutes = (process.env.NUXT_PRERENDER_ROUTES || '')
  .split(',')
  .map(route => route.trim())
  .filter(route => route.startsWith('/'))
const prerenderMaintenanceMode = prerenderDisabled || targetedPrerenderRoutes.length > 0
const hideZhCn = process.env.NUXT_PUBLIC_HIDE_ZH_CN === 'true'
const publicLocaleSegments = hideZhCn ? ['id', 'en'] : ['id', 'en', 'zh-cn']
const requestedDefaultLocale = process.env.NUXT_PUBLIC_DEFAULT_LOCALE || 'id'
const defaultLocale = publicLocaleSegments.includes(requestedDefaultLocale)
  ? requestedDefaultLocale
  : 'id'
const assetBaseUrl = (process.env.NUXT_PUBLIC_ASSET_BASE_URL
  || 'https://zsgy-1428822977.cos.ap-chengdu.myqcloud.com').replace(/\/$/, '')
const homePageCache = { swr: 300 } as const
const directoryPageCache = { swr: 900 } as const
const detailPageCache = { swr: 1800 } as const

const productionRouteRules = prerenderMaintenanceMode
  ? ({
      '/**/search': { cache: false },
    } as const)
  : ({
      '/id/': homePageCache,
      '/en/': homePageCache,
      ...(!hideZhCn ? { '/zh-cn/': homePageCache } : {}),
      '/**/products': directoryPageCache,
      '/**/products/category/**': directoryPageCache,
      '/**/products/**': detailPageCache,
      '/**/solutions': directoryPageCache,
      '/**/solutions/**': detailPageCache,
      '/**/delivery-cases': directoryPageCache,
      '/**/delivery-cases/**': detailPageCache,
      '/**/news': directoryPageCache,
      '/**/news/**': detailPageCache,
      '/**/about': detailPageCache,
      '/**/faq': detailPageCache,
      '/**/privacy-policy': detailPageCache,
      '/**/contact': detailPageCache,
      '/**/search': { cache: false },
    } as const)

const configuredPrerenderRoutes = [
  '/', '/robots.txt', '/llms.txt', '/sitemap.xml',
  ...publicLocaleSegments.flatMap(locale => (
    ['', 'products', 'solutions', 'delivery-cases', 'news', 'about', 'contact', 'faq', 'privacy-policy', 'search']
      .map(path => `/${locale}/${path}`)
  )),
  ...publicLocaleSegments.flatMap(locale => (
    ['pages', 'products', 'solutions', 'delivery-cases', 'news']
      .map(type => `/sitemaps/${locale}/${type}.xml`)
  )),
]

export default defineNuxtConfig({
  srcDir: 'src/',
  dir: { public: '../public' },
  ssr: true,
  devServer: {
    host: '127.0.0.1',
    port: 5173,
  },
  css: ['~/style.css'],
  components: [{ path: '~/components', pathPrefix: false }],
  devtools: { enabled: false },
  runtimeConfig: {
    apiInternalBase: process.env.NUXT_API_INTERNAL_BASE || 'http://127.0.0.1:8000',
    revalidateSecret: process.env.NUXT_REVALIDATE_SECRET || 'local-revalidate-secret',
    rumLogEnabled: process.env.NUXT_RUM_LOG_ENABLED !== 'false',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.example.com',
      assetBaseUrl: process.env.NUXT_PUBLIC_ASSET_BASE_URL
        || 'https://zsgy-1428822977.cos.ap-chengdu.myqcloud.com',
      hideZhCn,
      defaultLocale,
    },
  },
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: assetBaseUrl, crossorigin: '' },
        { rel: 'dns-prefetch', href: assetBaseUrl },
      ],
    },
  },
  $production: {
    routeRules: productionRouteRules,
  },
  nitro: {
    compressPublicAssets: true,
    prerender: {
      crawlLinks: !prerenderMaintenanceMode,
      concurrency: prerenderConcurrency,
      failOnError: !prerenderDisabled,
      ignore: [route => route.includes('?')],
      routes: targetedPrerenderRoutes.length
        ? targetedPrerenderRoutes
        : prerenderDisabled ? [] : configuredPrerenderRoutes,
    },
    storage: {
      cache: redisUrl
        ? {
            driver: 'redis',
            // Docker passes redis://redis:6379/1 at build time so every
            // production renderer shares the same HTML cache.
            url: redisUrl,
            base: 'examplecorp:nuxt:',
          }
        : { driver: 'memory' },
    },
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  compatibilityDate: '2026-07-21',
})
