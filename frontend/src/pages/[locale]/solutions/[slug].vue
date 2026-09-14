<script setup lang="ts">
import SolutionDetailView from '../../../views/SolutionDetailView.vue'
import { useI18n } from '../../../composables/useI18n'
import type { Solution, SolutionSummary } from '../../../types/catalog'
import { localizePath } from '../../../utils/localeRouting'
import { availableContentLocales, hasLocalizedField, localizedField, plainText } from '../../../utils/seoContent'

const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug))
const { locale, t } = useI18n()
const apiHeaders = useApiRequestHeaders()
const { data, error } = await useAsyncData(`solution-${locale.value}-${slug.value}`, async () => {
  const [solution, solutions] = await Promise.all([
    $fetch<Solution>(`/api/solutions/${slug.value}`, { headers: apiHeaders }),
    $fetch<SolutionSummary[]>('/api/solutions', { headers: apiHeaders }),
  ])
  return { solution, solutions }
})
if (error.value || !data.value?.solution) throw createError({ statusCode: 404, statusMessage: t('solutions.error') })

const title = computed(() => String(localizedField(data.value!.solution, locale.value, 'title')))
const summary = computed(() => String(localizedField(data.value!.solution, locale.value, 'summary')))
const seoTitle = computed(() => `${plainText(localizedField(data.value!.solution, locale.value, 'seo_title') || title.value, 160)} | ExampleCorp`)
const seoDescription = computed(() => plainText(
  localizedField(data.value!.solution, locale.value, 'seo_description')
  || localizedField(data.value!.solution, locale.value, 'answer_summary')
  || summary.value,
))
const siteUrl = String(config.public.siteUrl).replace(/\/$/, '')
const canonicalUrl = computed(() => `${siteUrl}${localizePath(`/solutions/${slug.value}`, locale.value)}`)
usePageSeo(computed(() => ({
  title: seoTitle.value,
  description: seoDescription.value,
  path: `/solutions/${slug.value}`,
  locale: locale.value,
  image: data.value?.solution.images[0],
  robots: data.value!.solution.is_indexable && hasLocalizedField(data.value!.solution, locale.value, 'title') ? 'index,follow' : 'noindex,follow',
  availableLocales: availableContentLocales(data.value!.solution, 'title'),
  updatedAt: data.value!.solution.content_updated_at || undefined,
  breadcrumbs: [
    { name: t('nav.home'), path: '/' },
    { name: t('solutions.title'), path: '/solutions' },
    { name: title.value, path: `/solutions/${slug.value}` },
  ],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title.value,
    description: plainText(localizedField(data.value!.solution, locale.value, 'answer_summary') || summary.value, 500),
    url: canonicalUrl.value,
    breadcrumb: { '@id': `${canonicalUrl.value}#breadcrumb` },
    publisher: { '@id': `${siteUrl}/#organization` },
    ...(data.value!.solution.author_name ? { author: { '@type': 'Person', name: data.value!.solution.author_name } } : {}),
    ...(data.value!.solution.technical_reviewer ? { reviewedBy: { '@type': 'Person', name: data.value!.solution.technical_reviewer } } : {}),
    ...(data.value!.solution.content_updated_at ? { dateModified: data.value!.solution.content_updated_at } : {}),
  },
})))
</script>

<template>
  <SolutionDetailView :initial-solution="data?.solution" :initial-solutions="data?.solutions" />
</template>
