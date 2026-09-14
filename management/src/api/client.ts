const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')
const DEFAULT_ASSET_BASE_URL = 'https://zsgy-1428822977.cos.ap-chengdu.myqcloud.com'
const ASSET_BASE_URL = (import.meta.env.VITE_ASSET_BASE_URL ?? DEFAULT_ASSET_BASE_URL).replace(/\/$/, '')
const LOCAL_FRONTEND_ASSET_URL = import.meta.env.DEV ? 'http://127.0.0.1:5173' : ''
const MANAGEMENT_PUBLIC_ASSET_PREFIXES = ['/banner-assets/', '/page-assets/', '/product-assets/', '/solution-assets/', '/news-assets/', '/delivery-case-assets/', '/uploads/']
const MANAGEMENT_PUBLIC_ASSET_PATHS = ['/logo-site.png', '/logo.png', '/favicon.svg', '/icons.svg']

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function responseErrorMessage(response: Response) {
  try {
    const payload = await response.json() as { detail?: unknown }
    if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail
    if (Array.isArray(payload.detail)) {
      const messages = payload.detail
        .map(item => (typeof item === 'object' && item && 'msg' in item ? String(item.msg) : ''))
        .filter(Boolean)
      if (messages.length) return messages.join('；')
    }
  } catch {
    // Fall through to the HTTP status when the server did not return JSON.
  }
  return `API request failed: ${response.status}`
}

export function resolveAssetUrl(url: string) {
  if (!url || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url
  if (
    MANAGEMENT_PUBLIC_ASSET_PREFIXES.some(prefix => url.startsWith(prefix))
    || MANAGEMENT_PUBLIC_ASSET_PATHS.includes(url)
  ) {
    const assetBaseUrl = ASSET_BASE_URL || (url.startsWith('/page-assets/') ? LOCAL_FRONTEND_ASSET_URL : '')
    return assetBaseUrl ? `${assetBaseUrl}${url}` : url
  }
  return `${API_ORIGIN}${url}`
}

export function resolveOptimizedAssetUrl(url: string, width = 960) {
  const resolved = resolveAssetUrl(url)
  if (!resolved || !resolved.includes('.cos.')) return resolved
  const separator = resolved.includes('?') ? '&' : '?'
  return `${resolved}${separator}imageMogr2/thumbnail/${Math.max(1, Math.round(width))}x/format/webp/quality/82`
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const message = await responseErrorMessage(response)
    throw new ApiError(message, response.status)
  }

  return response.json() as Promise<T>
}

export async function apiPut<T, TPayload extends object>(path: string, payload: TPayload, token?: string) {
  return apiRequest<T>(path, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  })
}

export async function apiPatch<T, TPayload extends object>(path: string, payload: TPayload, token?: string) {
  return apiRequest<T>(path, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  })
}

export async function apiUpload<T>(path: string, file: File, token: string, fieldName = 'file') {
  const formData = new FormData()
  formData.append(fieldName, file)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new ApiError(`API upload failed: ${response.status}`, response.status)
  }

  return response.json() as Promise<T>
}

export async function apiUploadForm<T>(path: string, formData: FormData, token: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new ApiError(`API upload failed: ${response.status}`, response.status)
  }

  return response.json() as Promise<T>
}

export async function apiGet<T>(path: string, token?: string) {
  return apiRequest<T>(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export async function apiPost<T, TPayload extends object>(path: string, payload: TPayload, token?: string) {
  return apiRequest<T>(path, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  })
}

export async function apiDelete(path: string, token?: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    throw new ApiError(`API request failed: ${response.status}`, response.status)
  }
}

export async function apiDownload(path: string, token: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await responseErrorMessage(response)
    throw new ApiError(message, response.status)
  }
  return response.blob()
}
