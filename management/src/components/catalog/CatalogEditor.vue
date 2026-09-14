<script setup lang="ts">
import { computed, defineAsyncComponent, reactive, shallowRef, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import ContentImageUploader from './ContentImageUploader.vue'
import ProductImageManager from './ProductImageManager.vue'
import AssuranceItemsEditor from './AssuranceItemsEditor.vue'
import FulfillmentItemsEditor from './FulfillmentItemsEditor.vue'
import HighlightsEditor from './HighlightsEditor.vue'
import PriceTierEditor from './PriceTierEditor.vue'
import ProcessItemsEditor from './ProcessItemsEditor.vue'
import SpecificationsEditor from './SpecificationsEditor.vue'
import LocaleTabs from './LocaleTabs.vue'
import LocalizedCatalogFields from './LocalizedCatalogFields.vue'
import DeliveryCaseSectionsEditor from './DeliveryCaseSectionsEditor.vue'
import SolutionSectionsEditor from './SolutionSectionsEditor.vue'
import SeoGeoFieldsEditor from './SeoGeoFieldsEditor.vue'
import {
  cleanDeliveryCaseContent,
  cleanSolutionSections,
  deliveryCaseContentToHtml,
  normalizeDeliveryCaseContent,
  normalizeSolutionSections,
  solutionSectionsToHtml,
} from './structuredContentData'
import {
  defaultAssuranceItems,
  cleanFulfillmentItems,
  cleanHighlights,
  cleanSpecifications,
  cleanProcessItems,
  defaultProcessItems,
  getProductCategoryOptions,
  normalizeAssuranceItems,
  normalizeFulfillmentItems,
  normalizePriceTiers,
  normalizeProcessItems,
  productCategoryOptionLabel,
  serializeProductPriceTiers,
} from './catalogProductManagementData'
import type {
  CatalogItem,
  CatalogKind,
  ContentLocale,
  CategoryPayload,
  DeliveryCasePayload,
  ManagementCategory,
  ManagementCategorySummary,
  ManagementDeliveryCase,
  ManagementNewsArticle,
  ManagementProduct,
  ManagementSolution,
  NewsArticlePayload,
  ProductPayload,
  SolutionPayload,
  Translations,
  FulfillmentItem,
  PriceTier,
  ProductSpecification,
  SolutionDocumentSection,
  DeliveryChallenge,
  DeliveryCaseStructuredContent,
} from '../../types/catalog'

const RichTextEditor = defineAsyncComponent(() => import('./RichTextEditor.vue'))

const props = defineProps<{
  kind: CatalogKind
  item: CatalogItem | null
  categories: ManagementCategorySummary[]
  isSaving: boolean
  readonly?: boolean
  categoryParentId?: number | null
}>()

const emit = defineEmits<{
  saveCategory: [payload: CategoryPayload, id?: number]
  saveDeliveryCase: [payload: DeliveryCasePayload, id?: number]
  saveNewsArticle: [payload: NewsArticlePayload, id?: number]
  saveProduct: [payload: ProductPayload, id?: number]
  saveSolution: [payload: SolutionPayload, id?: number]
}>()

const authStore = useAuthStore()
const activeLocale = shallowRef<ContentLocale>('zh-CN')
const originalProductDescription = shallowRef('')
const productDescriptionTouched = shallowRef(false)
const form = reactive({
  id: 0,
  product_code: '',
  batch_number: 1,
  name: '',
  title: '',
  slug: '',
  parent_id: 0,
  category_id: 0,
  model: '',
  summary: '',
  description: '',
  content: '',
  thumbnail_url: '',
  client_name: '',
  industry: '',
  project_overview: '',
  indonesia_fit: '',
  professional_configuration: '',
  keyParameterTable: [] as string[][],
  deliveryChallenges: [] as DeliveryChallenge[],
  project_results: '',
  delivered_at: '',
  source: '',
  published_at: '',
  color: '#0f766e',
  main_image: '',
  imagesText: '',
  image_tone: '',
  tag: '',
  tag_more: [] as string[],
  moq: '',
  price_mode: 'contact_only',
  variantsText: '[]',
  showPrices: false,
  priceTiers: defaultPriceTiers(),
  fulfillmentItems: [] as FulfillmentItem[],
  fulfillment_title: '',
  fulfillment_copy: '',
  assuranceItems: defaultAssuranceItems(),
  processItems: defaultProcessItems(),
  sort_order: 0,
  icon: '',
  is_hot: false,
  is_active: true,
  highlights: [] as string[],
  specifications: [] as ProductSpecification[],
  solutionImagesText: '',
  documentSections: [] as SolutionDocumentSection[],
  translations: {} as Translations,
  seo_title: '',
  seo_description: '',
  answer_summary: '',
  author_name: '',
  technical_reviewer: '',
  evidence_urls: [] as string[],
  standards: [] as string[],
  applicable_markets: [] as string[],
  unsuitable_conditions: [] as string[],
  is_indexable: true,
})

const englishStatus = computed(() => form.translations.en?._meta?.status ?? 'missing')
const deliveryCaseContent = computed<DeliveryCaseStructuredContent>({
  get: () => ({
    project_overview: form.project_overview,
    indonesia_fit: form.indonesia_fit,
    professional_configuration: form.professional_configuration,
    key_parameter_table: form.keyParameterTable,
    delivery_challenges: form.deliveryChallenges,
    project_results: form.project_results,
  }),
  set: (value) => {
    form.project_overview = value.project_overview
    form.indonesia_fit = value.indonesia_fit
    form.professional_configuration = value.professional_configuration
    form.keyParameterTable = value.key_parameter_table.map(row => [...row])
    form.deliveryChallenges = value.delivery_challenges.map(item => ({ ...item }))
    form.project_results = value.project_results
  },
})

const isEditing = computed(() => Boolean(props.item))
const heading = computed(() => {
  if (props.kind === 'products') return isEditing.value ? '编辑产品' : '新增产品'
  if (props.kind === 'categories') {
    if (isEditing.value) return '编辑分类'
    return props.categoryParentId ? '新增子分类' : '新增顶级分类'
  }
  if (props.kind === 'news') return isEditing.value ? '编辑资讯' : '新增资讯'
  if (props.kind === 'delivery-cases') return isEditing.value ? '编辑交付案例' : '新增交付案例'
  return isEditing.value ? '编辑解决方案' : '新增解决方案'
})
const productCategoryOptions = computed(() => getProductCategoryOptions(props.categories))
const mediaImages = computed(() => {
  if (props.kind === 'products') return imagesFromText(form.imagesText)
  if (props.kind === 'solutions') return imagesFromText(form.solutionImagesText).slice(0, 2)
  if (props.kind === 'news') return form.thumbnail_url.trim() ? [form.thumbnail_url.trim()] : []
  if (props.kind === 'delivery-cases') return contentImageUrls(form.content)
  return []
})

function categoryOptionLabel(category: ManagementCategorySummary) {
  return productCategoryOptionLabel(category, props.categories)
}

function slugify(value: string, fallback = 'item') {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || `${fallback}-${Date.now()}`
}

function resolvedSlug(primary: string, fallback: string) {
  return form.slug.trim() || slugify(primary, fallback)
}

function listToText(value: string[]) {
  return value.join('\n')
}

function normalizeImages(value: string[]) {
  return Array.from(new Set(value.map(item => item.trim()).filter(Boolean))).slice(0, 8)
}

function imagesFromText(value: string) {
  return normalizeImages(value.split('\n'))
}

function variantsToText(value: ManagementProduct['variants']) {
  return JSON.stringify(value ?? [], null, 2)
}

function defaultPriceTiers(): PriceTier[] {
  return [
    { label: '第一档', range: '1 - 10 个', price: '¥ 6,743.10', visible: true },
    { label: '第二档', range: '11 - 30 个', price: '¥ 6,412.69', visible: true },
    { label: '第三档', range: '询盘有惊喜', price: '询盘有惊喜', visible: true },
  ]
}

function textToVariants(value: string): ManagementProduct['variants'] {
  const source = value.trim()
  if (!source) return []
  const parsed = JSON.parse(source)
  if (!Array.isArray(parsed)) return []
  return parsed
    .map(item => ({
      code: typeof item.code === 'string' ? item.code : undefined,
      name: typeof item.name === 'string' ? item.name : '',
      model: typeof item.model === 'string' ? item.model : undefined,
      specifications: Array.isArray(item.specifications) ? item.specifications : [],
      price_tiers: Array.isArray(item.price_tiers) ? item.price_tiers : [],
      price_mode: typeof item.price_mode === 'string' ? item.price_mode : 'contact_only',
      moq: typeof item.moq === 'string' ? item.moq : null,
      images: Array.isArray(item.images) ? item.images : [],
    }))
    .filter(item => item.name)
}

function cloneAssuranceItems(value: Array<{ title: string; copy?: string }> | undefined) {
  return normalizeAssuranceItems(value)
}

function cloneTranslations(value: Translations | undefined): Translations {
  return value ? JSON.parse(JSON.stringify(value)) as Translations : {}
}

function cloneStringList(value: string[] | undefined) {
  return Array.isArray(value) ? value.map(String) : []
}

function markProductDescriptionTouched() {
  if (props.kind === 'products') productDescriptionTouched.value = true
}

function seoGeoPayload() {
  return {
    seo_title: form.seo_title.trim() || null,
    seo_description: form.seo_description.trim() || null,
    answer_summary: form.answer_summary.trim() || null,
    author_name: form.author_name.trim() || null,
    technical_reviewer: form.technical_reviewer.trim() || null,
    evidence_urls: cleanHighlights(form.evidence_urls),
    standards: cleanHighlights(form.standards),
    applicable_markets: cleanHighlights(form.applicable_markets),
    unsuitable_conditions: cleanHighlights(form.unsuitable_conditions),
    is_indexable: form.is_indexable,
  }
}

function insertContentImage(url: string) {
  const imageLine = `<p><img src="${url}" alt="正文图片"></p>`
  form.content = form.content.trim()
    ? `${form.content.trim()}\n${imageLine}\n`
    : `${imageLine}\n`
}

function contentImages(value: string) {
  return value.match(/<p>\s*<img\b[^>]*>\s*<\/p>|<img\b[^>]*>/gi)?.join('') ?? ''
}

function contentImageUrls(value: string) {
  return Array.from(value.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi), match => match[1]).filter(Boolean)
}

