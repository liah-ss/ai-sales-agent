<script setup lang="ts">
import StringListEditor from './StringListEditor.vue'

const props = withDefaults(defineProps<{
  readonly?: boolean
  showIndexable?: boolean
}>(), {
  showIndexable: true,
})

const seoTitle = defineModel<string>('seoTitle', { default: '' })
const seoDescription = defineModel<string>('seoDescription', { default: '' })
const answerSummary = defineModel<string>('answerSummary', { default: '' })
const authorName = defineModel<string>('authorName', { default: '' })
const technicalReviewer = defineModel<string>('technicalReviewer', { default: '' })
const evidenceUrls = defineModel<string[]>('evidenceUrls', { default: () => [] })
const standards = defineModel<string[]>('standards', { default: () => [] })
const applicableMarkets = defineModel<string[]>('applicableMarkets', { default: () => [] })
const unsuitableConditions = defineModel<string[]>('unsuitableConditions', { default: () => [] })
const isIndexable = defineModel<boolean>('isIndexable', { default: true })
</script>

<template>
  <section class="seo-geo-fields">
    <div class="seo-geo-heading">
      <strong>SEO 与内容可信度</strong>
      <p>用于搜索结果摘要、AI 答案引用及内容责任标注；留空时前台使用标题和摘要。</p>
    </div>
    <label>SEO 标题<input v-model="seoTitle" maxlength="180" :disabled="props.readonly" /></label>
    <label>SEO 描述<textarea v-model="seoDescription" maxlength="320" rows="3" :disabled="props.readonly" /></label>
    <label>答案摘要<textarea v-model="answerSummary" rows="4" :disabled="props.readonly" /></label>
    <div class="field-grid two">
      <label>作者/内容负责人<input v-model="authorName" maxlength="120" :disabled="props.readonly" /></label>
      <label>技术审核人<input v-model="technicalReviewer" maxlength="120" :disabled="props.readonly" /></label>
    </div>
    <StringListEditor v-model="standards" title="标准与规范" :readonly="props.readonly" />
    <StringListEditor v-model="applicableMarkets" title="适用市场" :readonly="props.readonly" />
    <StringListEditor v-model="unsuitableConditions" title="不适用条件" :readonly="props.readonly" />
    <StringListEditor v-model="evidenceUrls" title="证据与来源链接" :readonly="props.readonly" />
    <label v-if="props.showIndexable" class="check-field">
      <input v-model="isIndexable" type="checkbox" :disabled="props.readonly" /> 允许搜索引擎收录
    </label>
  </section>
</template>

<style scoped>
.seo-geo-fields {
  display: grid;
  gap: 16px;
  padding: 18px 0;
  border-top: 1px solid #d9e1e8;
}

.seo-geo-heading strong,
.seo-geo-heading p { margin: 0; }
.seo-geo-heading p { margin-top: 4px; color: #52606d; }
</style>
