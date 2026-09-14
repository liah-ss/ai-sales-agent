const GTM_CONTAINER_ID = 'GTM-K55FPT6T'
// Keep third-party work outside the initial rendering window. Interactions still
// start tracking immediately; the timeout records visits without an interaction.
const GTM_FALLBACK_DELAY_MS = 15_000

type GoogleWindow = Window & {
  dataLayer?: Array<Record<string, unknown> | IArguments>
  __examplecorpGtmLoaded?: boolean
}

function loadGoogleTagManager() {
  const googleWindow = window as GoogleWindow
  if (googleWindow.__examplecorpGtmLoaded) return

  googleWindow.__examplecorpGtmLoaded = true
  googleWindow.dataLayer = googleWindow.dataLayer || []
  googleWindow.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`
  document.head.append(script)
}

export default defineNuxtPlugin(() => {
  const schedule = () => {
    let fallbackTimer: number | undefined
    const interactionEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart']

    const start = () => {
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer)
      interactionEvents.forEach(eventName => window.removeEventListener(eventName, start))
      loadGoogleTagManager()
    }

    interactionEvents.forEach(eventName => window.addEventListener(eventName, start, { once: true, passive: true }))
    fallbackTimer = window.setTimeout(start, GTM_FALLBACK_DELAY_MS)
  }

  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })
})
