<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PaginationControls from '../components/common/PaginationControls.vue'
import DeliveryCaseCard from '../components/delivery-case/DeliveryCaseCard.vue'
import { useI18n } from '../composables/useI18n'
import { useLocalizedContent } from '../data/localizedContent'
import type { DeliveryCaseListResponse, DeliveryCaseSummary } from '../types/catalog'

const props = defineProps<{
  initialResponse?: DeliveryCaseListResponse | null
}>()

const pageSize = 8

const route = useRoute()
const { locale, t } = useI18n()
const { localizeDeliveryCase } = useLocalizedContent()

const deliveryCases = computed<DeliveryCaseSummary[]>(() => props.initialResponse?.items ?? [])
const total = computed(() => props.initialResponse?.total ?? 0)

const currentPage = computed(() => {
  const value = route.params.page || (Array.isArray(route.query.page) ? route.query.page[0] : route.query.page)
  const page = Number(value || 1)
  return Number.isFinite(page) && page > 0 ? page : 1
})
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const pageSuffix = computed(() => currentPage.value > 1
  ? ({ 'zh-CN': ` · 第 ${currentPage.value} 页`, en: ` · Page ${currentPage.value}`, id: ` · Halaman ${currentPage.value}` })[locale.value]
  : '')
const localizedDeliveryCases = computed(() => deliveryCases.value.map(localizeDeliveryCase))

</script>

<template>
  <section class="news-page delivery-cases-page">
    <div class="news-page-inner">
      <header class="news-section-heading">
        <div>
          <h1>{{ t('deliveryCases.title') }}{{ pageSuffix }}</h1>
        </div>
        <LocalizedLink to="/delivery-cases">{{ t('deliveryCases.viewMore') }}</LocalizedLink>
      </header>

      <div class="news-card-grid delivery-case-card-grid">
        <DeliveryCaseCard v-for="item in localizedDeliveryCases" :key="item.slug" :delivery-case="item" />
      </div>

      <PaginationControls
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        :label="t('deliveryCases.title')"
        :previous-label="t('products.previousPage')"
        :next-label="t('products.nextPage')"
        :page-label="t('products.pageNumber', '', { page: '{page}' })"
      />
    </div>
  </section>
</template>
