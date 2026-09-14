import { timingSafeEqual } from 'node:crypto'

const ALL_WARM_PATHS = ['/', '/products', '/solutions', '/delivery-cases', '/news', '/about', '/contact', '/faq']
const SCOPE_PATHS: Record<string, string[]> = {
  '/api/home': ['/'],
  '/api/categories': ['/products'],
  '/api/products': ['/products'],
  '/api/solutions': ['/solutions'],
  '/api/delivery-cases': ['/delivery-cases'],
  '/api/news': ['/news'],
  '/api/site-settings': ALL_WARM_PATHS,
  '/api/website-config': ALL_WARM_PATHS,
}
let warmupTimer: ReturnType<typeof setTimeout> | undefined

function secretsMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

function cacheKeyMatchesPath(key: string, path: string) {
  if (path === '/') {
    return /(?:^|[:/])(?:id|en|zh-cn)(?:[/:]|%2F)?(?:\.json)?$/.test(key)
  }
  return key.includes(path) || key.includes(path.replaceAll('/', '%2F'))
}

function scheduleWarmup(origin: string, hideZhCn: boolean, paths: string[]) {
  if (warmupTimer) clearTimeout(warmupTimer)
  const locales = hideZhCn ? ['id', 'en'] : ['id', 'en', 'zh-cn']
  const urls = locales.flatMap(locale => paths.map(path => (
    `${origin}/${locale}${path === '/' ? '/' : path}`
  )))

  warmupTimer = setTimeout(() => {
    warmupTimer = undefined
    void Promise.allSettled(urls.map(url => $fetch(url, {
      retry: 0,
      timeout: 60_000,
    }))).then((results) => {
      const failures = results.filter(result => result.status === 'rejected').length
      if (failures) console.warn(`Public cache warmup failed for ${failures}/${urls.length} routes`)
    })
  }, 250)
  warmupTimer.unref?.()
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const suppliedSecret = getHeader(event, 'x-revalidate-secret') || ''
  if (!secretsMatch(suppliedSecret, String(config.revalidateSecret))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid revalidation secret' })
  }

  const body: { scopes?: string[] } = await readBody<{ scopes?: string[] }>(event).catch(() => ({}))
  const scopes = Array.isArray(body.scopes) ? body.scopes : []
  const paths = scopes.length
    ? [...new Set(scopes.flatMap(scope => SCOPE_PATHS[scope] ?? []))]
    : ALL_WARM_PATHS
  const storage = useStorage('cache')
  const keys = await storage.getKeys()
  const affectedKeys = paths.length === ALL_WARM_PATHS.length
    ? keys
    : keys.filter(key => paths.some(path => cacheKeyMatchesPath(key, path)))
  await Promise.all(affectedKeys.map(key => storage.removeItem(key)))
  await $fetch(`${String(config.apiInternalBase).replace(/\/$/, '')}/api/internal/cache/invalidate`, {
    method: 'POST',
    headers: { 'X-Revalidate-Secret': String(config.revalidateSecret) },
    body: { scopes },
    retry: 0,
  }).catch((error) => {
    console.warn('Backend cache revalidation failed', error)
  })
  scheduleWarmup(getRequestURL(event).origin, Boolean(config.public.hideZhCn), paths)
  return { status: 'ok', revalidated_at: new Date().toISOString() }
})
