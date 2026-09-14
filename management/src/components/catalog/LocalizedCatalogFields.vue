<script setup lang="ts">
import { computed, defineAsyncComponent, reactive, watch } from 'vue'
import type {
  CatalogKind,
  AssuranceItem,
  DeliveryCaseStructuredContent,
  DeliveryChallenge,
  FulfillmentItem,
  LocalizedPayload,
  ProductSpecification,
  ProcessItem,
  SolutionDocumentSection,
} from '../../types/catalog'
import { cleanFulfillmentItems, cleanHighlights, cleanProcessItems, cleanSpecifications, normalizeFulfillmentItems } from './catalogProductManagementData'
import ProductImageManager from './ProductImageManager.vue'
import FulfillmentItemsEditor from './FulfillmentItemsEditor.vue'
import AssuranceItemsEditor from './AssuranceItemsEditor.vue'
import HighlightsEditor from './HighlightsEditor.vue'
import SpecificationsEditor from './SpecificationsEditor.vue'
import ProcessItemsEditor from './ProcessItemsEditor.vue'
import SeoGeoFieldsEditor from './SeoGeoFieldsEditor.vue'
import DeliveryCaseSectionsEditor from './DeliveryCaseSectionsEditor.vue'
import SolutionSectionsEditor from './SolutionSectionsEditor.vue'
import {
  cleanDeliveryCaseContent,
  cleanSolutionSections,
  deliveryCaseContentToHtml,
  normalizeDeliveryCaseContent,
  normalizeSolutionSections,
  solutionSectionsToHtml,
} from './structuredContentData'

const RichTextEditor = defineAsyncComponent(() => import('./RichTextEditor.vue'))

const props = withDefaults(defineProps<{
  kind: CatalogKind
  token: string
  locale?: 'id' | 'en'
  mediaImages?: string[]
  readonly?: boolean
}>(), {
  locale: 'id',
  readonly: false,
})

const model = defineModel<LocalizedPayload>({ default: () => ({}) })

const form = reactive({
  name: '',
  title: '',
  summary: '',
  description: '',
  content: '',
  source: '',
  client_name: '',
  industry: '',
  project_overview: '',
  indonesia_fit: '',
  professional_configuration: '',
  key_parameter_table: [] as string[][],
  delivery_challenges: [] as DeliveryChallenge[],
  project_results: '',
  document_sections: [] as SolutionDocumentSection[],
  moq: '',
  tag: '',
  fulfillment_title: '',
  fulfillment_copy: '',
  fulfillment_methods: '',
  fulfillment_items: [] as FulfillmentItem[],
  assurance_items: [] as AssuranceItem[],
  process_items: [] as ProcessItem[],
  highlights: [] as string[],
  specifications: [] as ProductSpecification[],
  seo_title: '',
  seo_description: '',
  answer_summary: '',
  author_name: '',
  technical_reviewer: '',
  evidence_urls: [] as string[],
  standards: [] as string[],
  applicable_markets: [] as string[],
  unsuitable_conditions: [] as string[],
})

let isResetting = false

const scalarKeys = [
  'name', 'title', 'summary', 'description', 'content', 'source', 'client_name', 'industry', 'project_overview',
  'moq', 'tag', 'fulfillment_title', 'fulfillment_copy', 'fulfillment_methods',
  'seo_title', 'seo_description', 'answer_summary',
  'author_name', 'technical_reviewer',
] as const

const deliveryCaseContent = computed<DeliveryCaseStructuredContent>({
  get: () => ({
    project_overview: form.project_overview,
    indonesia_fit: form.indonesia_fit,
    professional_configuration: form.professional_configuration,
    key_parameter_table: form.key_parameter_table,
    delivery_challenges: form.delivery_challenges,
    project_results: form.project_results,
  }),
  set: (value) => {
    form.project_overview = value.project_overview
    form.indonesia_fit = value.indonesia_fit
    form.professional_configuration = value.professional_configuration
    form.key_parameter_table = value.key_parameter_table.map(row => [...row])
    form.delivery_challenges = value.delivery_challenges.map(item => ({ ...item }))
    form.project_results = value.project_results
  },
})

