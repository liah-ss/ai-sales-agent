<script setup lang="ts">
import { computed } from 'vue'
import { Image, Clock3 } from '@lucide/vue'
import { resolveResponsiveAsset } from '../../api/client'
import { useLocalizedContent } from '../../data/localizedContent'
import type { NewsArticleSummary } from '../../types/catalog'

const props = defineProps<{
  article: NewsArticleSummary
}>()

const { localizeNewsArticle } = useLocalizedContent()
const localizedArticle = computed(() => localizeNewsArticle(props.article))
const thumbnail = computed(() => resolveResponsiveAsset(props.article.thumbnail_url, { widths: [320, 480, 640] }))
const shortTitle = computed(() => localizedArticle.value.title.length > 20 ? `${localizedArticle.value.title.slice(0, 20)}...` : localizedArticle.value.title)
const dateLabel = computed(() => props.article.published_at)
</script>

<template>
  <LocalizedLink class="news-card" :to="`/news/${article.slug}`">
    <div class="news-card-media">
      <img v-if="thumbnail.src" :src="thumbnail.src" :srcset="thumbnail.srcset || undefined" sizes="(max-width: 720px) 100vw, 400px" :alt="localizedArticle.title" width="640" height="400" loading="lazy" decoding="async" />
      <Image v-if="!thumbnail.src" class="news-card-placeholder" />
      <span>{{ localizedArticle.source }}</span>
    </div>
    <div class="news-card-body">
      <h3>{{ shortTitle }}</h3>
      <div class="news-card-meta">
        <span><Clock3 class="news-meta-icon" />{{ dateLabel }}</span>
        <span>{{ localizedArticle.source }}</span>
      </div>
    </div>
  </LocalizedLink>
</template>
