import type { Metric } from 'web-vitals'

export default defineNuxtPlugin(() => {
  function report(metric: Metric) {
    const payload = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigation_type: metric.navigationType,
      path: window.location.pathname,
      locale: document.documentElement.lang,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/rum/web-vitals', new Blob([payload], { type: 'application/json' }))
      return
    }
    void fetch('/api/rum/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    })
  }

  window.setTimeout(() => {
    void import('web-vitals').then(({ onCLS, onINP, onLCP, onTTFB }) => {
      for (const track of [onCLS, onINP, onLCP, onTTFB]) track(report)
    })
  }, 5_000)
})