function resetFromItem() {
  const item = props.item
  originalProductDescription.value = ''
  productDescriptionTouched.value = false
  form.id = item?.id ?? 0
  form.slug = item && 'slug' in item ? item.slug : ''
  form.sort_order = item?.sort_order ?? 0
  form.is_active = item?.is_active ?? true
  form.translations = cloneTranslations(item && 'translations' in item ? item.translations : undefined)
  activeLocale.value = 'zh-CN'
  const seoItem = item && props.kind !== 'categories'
    ? item as ManagementProduct | ManagementSolution | ManagementNewsArticle | ManagementDeliveryCase
    : null
  form.seo_title = seoItem?.seo_title ?? ''
  form.seo_description = seoItem?.seo_description ?? ''
  form.answer_summary = seoItem?.answer_summary ?? ''
  form.author_name = seoItem?.author_name ?? ''
  form.technical_reviewer = seoItem?.technical_reviewer ?? ''
  form.evidence_urls = cloneStringList(seoItem?.evidence_urls)
  form.standards = cloneStringList(seoItem?.standards)
  form.applicable_markets = cloneStringList(seoItem?.applicable_markets)
  form.unsuitable_conditions = cloneStringList(seoItem?.unsuitable_conditions)
  form.is_indexable = seoItem?.is_indexable ?? true
  if (props.kind === 'categories') {
    const category = item as ManagementCategory | null
    const createParentId = typeof props.categoryParentId === 'number' ? props.categoryParentId : 0
    form.name = category?.name ?? ''
    form.parent_id = category ? category.parent_id ?? 0 : createParentId
    form.color = category?.color ?? '#0f766e'
    return
  }

  if (props.kind === 'products') {
    const product = item as ManagementProduct | null
    form.product_code = product?.product_code ?? ''
    form.batch_number = product?.batch_number ?? 1
    form.name = product?.name ?? ''
    form.category_id = product?.category_id ?? productCategoryOptions.value[0]?.id ?? 0
    form.model = product?.model ?? ''
    form.summary = product?.summary ?? ''
    form.description = product?.description ?? ''
    originalProductDescription.value = product?.description ?? ''
    form.main_image = product?.main_image ?? ''
    form.imagesText = listToText(normalizeImages(product?.images?.length ? product.images : product?.main_image ? [product.main_image] : []))
    form.image_tone = product?.image_tone ?? ''
    form.tag = product?.tag ?? ''
    form.tag_more = cloneStringList(product?.tag_more)
    form.moq = product?.moq ?? ''
    form.price_mode = product?.price_mode ?? 'contact_only'
    form.variantsText = variantsToText(product?.variants)
    form.showPrices = !(product?.show_surprise_only ?? true)
    form.priceTiers = product?.price_tiers?.length ? normalizePriceTiers(product.price_tiers) : defaultPriceTiers()
    form.fulfillmentItems = normalizeFulfillmentItems(product?.fulfillment_items, product?.fulfillment_methods)
    form.fulfillment_title = product?.fulfillment_title ?? ''
    form.fulfillment_copy = product?.fulfillment_copy ?? ''
    form.assuranceItems = cloneAssuranceItems(product?.assurance_items)
    form.processItems = product ? normalizeProcessItems(product.process_items, false) : defaultProcessItems()
    form.is_hot = product?.is_hot ?? false
    form.highlights = [...(product?.highlights ?? [])]
    form.specifications = (product?.specifications ?? []).map(item => ({ ...item }))
    return
  }

  if (props.kind === 'news') {
    const article = item as ManagementNewsArticle | null
    form.title = article?.title ?? ''
    form.summary = article?.summary ?? ''
    form.content = article?.content ?? ''
    form.thumbnail_url = article?.thumbnail_url ?? ''
    form.source = article?.source ?? '行业研究'
    form.published_at = article?.published_at ?? new Date().toISOString().slice(0, 10)
    return
  }

  if (props.kind === 'delivery-cases') {
    const deliveryCase = item as ManagementDeliveryCase | null
    form.title = deliveryCase?.title ?? ''
    form.summary = deliveryCase?.summary ?? ''
    form.content = deliveryCase?.content ?? ''
    form.client_name = deliveryCase?.client_name ?? ''
    form.industry = deliveryCase?.industry ?? ''
    deliveryCaseContent.value = normalizeDeliveryCaseContent({
      project_overview: deliveryCase?.project_overview,
      indonesia_fit: deliveryCase?.indonesia_fit,
      professional_configuration: deliveryCase?.professional_configuration,
      key_parameter_table: deliveryCase?.key_parameter_table,
      delivery_challenges: deliveryCase?.delivery_challenges,
      project_results: deliveryCase?.project_results,
    }, 'zh-CN')
    form.delivered_at = deliveryCase?.delivered_at ?? new Date().toISOString().slice(0, 10)
    return
  }

  const solution = item as ManagementSolution | null
  form.title = solution?.title ?? ''
  form.icon = solution?.icon ?? ''
  form.summary = solution?.summary ?? ''
  form.documentSections = normalizeSolutionSections(solution?.document_sections, 'zh-CN', solution?.content ?? '')
  form.content = solutionSectionsToHtml(form.documentSections)
  form.solutionImagesText = listToText(normalizeImages(solution?.images ?? []).slice(0, 2))
}

