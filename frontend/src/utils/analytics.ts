const VISITOR_STORAGE_KEY = 'examplecorp_visitor_id'
const SESSION_STORAGE_KEY = 'examplecorp_session_id'
let lastTrackedPath = ''

function createAnonymousId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}.${Math.random().toString(36).slice(2)}`
}

function storageId(storage: Storage, key: string) {
  try {
    const existing = storage.getItem(key)
    if (existing) return existing
    const value = createAnonymousId()
    storage.setItem(key, value)
    return value
  }
  catch {
    return createAnonymousId()
  }
}

export function trackPageView(path: string) {
  if (typeof window === 'undefined' || path === lastTrackedPath) return
  lastTrackedPath = path

  const payload = {
    visitor_id: storageId(window.localStorage, VISITOR_STORAGE_KEY),
    session_id: storageId(window.sessionStorage, SESSION_STORAGE_KEY),
    path,
    page_title: document.title,
    referrer: document.referrer || null,
    language: navigator.language || null,
    screen_size: `${window.screen.width}x${window.screen.height}`,
  }

  void fetch('/api/analytics/page-view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt public-site navigation.
  })
}
