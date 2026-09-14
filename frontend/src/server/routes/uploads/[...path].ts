export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const target = `${String(config.apiInternalBase).replace(/\/$/, '')}${event.path}`
  return proxyRequest(event, target)
})