function submitForm() {
  if (props.kind === 'categories') {
    emit('saveCategory', {
      name: form.name.trim(),
      slug: resolvedSlug(form.name, 'category'),
      parent_id: form.parent_id || null,
      color: form.color.trim() || null,
      translations: cloneTranslations(form.translations),
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    }, form.id || undefined)
    return
  }

  if (props.kind === 'products') {
    const productImages = imagesFromText(form.imagesText)
    const fulfillmentItems = cleanFulfillmentItems(form.fulfillmentItems)
    const productDescription = productDescriptionTouched.value
      ? form.description.trim()
      : originalProductDescription.value.trim() || form.description.trim()
    emit('saveProduct', {
      ...seoGeoPayload(),
      product_code: form.product_code.trim(),
      batch_number: Math.max(1, Number(form.batch_number) || 1),
      category_id: Number(form.category_id),
      name: form.name.trim(),
      slug: resolvedSlug(`${form.name}-${form.model}`, 'product'),
      model: form.model.trim(),
      summary: form.summary.trim(),
      description: productDescription || null,
      detail_blocks: [],
      main_image: productImages[0] ?? (form.main_image.trim() || null),
      images: productImages,
      highlights: cleanHighlights(form.highlights),
      specifications: cleanSpecifications(form.specifications),
      variants: textToVariants(form.variantsText),
      price_tiers: serializeProductPriceTiers(!form.showPrices, form.priceTiers),
      show_surprise_only: !form.showPrices,
      fulfillment_methods: fulfillmentItems.map(item => item.name),
      fulfillment_items: fulfillmentItems,
      fulfillment_title: form.fulfillment_title.trim() || null,
      fulfillment_copy: form.fulfillment_copy.trim() || null,
      assurance_items: form.assuranceItems.map(item => ({ duration: item.duration?.trim() ?? '', title: item.title.trim(), copy: item.copy?.trim() ?? '' })).filter(item => item.title),
      process_items: cleanProcessItems(form.processItems),
      translations: cloneTranslations(form.translations),
      moq: form.moq.trim() || null,
      price_mode: form.price_mode.trim() || 'contact_only',
      image_tone: (props.item as ManagementProduct | null)?.image_tone ?? null,
      tag: form.tag.trim() || null,
      tag_more: cloneStringList(form.tag_more),
      is_hot: form.is_hot,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    }, form.id || undefined)
    return
  }

  if (props.kind === 'news') {
    emit('saveNewsArticle', {
      ...seoGeoPayload(),
      title: form.title.trim(),
      slug: resolvedSlug(form.title, 'news'),
      summary: form.summary.trim(),
      content: form.content.trim(),
      thumbnail_url: form.thumbnail_url.trim() || null,
      source: form.source.trim() || '行业研究',
      translations: cloneTranslations(form.translations),
      published_at: form.published_at,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    }, form.id || undefined)
    return
  }

  if (props.kind === 'delivery-cases') {
    const structured = cleanDeliveryCaseContent(deliveryCaseContent.value)
    emit('saveDeliveryCase', {
      ...seoGeoPayload(),
      title: form.title.trim(),
      slug: resolvedSlug(form.title, 'delivery-case'),
      summary: form.summary.trim(),
      content: `${contentImages(form.content)}${deliveryCaseContentToHtml(structured, 'zh-CN')}`,
      ...structured,
      client_name: form.client_name.trim(),
      industry: form.industry.trim(),
      translations: cloneTranslations(form.translations),
      delivered_at: form.delivered_at,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    }, form.id || undefined)
    return
  }

  const solution = props.item as ManagementSolution | null
  const sections = cleanSolutionSections(form.documentSections)

  emit('saveSolution', {
    ...seoGeoPayload(),
    title: form.title.trim(),
    slug: resolvedSlug(form.title, 'solution'),
    icon: form.icon.trim() || null,
    summary: form.summary.trim(),
    content: solutionSectionsToHtml(sections),
    document_sections: sections,
    images: imagesFromText(form.solutionImagesText).slice(0, 2),
    scenarios: solution?.scenarios ?? [],
    equipment: solution?.equipment ?? [],
    benefits: sections[8]?.type === 'list' ? sections[8].items ?? [] : [],
    detailed_description: sections[0]?.type === 'paragraph' ? sections[0].content || null : null,
    pitfalls: sections[5]?.type === 'list' ? sections[5].items ?? [] : [],
    core_parameters: sections[6]?.type === 'paragraph' ? [{ label: sections[6].title, value: sections[6].content ?? '' }] : [],
    special_contributions: sections[7]?.type === 'list' ? sections[7].items ?? [] : [],
    related_products: solution?.related_products ?? [],
    translations: cloneTranslations(form.translations),
    sort_order: Number(form.sort_order) || 0,
    is_active: form.is_active,
  }, form.id || undefined)
}

