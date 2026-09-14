export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const target = `${String(config.apiInternalBase).replace(/\/$/, '')}${event.path}`
  const attempts = event.method === 'GET' ? 2 : 1
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await proxyRequest(event, target, {
        fetchOptions: {
          headers: { 'X-Request-ID': String(event.context.requestId || '') },
          signal: AbortSignal.timeout(30_000),
        },
      })
    }
    catch (error) {
      if (attempt === attempts - 1 || event.node.res.headersSent) throw error
    }
  }
})
