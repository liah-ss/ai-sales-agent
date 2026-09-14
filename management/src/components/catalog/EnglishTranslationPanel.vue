<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type {
  CatalogKind,
  DeliveryCaseStructuredContent,
  DeliveryChallenge,
  LocalizedPayload,
  SolutionDocumentSection,
} from '../../types/catalog'
import DeliveryCaseSectionsEditor from './DeliveryCaseSectionsEditor.vue'
import ProductImageManager from './ProductImageManager.vue'
import SolutionSectionsEditor from './SolutionSectionsEditor.vue'
import { normalizeDeliveryCaseContent, normalizeSolutionSections } from './structuredContentData'

const RichTextEditor = defineAsyncComponent(() => import('./RichTextEditor.vue'))

const props = withDefaults(defineProps<{
  value?: LocalizedPayload
  kind: CatalogKind
  mediaImages?: string[]
}>(), {
  value: () => ({}),
})
const title = computed(() => String(props.value.title ?? props.value.name ?? ''))
const summary = computed(() => String(props.value.summary ?? ''))
const content = computed(() => String(props.value.content ?? props.value.description ?? ''))
const source = computed(() => String(props.value.source ?? ''))
const clientName = computed(() => String(props.value.client_name ?? ''))
const industry = computed(() => String(props.value.industry ?? ''))
const solutionSections = computed<SolutionDocumentSection[]>({
  get: () => normalizeSolutionSections(
    Array.isArray(props.value.document_sections) ? props.value.document_sections as SolutionDocumentSection[] : undefined,
    'en',
    content.value,
  ),
  set: () => {},
})
const deliveryContent = computed<DeliveryCaseStructuredContent>({
  get: () => normalizeDeliveryCaseContent({
    project_overview: props.value.project_overview as string | undefined,
    indonesia_fit: props.value.indonesia_fit as string | undefined,
    professional_configuration: props.value.professional_configuration as string | undefined,
    key_parameter_table: Array.isArray(props.value.key_parameter_table) ? props.value.key_parameter_table as string[][] : undefined,
    delivery_challenges: Array.isArray(props.value.delivery_challenges) ? props.value.delivery_challenges as DeliveryChallenge[] : undefined,
    project_results: props.value.project_results as string | undefined,
  }, 'en'),
  set: () => {},
})
</script>

<template>
  <section class="english-translation-panel">
    <label v-if="kind === 'categories'">分类名称<input :value="title" readonly /></label>
    <template v-else-if="kind === 'solutions'">
      <div class="field-grid two">
        <label>场景名称<input :value="title" readonly /></label>
      </div>
      <label>首屏摘要<textarea :value="summary" rows="3" readonly /></label>
      <ProductImageManager
        :images="mediaImages ?? []"
        token=""
        :readonly="true"
        title="场景图片"
        :max-images="2"
      />
      <SolutionSectionsEditor v-model="solutionSections" token="" :readonly="true" />
    </template>
    <template v-else-if="kind === 'news'">
      <div class="field-grid two">
        <label>资讯标题<input :value="title" readonly /></label>
      </div>
      <label>摘要<textarea :value="summary" rows="3" readonly /></label>
      <ProductImageManager :images="mediaImages ?? []" token="" :readonly="true" title="资讯图片" :max-images="1" />
      <div class="rich-editor-field">
        <span>正文内容</span>
        <RichTextEditor :model-value="content" token="" :readonly="true" />
      </div>
      <label>资讯来源<input :value="source" readonly /></label>
    </template>
    <template v-else-if="kind === 'delivery-cases'">
      <div class="field-grid two">
        <label>案例标题<input :value="title" readonly /></label>
      </div>
      <label>摘要<textarea :value="summary" rows="3" readonly /></label>
      <ProductImageManager :images="mediaImages ?? []" token="" :readonly="true" title="案例图片" />
      <DeliveryCaseSectionsEditor v-model="deliveryContent" token="" locale="en" :readonly="true" />
      <div class="field-grid two">
        <label>客户名称<input :value="clientName" readonly /></label>
        <label>行业场景<input :value="industry" readonly /></label>
      </div>
    </template>
    <template v-else>
      <div class="field-grid two">
        <label>标题或名称<input :value="title" readonly /></label>
        <label>摘要<textarea :value="summary" rows="3" readonly /></label>
      </div>
      <ProductImageManager :images="mediaImages ?? []" token="" :readonly="true" title="产品图片" />
      <label>正文<textarea :value="content" rows="12" readonly /></label>
    </template>
  </section>
</template>

<style scoped>
.english-translation-panel {
  display: grid;
  gap: 16px;
  padding: 18px;
  border-left: 3px solid #2d6ea4;
  background: #f7fafc;
}

</style>
