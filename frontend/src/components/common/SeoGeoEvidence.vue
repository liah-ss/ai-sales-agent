<script setup lang="ts">
import { computed } from 'vue'
import type { SeoGeoFields } from '../../types/catalog'
import { useI18n } from '../../composables/useI18n'

const props = defineProps<{
  record: SeoGeoFields
}>()

const { locale } = useI18n()
const labels = computed(() => ({
  'zh-CN': {
    heading: '技术依据与适用范围', answer: '专业摘要', standards: '标准与规范', markets: '适用市场',
    limits: '不适用条件', evidence: '证据与来源', author: '内容负责人', reviewer: '技术审核', updated: '更新时间',
  },
  en: {
    heading: 'Technical basis and applicability', answer: 'Expert summary', standards: 'Standards', markets: 'Applicable markets',
    limits: 'Unsuitable conditions', evidence: 'Evidence and sources', author: 'Content owner', reviewer: 'Technical review', updated: 'Updated',
  },
  id: {
    heading: 'Dasar teknis dan cakupan penerapan', answer: 'Ringkasan ahli', standards: 'Standar', markets: 'Pasar yang sesuai',
    limits: 'Kondisi yang tidak sesuai', evidence: 'Bukti dan sumber', author: 'Penanggung jawab konten', reviewer: 'Tinjauan teknis', updated: 'Diperbarui',
  },
}[locale.value]))

const hasContent = computed(() => Boolean(
  props.record.answer_summary
  || props.record.standards.length
  || props.record.applicable_markets.length
  || props.record.unsuitable_conditions.length
  || props.record.evidence_urls.length
  || props.record.author_name
  || props.record.technical_reviewer,
))

function evidenceLabel(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return url }
}
</script>

<template>
  <section v-if="hasContent" class="seo-geo-evidence" aria-labelledby="seo-geo-evidence-title">
    <h2 id="seo-geo-evidence-title">{{ labels.heading }}</h2>
    <div v-if="record.answer_summary" class="seo-geo-answer">
      <h3>{{ labels.answer }}</h3>
      <p>{{ record.answer_summary }}</p>
    </div>
    <div class="seo-geo-grid">
      <div v-if="record.standards.length">
        <h3>{{ labels.standards }}</h3>
        <ul><li v-for="item in record.standards" :key="item">{{ item }}</li></ul>
      </div>
      <div v-if="record.applicable_markets.length">
        <h3>{{ labels.markets }}</h3>
        <ul><li v-for="item in record.applicable_markets" :key="item">{{ item }}</li></ul>
      </div>
      <div v-if="record.unsuitable_conditions.length">
        <h3>{{ labels.limits }}</h3>
        <ul><li v-for="item in record.unsuitable_conditions" :key="item">{{ item }}</li></ul>
      </div>
      <div v-if="record.evidence_urls.length">
        <h3>{{ labels.evidence }}</h3>
        <ul><li v-for="url in record.evidence_urls" :key="url"><a :href="url" target="_blank" rel="noopener noreferrer">{{ evidenceLabel(url) }}</a></li></ul>
      </div>
    </div>
    <p v-if="record.author_name || record.technical_reviewer || record.content_updated_at" class="seo-geo-meta">
      <span v-if="record.author_name">{{ labels.author }}：{{ record.author_name }}</span>
      <span v-if="record.technical_reviewer">{{ labels.reviewer }}：{{ record.technical_reviewer }}</span>
      <time v-if="record.content_updated_at" :datetime="record.content_updated_at">{{ labels.updated }}：{{ record.content_updated_at.slice(0, 10) }}</time>
    </p>
  </section>
</template>

<style scoped>
.seo-geo-evidence { width: min(1180px, calc(100% - 32px)); margin: 40px auto; padding: 28px 0; border-top: 1px solid #d9e1e8; }
.seo-geo-evidence h2 { margin: 0 0 20px; font-size: 24px; }
.seo-geo-evidence h3 { margin: 0 0 8px; font-size: 16px; }
.seo-geo-answer { max-width: 880px; margin-bottom: 22px; }
.seo-geo-answer p { margin: 0; line-height: 1.8; color: #344054; }
.seo-geo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 36px; }
.seo-geo-grid ul { margin: 0; padding-left: 20px; color: #344054; }
.seo-geo-grid li + li { margin-top: 6px; }
.seo-geo-meta { display: flex; flex-wrap: wrap; gap: 8px 24px; margin: 24px 0 0; color: #667085; font-size: 13px; }
@media (max-width: 720px) { .seo-geo-grid { grid-template-columns: 1fr; } }
</style>
