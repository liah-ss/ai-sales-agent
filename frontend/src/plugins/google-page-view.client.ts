import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { nextTick } from 'vue'

type GoogleWindow = Window & {
  dataLayer?: Array<Record<string, unknown> | IArguments>
  gtag?: (...args: unknown[]) => void
}

function pageViewPayload(route: RouteLocationNormalizedLoaded, referrer: string) {
  return {
    page_title: document.title,
    page_location: window.location.href,
    page_path: route.fullPath,
    page_referrer: referrer,
  }
}

async function waitForDestinationMetadata(initialTitle: string) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await nextTick()
    await new Promise<void>(resolve => setTimeout(resolve, 50))
    const title = document.title.trim()
    if (title && title !== initialTitle && !/^Memuat\b/i.test(title)) return
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  let trackedPath = router.currentRoute.value.fullPath
  let previousLocation = window.location.href

  nuxtApp.hook('page:finish', async () => {
    const route = router.currentRoute.value
    if (route.fullPath === trackedPath) return

    trackedPath = route.fullPath
    const destinationPath = route.fullPath
    const initialTitle = document.title
    await nextTick()
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    await waitForDestinationMetadata(initialTitle)
    if (router.currentRoute.value.fullPath !== destinationPath) return

    const googleWindow = window as GoogleWindow
    const payload = pageViewPayload(route, previousLocation)
    googleWindow.dataLayer = googleWindow.dataLayer || []
    googleWindow.dataLayer.push({ event: 'virtual_page_view', ...payload })
    googleWindow.gtag?.('event', 'page_view', payload)
    previousLocation = payload.page_location
  })
})
