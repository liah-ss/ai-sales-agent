interface RequestCacheEntry<T> {
  promise: Promise<T>
  expiresAt: number
}

const requestCache = new Map<string, RequestCacheEntry<unknown>>()

export function rememberRequest<T>(key: string, promise: Promise<T>, ttlMs = 5 * 60_000): Promise<T> {
  const now = Date.now()
  const existing = requestCache.get(key) as RequestCacheEntry<T> | undefined
  if (existing && existing.expiresAt > now) return existing.promise

  const entry: RequestCacheEntry<T> = { promise, expiresAt: Number.POSITIVE_INFINITY }
  entry.promise = promise.then((value) => {
    entry.expiresAt = Date.now() + ttlMs
    return value
  }).catch((error) => {
    if (requestCache.get(key) === entry) requestCache.delete(key)
    throw error
  })
  requestCache.set(key, entry)
  return entry.promise
}

export function cachedRequest<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs = 5 * 60_000,
): Promise<T> {
  const now = Date.now()
  const existing = requestCache.get(key) as RequestCacheEntry<T> | undefined
  if (existing && existing.expiresAt > now) return existing.promise

  return rememberRequest(key, loader(), ttlMs)
}
