<script setup lang="ts">
import ContactView from '../../views/ContactView.vue'
import type { CategoryTree } from '../../api/catalog'
import { useI18n } from '../../composables/useI18n'
import { useWebsiteConfig } from '../../composables/useWebsiteConfig'
import type { SolutionSummary } from '../../types/catalog'
import type { SiteSettings } from '../../types/site'
import { localizePath } from '../../utils/localeRouting'

const { locale, t } = useI18n()
const runtimeConfig = useRuntimeConfig()
const apiHeaders = useApiRequestHeaders()
const { data: contactData } = await useAsyncData(`contact-options-${locale.value}`, async () => {
  const [categories, solutions, siteSettings] = await Promise.all([
    $fetch<CategoryTree[]>('/api/categories', { headers: apiHeaders }),
    $fetch<SolutionSummary[]>('/api/solutions', { headers: apiHeaders }),
    $fetch<SiteSettings>('/api/site-settings', { headers: apiHeaders }),
  ])
  return { categories, solutions, siteSettings }
})
const { pageConfig } = useWebsiteConfig()
const managedPage = pageConfig('contact')
const siteUrl = String(runtimeConfig.public.siteUrl).replace(/\/$/, '')
usePageSeo(computed(() => ({
  title: managedPage.value?.headline ? `${managedPage.value.headline} | ExampleCorp` : `${t('contact.title')} | ExampleCorp`,
  description: managedPage.value?.summary || t('contact.subtitle'),
  path: '/contact',
  locale: locale.value,
  breadcrumbs: [
    { name: t('nav.home'), path: '/' },
    { name: t('contact.title'), path: '/contact' },
  ],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: managedPage.value?.headline || t('contact.title'),
    description: managedPage.value?.summary || t('contact.subtitle'),
    url: `${siteUrl}${localizePath('/contact', locale.value)}`,
    mainEntity: { '@id': `${siteUrl}/#organization` },
  },
})))
</script>

<template>
  <ContactView
    :initial-categories="contactData?.categories"
    :initial-solutions="contactData?.solutions"
    :initial-site-settings="contactData?.siteSettings"
  />
</template>