watch(() => [props.kind, props.item?.id, props.categories.length, props.categoryParentId], resetFromItem, { immediate: true })
</script>

<template>
  <form class="catalog-editor" :class="{ 'readonly-editor': readonly }" @submit.prevent="submitForm">
    <div class="panel-header split">
      <div>
        <span class="system-label">最小管理闭环</span>
        <h2>{{ heading }}</h2>
      </div>
      <button v-if="!readonly" class="primary-button compact" type="submit" :disabled="isSaving || (kind === 'products' && !productCategoryOptions.length)">
        {{ isSaving ? '保存中...' : '保存修改' }}
      </button>
    </div>

    <LocaleTabs v-model="activeLocale" :english-status="englishStatus" />

    <div v-show="activeLocale === 'zh-CN'" class="locale-panel">
    <template v-if="kind === 'categories'">
      <div class="field-grid two">
        <label>名称<input v-model="form.name" required :disabled="readonly" /></label>
        <label>标识<input v-model="form.slug" required :disabled="readonly" /></label>
      </div>
    </template>

    <template v-else-if="kind === 'products'">
      <div class="field-grid two">
        <label>名称<input v-model="form.name" required :disabled="readonly" /></label>
        <label>标识<input v-model="form.slug" required :disabled="readonly" /></label>
      </div>
      <div class="field-grid two">
        <label>商品编号<input v-model="form.product_code" maxlength="24" placeholder="留空则自动生成，如 P10001" :disabled="readonly" /></label>
        <label>商品批次<input v-model.number="form.batch_number" type="number" min="1" :disabled="readonly" /></label>
        <label>分类
          <select v-model.number="form.category_id" required :disabled="readonly">
            <option v-for="category in productCategoryOptions" :key="category.id" :value="category.id">{{ categoryOptionLabel(category) }}</option>
          </select>
        </label>
      </div>
      <p v-if="!productCategoryOptions.length" class="form-alert error">请先创建二级分类，再新增商品。</p>
      <div class="field-grid two">
        <label>型号<input v-model="form.model" required :disabled="readonly" /></label>
      </div>
      <label>功能用途（应用场景）<textarea v-model="form.summary" required rows="3" :disabled="readonly" /></label>
      <div
        class="rich-editor-field product-description-editor"
        @pointerdown="markProductDescriptionTouched"
        @keydown="markProductDescriptionTouched"
      >
        <div class="rich-editor-field-heading">
          <span>商品详情</span>
          <small>支持标题层级、正文、字号、颜色、对齐、列表、表格、链接和图片</small>
        </div>
        <RichTextEditor v-model="form.description" :token="authStore.token" :readonly="readonly" placeholder="请输入商品详情" />
      </div>
      <ProductImageManager
        :images="imagesFromText(form.imagesText)"
        :token="authStore.token"
        :readonly="readonly"
        @update-images="form.imagesText = listToText($event); form.main_image = $event[0] ?? ''"
      />
      <div class="field-grid two">
        <label>起订量<input v-model="form.moq" :disabled="readonly" /></label>
        <label>标签<input v-model="form.tag" :disabled="readonly" /></label>
      </div>
      <PriceTierEditor v-model="form.priceTiers" v-model:show-prices="form.showPrices" :readonly="readonly" />
      <section class="fulfillment-config">
        <strong>交付与物流配置</strong>
        <p>产品配置优先展示；留空则自动使用所属类目的配置。订单保障每行一个条目，可写“标题: 说明”。</p>
        <label>标题<input v-model="form.fulfillment_title" placeholder="物流交付" :disabled="readonly" /></label>
        <label>交付周期文案<textarea v-model="form.fulfillment_copy" rows="3" placeholder="运费和交货日期需协商。立即与供应商联系了解更多详情。" :disabled="readonly" /></label>
        <FulfillmentItemsEditor v-model="form.fulfillmentItems" :readonly="readonly" />
        <AssuranceItemsEditor v-model="form.assuranceItems" :readonly="readonly" />
      </section>
      <HighlightsEditor v-model="form.highlights" :readonly="readonly" />
      <SpecificationsEditor v-model="form.specifications" :readonly="readonly" />
      <ProcessItemsEditor v-model="form.processItems" :readonly="readonly" />
    </template>

    <template v-else-if="kind === 'news'">
      <div class="field-grid two">
        <label>标题<input v-model="form.title" required :disabled="readonly" /></label>
        <label>标识<input v-model="form.slug" required :disabled="readonly" /></label>
      </div>
      <label>摘要<textarea v-model="form.summary" required rows="3" :disabled="readonly" /></label>
      <ContentImageUploader
        :token="authStore.token"
        :readonly="readonly"
        @set-cover="form.thumbnail_url = $event"
        @insert-image="insertContentImage"
      />
      <div class="rich-editor-field"><span>正文内容</span>
        <RichTextEditor v-model="form.content" :token="authStore.token" :readonly="readonly" placeholder="请输入资讯正文" />
      </div>
      <div class="field-grid two">
        <label>缩略图 URL<input v-model="form.thumbnail_url" placeholder="/uploads/images/..." :disabled="readonly" /></label>
        <label>资讯来源<input v-model="form.source" required :disabled="readonly" /></label>
      </div>
      <div class="field-grid two">
        <label>发布时间<input v-model="form.published_at" required type="date" :disabled="readonly" /></label>
        <label>排序<input v-model.number="form.sort_order" type="number" :disabled="readonly" /></label>
      </div>
    </template>

    <template v-else-if="kind === 'delivery-cases'">
      <div class="field-grid two">
        <label>标题<input v-model="form.title" required :disabled="readonly" /></label>
        <label>标识<input v-model="form.slug" required :disabled="readonly" /></label>
      </div>
      <label>摘要<textarea v-model="form.summary" required rows="3" :disabled="readonly" /></label>
      <ContentImageUploader
        :token="authStore.token"
        :readonly="readonly"
        :allow-cover="false"
        @insert-image="insertContentImage"
      />
      <DeliveryCaseSectionsEditor v-model="deliveryCaseContent" :token="authStore.token" locale="zh-CN" :readonly="readonly" />
      <div class="field-grid two">
        <label>客户名称<input v-model="form.client_name" required placeholder="印尼工业园开发商" :disabled="readonly" /></label>
        <label>行业场景<input v-model="form.industry" required placeholder="工业园区配电" :disabled="readonly" /></label>
      </div>
      <div class="field-grid two">
        <label>交付时间<input v-model="form.delivered_at" required type="date" :disabled="readonly" /></label>
        <label>排序<input v-model.number="form.sort_order" type="number" :disabled="readonly" /></label>
      </div>
    </template>

    <template v-else>
      <section class="solution-admin-section">
        <div class="solution-admin-heading">
          <strong>场景目录与首屏信息</strong>
          <p>标题会显示在左侧场景目录和右侧方案首屏，摘要显示在方案首屏介绍区。</p>
        </div>
        <div class="field-grid two">
          <label>场景名称<input v-model="form.title" required placeholder="工业园区配电解决方案" :disabled="readonly" /></label>
          <label>标识<input v-model="form.slug" required placeholder="industrial-park-distribution" :disabled="readonly" /></label>
        </div>
        <label>首屏摘要<textarea v-model="form.summary" required rows="3" placeholder="用于前台右侧方案首屏的简短说明" :disabled="readonly" /></label>
        <div class="field-grid two">
          <label>图标<input v-model="form.icon" placeholder="可填写 Emoji 或图标标识" :disabled="readonly" /></label>
          <label>排序<input v-model.number="form.sort_order" type="number" :disabled="readonly" /></label>
        </div>
      </section>

      <section class="solution-admin-section">
        <div class="solution-admin-heading">
          <strong>场景图片</strong>
          <p>支持用户直接上传。前台解决方案模块展示第 1 张，详情页轮播展示前 2 张。</p>
        </div>
        <ProductImageManager
          :images="imagesFromText(form.solutionImagesText)"
          :token="authStore.token"
          :readonly="readonly"
          title="场景图片"
          :max-images="2"
          helper="最多 2 张，支持 JPG、PNG、WebP，建议单张不超过 2MB"
          @update-images="form.solutionImagesText = listToText($event)"
        />
      </section>

      <SolutionSectionsEditor v-model="form.documentSections" :token="authStore.token" :readonly="readonly" />

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
        v-model:is-indexable="form.is_indexable"
        :readonly="readonly"
      />
    </div>

    <LocalizedCatalogFields
      v-if="activeLocale === 'id'"
      v-model="form.translations.id"
      :kind="kind"
      :token="authStore.token"
      :media-images="mediaImages"
      :readonly="readonly"
    />

    <LocalizedCatalogFields
      v-if="activeLocale === 'en'"
      v-model="form.translations.en"
      :kind="kind"
      :locale="'en'"
      :token="authStore.token"
      :media-images="mediaImages"
      :readonly="readonly"
    />
    <div class="editor-switches">
      <label class="check-field"><input v-model="form.is_active" type="checkbox" :disabled="readonly" /> 启用</label>
      <label v-if="kind === 'products'" class="check-field"><input v-model="form.is_hot" type="checkbox" :disabled="readonly" /> 热销产品</label>
      <label v-if="kind !== 'solutions' && kind !== 'news' && kind !== 'delivery-cases'" class="inline-sort">排序<input v-model.number="form.sort_order" type="number" :disabled="readonly" /></label>
    </div>
  </form>
</template>
