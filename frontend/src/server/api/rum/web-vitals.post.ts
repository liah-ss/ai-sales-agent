interface WebVitalPayload {
  name: 'CLS' | 'INP' | 'LCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  navigation_type?: string
  path: string
  locale?: string
  viewport?: string
}

const ALLOWED_METRICS = new Set(['CLS', 'INP', 'LCP', 'TTFB'])

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const payload = await readBody<WebVitalPayload>(event)
  if (!ALLOWED_METRICS.has(payload?.name) || !Number.isFinite(payload?.value)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Web Vital payload' })
  }

  if (config.rumLogEnabled) {
    console.info(JSON.stringify({
      type: 'web_vital',
      metric: payload.name,
      value: payload.value,
      rating: payload.rating,
      path: String(payload.path || '/').slice(0, 500),
      locale: String(payload.locale || '').slice(0, 20),
      viewport: String(payload.viewport || '').slice(0, 30),
      navigation_type: String(payload.navigation_type || '').slice(0, 40),
      timestamp: new Date().toISOString(),
    }))
  }
  setResponseStatus(event, 202)
  return { accepted: true }
})
