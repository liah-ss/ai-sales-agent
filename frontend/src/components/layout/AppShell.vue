<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getHealth, getSiteSettings } from '../../api/site'
import { normalizeLocale, useI18n } from '../../composables/useI18n'
import type { SiteSettings } from '../../types/site'
import AppFooter from './AppFooter.vue'
import AppHeader from './AppHeader.vue'

const healthStatus = ref('checking')
const siteSettings = ref<SiteSettings | null>(null)
const route = useRoute()
const { locale, setLocale, t } = useI18n()

watch(
  () => route.params.locale,
  (segment) => {
    const routeLocale = normalizeLocale(typeof segment === 'string' ? segment : '')
    if (routeLocale && routeLocale !== locale.value) setLocale(routeLocale)
  },
  { immediate: true },
)

onMounted(async () => {
  try {
    const [health, settings] = await Promise.all([getHealth(), getSiteSettings()])
    healthStatus.value = health.status
    siteSettings.value = settings
  } catch (error) {
    healthStatus.value = 'offline'
  }
})
</script>

<template>
  <div class="app-shell">
    <AppHeader :site-settings="siteSettings" />
    <div v-if="healthStatus === 'offline'" class="system-banner" role="status">
      {{ t('system.offline') }}
    </div>
    <main class="app-main">
      <RouterView />
    </main>
    <AppFooter :site-settings="siteSettings" :health-status="healthStatus" />
  </div>
</template>