function reset(value: LocalizedPayload) {
  isResetting = true
  for (const key of scalarKeys) {
    form[key] = String(value[key] ?? '')
  }
  form.fulfillment_items = normalizeFulfillmentItems(
    Array.isArray(value.fulfillment_items) ? value.fulfillment_items as unknown as FulfillmentItem[] : [],
    Array.isArray(value.fulfillment_methods) ? value.fulfillment_methods.map(String) : [],
  )
  form.highlights = Array.isArray(value.highlights) ? value.highlights.map(String) : []
  form.assurance_items = Array.isArray(value.assurance_items)
    ? (value.assurance_items as AssuranceItem[]).map(item => ({ ...item }))
    : []
  form.process_items = Array.isArray(value.process_items)
    ? (value.process_items as ProcessItem[]).map(item => ({ ...item }))
    : []
  form.evidence_urls = Array.isArray(value.evidence_urls) ? value.evidence_urls.map(String) : []
  form.standards = Array.isArray(value.standards) ? value.standards.map(String) : []
  form.applicable_markets = Array.isArray(value.applicable_markets) ? value.applicable_markets.map(String) : []
  form.unsuitable_conditions = Array.isArray(value.unsuitable_conditions) ? value.unsuitable_conditions.map(String) : []
  form.specifications = Array.isArray(value.specifications)
    ? value.specifications.filter(item => item && typeof item === 'object').map(item => ({
        label: String((item as Record<string, unknown>).label ?? ''),
        value: String((item as Record<string, unknown>).value ?? ''),
      }))
    : []
  form.document_sections = normalizeSolutionSections(
    Array.isArray(value.document_sections) ? value.document_sections as SolutionDocumentSection[] : undefined,
    props.locale,
    form.content,
  )
  deliveryCaseContent.value = normalizeDeliveryCaseContent({
    project_overview: value.project_overview as string | undefined,
    indonesia_fit: value.indonesia_fit as string | undefined,
    professional_configuration: value.professional_configuration as string | undefined,
    key_parameter_table: Array.isArray(value.key_parameter_table) ? value.key_parameter_table as string[][] : undefined,
    delivery_challenges: Array.isArray(value.delivery_challenges) ? value.delivery_challenges as DeliveryChallenge[] : undefined,
    project_results: value.project_results as string | undefined,
  }, props.locale)
  queueMicrotask(() => { isResetting = false })
}

