export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')
const DEFAULT_ASSET_BASE_URL = 'https://zsgy-1428822977.cos.ap-chengdu.myqcloud.com'
const ASSET_BASE_URL = (import.meta.env.VITE_ASSET_BASE_URL ?? DEFAULT_ASSET_BASE_URL).replace(/\/$/, '')
const FRONTEND_PUBLIC_ASSET_PREFIXES = ['/banner-assets/', '/page-assets/', '/product-assets/', '/solution-assets/', '/news-assets/', '/delivery-case-assets/', '/uploads/']
const FRONTEND_PUBLIC_ASSET_PATHS = ['/logo-site.png', '/logo-footer.png', '/logo.png', '/favicon.svg', '/icons.svg']
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504])

function createRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

async function fetchWithPolicy(
  url: string,
  init: RequestInit = {},
  options: { timeoutMs?: number; retries?: number } = {},
) {
  const timeoutMs = options.timeoutMs ?? 8_000
  const retries = options.retries ?? 0
  const headers = new Headers(init.headers)
  if (!headers.has('X-Request-ID')) headers.set('X-Request-ID', createRequestId())

  for (let attempt = 0; ; attempt += 1) {
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)
    const abortFromCaller = () => controller.abort()
    init.signal?.addEventListener('abort', abortFromCaller, { once: true })
    try {
      const response = await fetch(url, { ...init, headers, signal: controller.signal })
      if (attempt < retries && RETRYABLE_STATUS_CODES.has(response.status)) continue
      return response
    }
    catch (error) {
      if (attempt >= retries || init.signal?.aborted) throw error
    }
    finally {
      globalThis.clearTimeout(timeout)
      init.signal?.removeEventListener('abort', abortFromCaller)
    }
  }
}

export function resolveAssetUrl(url: string | null | undefined) {
  if (!url || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url ?? ''
  if (
    FRONTEND_PUBLIC_ASSET_PREFIXES.some(prefix => url.startsWith(prefix))
    || FRONTEND_PUBLIC_ASSET_PATHS.includes(url)
  ) {
    return ASSET_BASE_URL ? `${ASSET_BASE_URL}${url}` : url
  }
  return `${API_ORIGIN}${url}`
}

export function resolveOptimizedAssetUrl(
  url: string | null | undefined,
  options: { width: number; quality?: number } = { width: 1200 },
) {
  const resolved = resolveAssetUrl(url)
  if (!resolved || !resolved.includes('.cos.')) return resolved
  const separator = resolved.includes('?') ? '&' : '?'
  return `${resolved}${separator}imageMogr2/thumbnail/${Math.max(1, Math.round(options.width))}x/format/webp/quality/${options.quality ?? 82}`
}

export function resolveResponsiveAsset(
  url: string | null | undefined,
  options: { widths?: number[]; quality?: number } = {},
) {
  const widths = Array.from(new Set(options.widths ?? [480, 768, 1200, 1600]))
    .map(width => Math.max(1, Math.round(width)))
    .sort((a, b) => a - b)
  const resolved = resolveAssetUrl(url)
  if (!resolved) return { src: '', srcset: '' }
  if (!resolved.includes('.cos.')) return { src: resolved, srcset: '' }
  return {
    src: resolveOptimizedAssetUrl(resolved, { width: widths.at(-1) ?? 1200, quality: options.quality }),
    srcset: widths.map(width => `${resolveOptimizedAssetUrl(resolved, { width, quality: options.quality })} ${width}w`).join(', '),
  }
}

export async function apiGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetchWithPolicy(`${API_BASE_URL}${path}`, init, { retries: 1 })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function apiPost<T, TPayload extends object>(
  path: string,
  payload: TPayload,
  init: RequestInit = {},
  options: { timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  const response = await fetchWithPolicy(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(payload),
  }, { timeoutMs: options.timeoutMs ?? 20_000, retries: options.retries ?? 0 })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function apiPatch<T, TPayload extends object>(path: string, payload: TPayload, init: RequestInit = {}): Promise<T> {
  const response = await fetchWithPolicy(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(payload),
  }, { timeoutMs: 20_000 })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function apiDelete(path: string, init: RequestInit = {}): Promise<void> {
  const response = await fetchWithPolicy(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'DELETE',
  }, { timeoutMs: 20_000 })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }
}

export async function apiPostForm<T>(path: string, payload: FormData): Promise<T> {
  const response = await fetchWithPolicy(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: payload,
  }, { timeoutMs: 30_000 })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}
