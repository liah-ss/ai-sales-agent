<script setup lang="ts">
import AboutView from '../../views/AboutView.vue'
import { useI18n } from '../../composables/useI18n'
import { useWebsiteConfig } from '../../composables/useWebsiteConfig'
import { localizePath } from '../../utils/localeRouting'

const { locale, t } = useI18n()
const runtimeConfig = useRuntimeConfig()
const { pageConfig } = useWebsiteConfig()
const managedPage = pageConfig('about')
const siteUrl = String(runtimeConfig.public.siteUrl).replace(/\/$/, '')
usePageSeo(computed(() => ({
  title: managedPage.value?.headline ? `${managedPage.value.headline} | ExampleCorp` : `${t('about.title')} | ExampleCorp`,
  description: managedPage.value?.summary || t('about.subtitle'),
  path: '/about',
  locale: locale.value,
  breadcrumbs: [
    { name: t('nav.home'), path: '/' },
    { name: t('about.title'), path: '/about' },
  ],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: managedPage.value?.headline || t('about.title'),
    description: managedPage.value?.summary || t('about.subtitle'),
    url: `${siteUrl}${localizePath('/about', locale.value)}`,
    mainEntity: { '@id': `${siteUrl}/#organization` },
  },
})))
</script>

<template><AboutView /></template>
