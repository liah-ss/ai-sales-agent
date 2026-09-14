import { normalizeRequestId } from '../utils/request-id'

export default defineEventHandler((event) => {
  if (process.env.NUXT_PRERENDER_QUIET === 'true') return
  const startedAt = performance.now()
  const requestId = normalizeRequestId(getHeader(event, 'x-request-id'))
  event.context.requestId = requestId
  event.node.req.headers['x-request-id'] = requestId
  setHeader(event, 'X-Request-ID', requestId)
  event.node.res.on('finish', () => {
    const durationMs = Math.round((performance.now() - startedAt) * 100) / 100
    const status = event.node.res.statusCode
    const record = {
      type: status >= 500 ? 'request_error' : 'request',
      method: event.method,
      path: event.path.split('?')[0],
      status,
      request_id: requestId,
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
    }
    const serialized = JSON.stringify(record)
    if (status >= 500) console.error(serialized)
    else if (durationMs >= 1000) console.warn(serialized)
    else console.info(serialized)
  })
})
