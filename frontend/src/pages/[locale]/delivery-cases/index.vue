<script setup lang="ts">
import DeliveryCasesView from '../../../views/DeliveryCasesView.vue'
import { useI18n } from '../../../composables/useI18n'
import type { DeliveryCaseListResponse } from '../../../types/catalog'

const route = useRoute()
const { locale, t } = useI18n()
const apiHeaders = useApiRequestHeaders()
const page = computed(() => Math.max(1, Number(route.params.page || route.query.page) || 1))
const descriptions = {
  'zh-CN': '查看 ExampleCorp 在印度尼西亚及海外项目中的真实交付案例，涵盖设备选型、质量控制、技术资料、物流协调与现场支持。',
  en: 'Review verified ExampleCorp delivery cases covering equipment selection, quality control, technical documentation, logistics coordination and site support.',
  id: 'Tinjau kasus pengiriman terverifikasi ExampleCorp yang mencakup pemilihan peralatan, kontrol kualitas, dokumen teknis, koordinasi logistik, dan dukungan lokasi.',
}
const { data } = await useFetch<DeliveryCaseListResponse>('/api/delivery-cases', {
  query: { page, page_size: 8 },
  key: `delivery-cases-${locale.value}-${page.value}`,
  headers: apiHeaders,
})
if (!data.value) throw createError({ statusCode: 503, statusMessage: t('deliveryCases.error') })
const totalPages = computed(() => Math.max(1, Math.ceil(data.value!.total / 8)))
if (page.value > totalPages.value) throw createError({ statusCode: 404, statusMessage: t('deliveryCases.notFound') })
const pagePath = (targetPage: number) => targetPage > 1 ? `/delivery-cases/page/${targetPage}` : '/delivery-cases'
const pageSuffix = computed(() => page.value > 1 ? ` · ${page.value}` : '')
const pageDescriptionSuffix = computed(() => page.value > 1
  ? ({
      'zh-CN': ` 第 ${page.value} 页。`,
      en: ` Page ${page.value}.`,
      id: ` Halaman ${page.value}.`,
    })[locale.value]
  : '')

usePageSeo(computed(() => ({
  title: `${t('deliveryCases.title')}${pageSuffix.value} | ExampleCorp`,
  description: `${descriptions[locale.value]}${pageDescriptionSuffix.value}`,
  path: pagePath(page.value),
  locale: locale.value,
  previousPath: page.value > 1 ? pagePath(page.value - 1) : undefined,
  nextPath: page.value < totalPages.value ? pagePath(page.value + 1) : undefined,
  breadcrumbs: [
    { name: t('nav.home'), path: '/' },
    { name: t('deliveryCases.title'), path: '/delivery-cases' },
  ],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('deliveryCases.title'),
  },
})))
</script>

<template>
  <DeliveryCasesView :initial-response="data" />
</template>
