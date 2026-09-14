import { trackPageView } from '../utils/analytics'

export default defineNuxtPlugin((nuxtApp) => {
  let pendingPath = ''
  let reportTimer: number | undefined

  const reportPendingPage = () => {
    if (!pendingPath) return
    const path = pendingPath
    pendingPath = ''
    if (reportTimer !== undefined) window.clearTimeout(reportTimer)
    reportTimer = undefined
    trackPageView(path)
  }

  nuxtApp.hook('page:finish', () => {
    pendingPath = `${window.location.pathname}${window.location.search}`
    if (reportTimer !== undefined) window.clearTimeout(reportTimer)
    reportTimer = window.setTimeout(reportPendingPage, 3_000)
  })

  window.addEventListener('pagehide', reportPendingPage)
})
