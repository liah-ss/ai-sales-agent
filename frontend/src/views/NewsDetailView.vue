<script setup lang="ts">
import { computed } from 'vue'
import { resolveOptimizedAssetUrl, resolveResponsiveAsset } from '../api/client'
import RichContent from '../components/common/RichContent.vue'
import SeoGeoEvidence from '../components/common/SeoGeoEvidence.vue'
import { useI18n } from '../composables/useI18n'
import { useLocalizedContent } from '../data/localizedContent'
import type { NewsArticle } from '../types/catalog'

const props = defineProps<{
  initialArticle?: NewsArticle | null
}>()

const { t } = useI18n()
const { localizeNewsArticle } = useLocalizedContent()

const article = computed(() => props.initialArticle)
const localizedArticle = computed(() => article.value ? localizeNewsArticle(article.value) : null)
const thumbnail = computed(() => resolveResponsiveAsset(article.value?.thumbnail_url, { widths: [640, 960, 1400] }))
const contentIsHtml = computed(() => /<\/?[a-z][\s\S]*>/i.test(localizedArticle.value?.content ?? ''))
const contentBlocks = computed(() => {
  return localizedArticle.value?.content
    .split('\n')
    .map(row => row.trim())
    .filter(Boolean)
    .map((row) => {
      const imageMatch = row.match(/^!\[[^\]]*]\((.+)\)$/)
      return imageMatch
        ? { type: 'image', value: imageMatch[1] }
        : { type: 'paragraph', value: row }
    }) ?? []
})

</script>

<template>
  <section class="news-detail-page">
    <article v-if="localizedArticle" class="news-detail-article">
      <p class="breadcrumb">
        <LocalizedLink to="/">{{ t('nav.home') }}</LocalizedLink> ›
        <LocalizedLink to="/news">{{ t('news.title') }}</LocalizedLink> ›
        <span>{{ localizedArticle.title }}</span>
      </p>
      <header>
        <span>{{ localizedArticle.source }}</span>
        <h1>{{ localizedArticle.title }}</h1>
        <p>{{ localizedArticle.published_at }} · {{ localizedArticle.source }}</p>
      </header>
      <div class="news-detail-cover">
        <img v-if="thumbnail.src" :src="thumbnail.src" :srcset="thumbnail.srcset || undefined" sizes="(max-width: 900px) 100vw, 960px" :alt="localizedArticle.title" width="1400" height="800" fetchpriority="high" decoding="async" />
      </div>
      <div class="news-detail-content">
        <RichContent v-if="contentIsHtml" :html="localizedArticle.content" />
        <template v-else>
          <template v-for="block in contentBlocks" :key="`${block.type}-${block.value}`">
            <img v-if="block.type === 'image'" :src="resolveOptimizedAssetUrl(block.value, { width: 1400 })" alt="" loading="lazy" decoding="async" />
            <p v-else>{{ block.value }}</p>
          </template>
        </template>
      </div>
      <SeoGeoEvidence :record="localizedArticle" />
    </article>
  </section>
</template>
