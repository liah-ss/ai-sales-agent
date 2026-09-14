<script setup lang="ts">
import AppFooter from '../components/layout/AppFooter.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import type { SiteSettings } from '../types/site'
import type { WebsiteConfigPayload } from '../types/websiteConfig'
import { provideWebsiteConfig } from '../composables/useWebsiteConfig'
import { absoluteUrl, normalizeBrandText } from '../utils/seoContent'
import { onMounted, shallowRef } from 'vue'

const config = useRuntimeConfig()
const route = useRoute()
const apiHeaders = useApiRequestHeaders()
const { data } = await useAsyncData('public-shell', async () => {
  const [settings, websiteConfig] = await Promise.all([
    $fetch<SiteSettings>('/api/site-settings', { headers: apiHeaders }),
    $fetch<WebsiteConfigPayload>('/api/website-config', { headers: apiHeaders }).catch(() => null),
  ])
  const isHomePage = /^\/(?:en|zh-CN|id)\/?$/.test(route.path)
  const shellWebsiteConfig = isHomePage && websiteConfig
    ? { ...websiteConfig, faq: { ...websiteConfig.faq, categories: [] } }
    : websiteConfig
  return { settings, websiteConfig: shellWebsiteConfig }
})

provideWebsiteConfig(data.value?.websiteConfig ?? null)

const siteSettings = computed(() => data.value?.settings ?? null)
const healthStatus = shallowRef('ok')
const siteUrl = String(config.public.siteUrl).replace(/\/$/, '')

onMounted(() => {
  const checkHealth = async () => {
    const result = await $fetch<{ status: string }>('/api/health').catch(() => ({ status: 'offline' }))
    healthStatus.value = result.status
  }
  window.setTimeout(() => void checkHealth(), 5_000)
})

useHead(() => ({
  script: siteSettings.value
    ? [{
        key: 'site-entities',
        type: 'application/ld+json',
        textContent: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': `${siteUrl}/#organization`,
              name: normalizeBrandText(siteSettings.value.brand_name || 'ExampleCorp'),
              url: siteUrl,
              logo: absoluteUrl(String(config.public.assetBaseUrl), '/logo-site.png'),
              email: siteSettings.value.sales_email,
              telephone: siteSettings.value.phone,
              address: siteSettings.value.company_address,
              areaServed: ['ID', 'Southeast Asia', 'Global'],
            },
            {
              '@type': 'WebSite',
              '@id': `${siteUrl}/#website`,
              name: normalizeBrandText(siteSettings.value.brand_name || 'ExampleCorp'),
              url: siteUrl,
              publisher: { '@id': `${siteUrl}/#organization` },
            },
          ],
        }).replace(/</g, '\\u003c'),
      }]
    : [],
}))
</script>

<template>
  <NuxtLoadingIndicator color="#1a5f7a" :height="3" :throttle="0" />
  <div class="app-shell">
    <AppHeader :site-settings="siteSettings" />
    <div v-if="healthStatus === 'offline'" class="system-banner" role="status">
      API service is temporarily unavailable.
    </div>
    <main class="app-main">
      <slot />
    </main>
    <AppFooter :site-settings="siteSettings" :health-status="healthStatus" />
  </div>
</template>
