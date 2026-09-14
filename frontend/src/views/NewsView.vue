<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NewsCard from '../components/news/NewsCard.vue'
import PaginationControls from '../components/common/PaginationControls.vue'
import { useI18n } from '../composables/useI18n'
import type { NewsArticleSummary, NewsListResponse } from '../types/catalog'

const props = defineProps<{
  initialResponse?: NewsListResponse | null
}>()

const pageSize = 8

const route = useRoute()
const { locale, t } = useI18n()

const articles = computed<NewsArticleSummary[]>(() => props.initialResponse?.items ?? [])
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

</script>

<template>
  <section class="news-page">
    <div class="news-page-inner">
      <header class="news-section-heading">
        <h1>{{ t('news.title') }}{{ pageSuffix }}</h1>
        <LocalizedLink to="/news">{{ t('news.viewMore') }}</LocalizedLink>
      </header>

      <div class="news-card-grid">
        <NewsCard v-for="article in articles" :key="article.slug" :article="article" />
      </div>

      <PaginationControls
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        :label="t('news.title')"
        :previous-label="t('products.previousPage')"
        :next-label="t('products.nextPage')"
        :page-label="t('products.pageNumber', '', { page: '{page}' })"
      />
    </div>
  </section>
</template>
