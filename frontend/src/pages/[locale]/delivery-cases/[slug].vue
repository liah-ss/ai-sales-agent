<script setup lang="ts">
import DeliveryCaseDetailView from '../../../views/DeliveryCaseDetailView.vue'
import { useI18n } from '../../../composables/useI18n'
import type { DeliveryCase } from '../../../types/catalog'
import { availableContentLocales, hasLocalizedField, localizedField, plainText } from '../../../utils/seoContent'

const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug))
const { locale, t } = useI18n()
const apiHeaders = useApiRequestHeaders()
const { data, error } = await useFetch<DeliveryCase>(() => `/api/delivery-cases/${slug.value}`, {
  key: `delivery-case-${locale.value}-${slug.value}`,
  headers: apiHeaders,
})
if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: t('deliveryCases.notFound') })

const title = computed(() => String(localizedField(data.value!, locale.value, 'title')))
const summary = computed(() => String(localizedField(data.value!, locale.value, 'summary')))
const seoTitle = computed(() => `${plainText(localizedField(data.value!, locale.value, 'seo_title') || title.value, 160)} | ExampleCorp`)
const seoDescription = computed(() => plainText(
  localizedField(data.value!, locale.value, 'seo_description')
  || localizedField(data.value!, locale.value, 'answer_summary')
  || summary.value,
))
usePageSeo(computed(() => ({
  title: seoTitle.value,
  description: seoDescription.value,
  path: `/delivery-cases/${slug.value}`,
  locale: locale.value,
  image: data.value?.thumbnail_url || undefined,
  publishedAt: data.value?.delivered_at,
  updatedAt: data.value?.content_updated_at || undefined,
  robots: data.value!.is_indexable && hasLocalizedField(data.value!, locale.value, 'title') ? 'index,follow' : 'noindex,follow',
  availableLocales: availableContentLocales(data.value!, 'title'),
  breadcrumbs: [
    { name: t('nav.home'), path: '/' },
    { name: t('deliveryCases.title'), path: '/delivery-cases' },
    { name: title.value, path: `/delivery-cases/${slug.value}` },
  ],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title.value,
    description: plainText(localizedField(data.value!, locale.value, 'answer_summary') || summary.value, 500),
    image: data.value?.thumbnail_url,
    datePublished: data.value?.delivered_at,
    about: data.value?.industry,
    contentLocation: data.value?.location,
    publisher: { '@id': `${config.public.siteUrl}/#organization` },
    ...(data.value!.content_updated_at ? { dateModified: data.value!.content_updated_at } : {}),
    ...(data.value!.author_name ? { author: { '@type': 'Person', name: data.value!.author_name } } : {}),
    ...(data.value!.technical_reviewer ? { reviewedBy: { '@type': 'Person', name: data.value!.technical_reviewer } } : {}),
  },
})))
</script>

<template>
  <DeliveryCaseDetailView :initial-delivery-case="data" />
</template>
