<script setup lang="ts">
import NewsView from '../../../views/NewsView.vue'
import { useI18n } from '../../../composables/useI18n'
import type { NewsListResponse } from '../../../types/catalog'

const route = useRoute()
const { locale, t } = useI18n()
const apiHeaders = useApiRequestHeaders()
const page = computed(() => Math.max(1, Number(route.params.page || route.query.page) || 1))
const descriptions = {
  'zh-CN': '阅读面向印度尼西亚工业设备采购与工程交付的行业资讯，了解标准合规、选型方法、供应链和项目实施趋势。',
  en: 'Read industry insights for Indonesian power equipment procurement and project delivery, including standards, specification, supply chain and implementation trends.',
  id: 'Baca wawasan industri tentang pengadaan peralatan listrik dan pengiriman proyek di Indonesia, termasuk standar, spesifikasi, rantai pasok, dan tren implementasi.',
}
const { data } = await useFetch<NewsListResponse>('/api/news', {
  query: { page, page_size: 8 },
  key: `news-${locale.value}-${page.value}`,
  headers: apiHeaders,
})
if (!data.value) throw createError({ statusCode: 503, statusMessage: t('news.error') })
const totalPages = computed(() => Math.max(1, Math.ceil(data.value!.total / 8)))
if (page.value > totalPages.value) throw createError({ statusCode: 404, statusMessage: t('news.notFound') })
const pagePath = (targetPage: number) => targetPage > 1 ? `/news/page/${targetPage}` : '/news'
const pageSuffix = computed(() => page.value > 1 ? ` · ${page.value}` : '')
const pageDescriptionSuffix = computed(() => page.value > 1
  ? ({
      'zh-CN': ` 第 ${page.value} 页。`,
      en: ` Page ${page.value}.`,
      id: ` Halaman ${page.value}.`,
    })[locale.value]
  : '')
usePageSeo(computed(() => ({
  title: `${t('news.title')}${pageSuffix.value} | ExampleCorp`,
  description: `${descriptions[locale.value]}${pageDescriptionSuffix.value}`,
  path: pagePath(page.value),
  locale: locale.value,
  previousPath: page.value > 1 ? pagePath(page.value - 1) : undefined,
  nextPath: page.value < totalPages.value ? pagePath(page.value + 1) : undefined,
  breadcrumbs: [
    { name: t('nav.home'), path: '/' },
    { name: t('news.title'), path: '/news' },
  ],
  schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: t('news.title') },
})))
</script>

<template>
  <NewsView :initial-response="data" />
</template>