function serialize(): LocalizedPayload {
  if (props.kind === 'categories') {
    return {
      name: form.name.trim(),
    }
  }
  if (props.kind === 'products') {
    return {
      seo_title: form.seo_title.trim(),
      seo_description: form.seo_description.trim(),
      answer_summary: form.answer_summary.trim(),
      author_name: form.author_name.trim(),
      technical_reviewer: form.technical_reviewer.trim(),
      evidence_urls: cleanHighlights(form.evidence_urls),
      standards: cleanHighlights(form.standards),
      applicable_markets: cleanHighlights(form.applicable_markets),
      unsuitable_conditions: cleanHighlights(form.unsuitable_conditions),
      name: form.name.trim(),
      summary: form.summary.trim(),
      description: form.description.trim(),
      highlights: cleanHighlights(form.highlights),
      specifications: cleanSpecifications(form.specifications),
      moq: form.moq.trim(),
      tag: form.tag.trim(),
      fulfillment_methods: [],
      fulfillment_items: cleanFulfillmentItems(form.fulfillment_items),
      assurance_items: form.assurance_items.map(item => ({ duration: item.duration?.trim() ?? '', title: item.title.trim(), copy: item.copy?.trim() ?? '' })).filter(item => item.title),
      process_items: cleanProcessItems(form.process_items),
      fulfillment_title: form.fulfillment_title.trim(),
      fulfillment_copy: form.fulfillment_copy.trim(),
    }
  }
  if (props.kind === 'news') {
    return {
      seo_title: form.seo_title.trim(),
      seo_description: form.seo_description.trim(),
      answer_summary: form.answer_summary.trim(),
      author_name: form.author_name.trim(),
      technical_reviewer: form.technical_reviewer.trim(),
      evidence_urls: cleanHighlights(form.evidence_urls),
      standards: cleanHighlights(form.standards),
      applicable_markets: cleanHighlights(form.applicable_markets),
      unsuitable_conditions: cleanHighlights(form.unsuitable_conditions),
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content.trim(),
      source: form.source.trim(),
    }
  }
  if (props.kind === 'delivery-cases') {
    const structured = cleanDeliveryCaseContent(deliveryCaseContent.value)
    return {
      seo_title: form.seo_title.trim(),
      seo_description: form.seo_description.trim(),
      answer_summary: form.answer_summary.trim(),
      author_name: form.author_name.trim(),
      technical_reviewer: form.technical_reviewer.trim(),
      evidence_urls: cleanHighlights(form.evidence_urls),
      standards: cleanHighlights(form.standards),
      applicable_markets: cleanHighlights(form.applicable_markets),
      unsuitable_conditions: cleanHighlights(form.unsuitable_conditions),
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: deliveryCaseContentToHtml(structured, props.locale),
      ...structured,
      client_name: form.client_name.trim(),
      industry: form.industry.trim(),
    }
  }
  const sections = cleanSolutionSections(form.document_sections)
  return {
    seo_title: form.seo_title.trim(),
    seo_description: form.seo_description.trim(),
    answer_summary: form.answer_summary.trim(),
    author_name: form.author_name.trim(),
    technical_reviewer: form.technical_reviewer.trim(),
    evidence_urls: cleanHighlights(form.evidence_urls),
    standards: cleanHighlights(form.standards),
    applicable_markets: cleanHighlights(form.applicable_markets),
    unsuitable_conditions: cleanHighlights(form.unsuitable_conditions),
    title: form.title.trim(),
    summary: form.summary.trim(),
    content: solutionSectionsToHtml(sections),
    document_sections: sections,
    detailed_description: sections[0]?.type === 'paragraph' ? sections[0].content ?? '' : '',
    pitfalls: sections[5]?.type === 'list' ? sections[5].items ?? [] : [],
    core_parameters: sections[6]?.type === 'paragraph' ? [{ label: sections[6].title, value: sections[6].content ?? '' }] : [],
    special_contributions: sections[7]?.type === 'list' ? sections[7].items ?? [] : [],
    benefits: sections[8]?.type === 'list' ? sections[8].items ?? [] : [],
  }
}

watch(model, value => reset(value ?? {}), { immediate: true, deep: true })
watch(form, () => {
  if (!isResetting) model.value = serialize()
}, { deep: true })
</script>

