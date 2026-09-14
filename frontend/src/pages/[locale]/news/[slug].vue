<script setup lang="ts">
import NewsDetailView from '../../../views/NewsDetailView.vue'
import { useI18n } from '../../../composables/useI18n'
import type { NewsArticle } from '../../../types/catalog'
import { availableContentLocales, hasLocalizedField, localizedField, plainText } from '../../../utils/seoContent'

const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug))
const { locale, t } = useI18n()
const apiHeaders = useApiRequestHeaders()
const { data, error } = await useFetch<NewsArticle>(() => `/api/news/${slug.value}`, {
  key: `news-article-${locale.value}-${slug.value}`,
  headers: apiHeaders,
})
if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: t('news.notFound') })

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
  path: `/news/${slug.value}`,
  locale: locale.value,
  image: data.value?.thumbnail_url || undefined,
  ogType: 'article',
  publishedAt: data.value?.published_at,
  updatedAt: data.value?.content_updated_at || undefined,
  robots: data.value!.is_indexable && hasLocalizedField(data.value!, locale.value, 'title') ? 'index,follow' : 'noindex,follow',
  availableLocales: availableContentLocales(data.value!, 'title'),
  breadcrumbs: [
    { name: t('nav.home'), path: '/' },
    { name: t('news.title'), path: '/news' },
    { name: title.value, path: `/news/${slug.value}` },
  ],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title.value,
    description: plainText(localizedField(data.value!, locale.value, 'answer_summary') || summary.value, 500),
    image: data.value?.thumbnail_url,
    datePublished: data.value?.published_at,
    dateModified: data.value?.content_updated_at || data.value?.published_at,
    author: data.value!.author_name
      ? { '@type': 'Person', name: data.value!.author_name }
      : { '@id': `${String(config.public.siteUrl).replace(/\/$/, '')}/#organization` },
    ...(data.value!.technical_reviewer ? { reviewedBy: { '@type': 'Person', name: data.value!.technical_reviewer } } : {}),
    publisher: { '@id': `${config.public.siteUrl}/#organization` },
  },
})))
</script>

<template>
  <NewsDetailView :initial-article="data" />
</template>