<template>
  <section class="localized-catalog-fields">
    <div class="localized-fields-heading">
      <strong>{{ locale === 'en' ? 'English' : 'Bahasa Indonesia' }}</strong>
    </div>

    <template v-if="kind === 'categories'">
      <label>分类名称<input v-model="form.name" :disabled="readonly" /></label>
    </template>

    <template v-else-if="kind === 'products'">
      <label>产品名称<input v-model="form.name" :disabled="readonly" /></label>
      <label>功能用途（应用场景）<textarea v-model="form.summary" rows="3" :disabled="readonly" /></label>
      <div class="rich-editor-field product-description-editor">
        <div class="rich-editor-field-heading">
          <span>商品详情</span>
          <small>支持标题层级、正文、字号、颜色、对齐、列表、表格、链接和图片</small>
        </div>
        <RichTextEditor v-model="form.description" :token="token" :readonly="readonly" :placeholder="locale === 'en' ? 'Enter product details' : 'Masukkan detail produk'" />
      </div>
      <ProductImageManager
        :images="mediaImages ?? []"
        :token="token"
        :readonly="true"
        title="产品图片"
      />
      <div class="field-grid two">
        <label>MOQ<input v-model="form.moq" :disabled="readonly" /></label>
        <label>标签<input v-model="form.tag" :disabled="readonly" /></label>
      </div>
      <section class="fulfillment-config">
        <strong>交付与物流配置</strong>
        <label>交付标题<input v-model="form.fulfillment_title" :disabled="readonly" /></label>
        <label>交付文案<textarea v-model="form.fulfillment_copy" rows="4" :disabled="readonly" /></label>
        <FulfillmentItemsEditor v-model="form.fulfillment_items" :readonly="readonly" />
        <AssuranceItemsEditor v-model="form.assurance_items" :readonly="readonly" />
      </section>
      <HighlightsEditor v-model="form.highlights" :readonly="readonly" />
      <SpecificationsEditor v-model="form.specifications" :readonly="readonly" />
      <ProcessItemsEditor v-model="form.process_items" :readonly="readonly" />
    </template>

    <template v-else-if="kind === 'news'">
      <label>资讯标题<input v-model="form.title" :disabled="readonly" /></label>
      <label>摘要<textarea v-model="form.summary" rows="3" :disabled="readonly" /></label>
      <ProductImageManager :images="mediaImages ?? []" :token="token" :readonly="true" title="资讯图片" :max-images="1" />
      <div class="rich-editor-field"><span>正文</span>
        <RichTextEditor v-model="form.content" :token="token" :readonly="readonly" :placeholder="locale === 'en' ? 'Enter article content' : 'Masukkan isi artikel'" />
      </div>
      <label>来源<input v-model="form.source" :disabled="readonly" /></label>
    </template>

    <template v-else-if="kind === 'delivery-cases'">
      <label>案例标题<input v-model="form.title" :disabled="readonly" /></label>
      <label>摘要<textarea v-model="form.summary" rows="3" :disabled="readonly" /></label>
      <ProductImageManager :images="mediaImages ?? []" :token="token" :readonly="true" title="案例图片" />
      <DeliveryCaseSectionsEditor v-model="deliveryCaseContent" :token="token" :locale="locale" :readonly="readonly" />
      <div class="field-grid two">
        <label>客户<input v-model="form.client_name" :disabled="readonly" /></label>
        <label>行业<input v-model="form.industry" :disabled="readonly" /></label>
      </div>
    </template>

    <template v-else>
      <label>方案标题<input v-model="form.title" :disabled="readonly" /></label>
      <label>摘要<textarea v-model="form.summary" rows="3" :disabled="readonly" /></label>
      <ProductImageManager :images="mediaImages ?? []" :token="token" :readonly="true" title="场景图片" :max-images="2" />
      <SolutionSectionsEditor v-model="form.document_sections" :token="token" :readonly="readonly" />
    </template>

    <SeoGeoFieldsEditor
      v-if="kind !== 'categories'"
      v-model:seo-title="form.seo_title"
      v-model:seo-description="form.seo_description"
      v-model:answer-summary="form.answer_summary"
      v-model:author-name="form.author_name"
      v-model:technical-reviewer="form.technical_reviewer"
      v-model:evidence-urls="form.evidence_urls"
      v-model:standards="form.standards"
      v-model:applicable-markets="form.applicable_markets"
      v-model:unsuitable-conditions="form.unsuitable_conditions"
      :show-indexable="false"
      :readonly="readonly"
    />
  </section>
</template>

<style scoped>
.localized-catalog-fields {
  display: grid;
  gap: 16px;
  padding: 18px;
  border-left: 3px solid #138a5b;
  background: #f7fbf9;
}

.localized-fields-heading strong,
.localized-fields-heading p { margin: 0; }
.localized-fields-heading p { margin-top: 4px; color: #52606d; }
</style>
