<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getCategories, getProduct, getSolutions } from '../api/catalog'
import type { CategoryTree } from '../api/catalog'
import { resolveOptimizedAssetUrl } from '../api/client'
import { createInquiry } from '../api/inquiries'
import { getSiteSettings } from '../api/site'
import StatusPanel from '../components/common/StatusPanel.vue'
import ManagedContentBlocks from '../components/common/ManagedContentBlocks.vue'
import { useI18n } from '../composables/useI18n'
import { useWebsiteConfig } from '../composables/useWebsiteConfig'
import { useLocalizedContent } from '../data/localizedContent'
import type { Product, SolutionSummary } from '../types/catalog'
import type { SiteSettings } from '../types/site'
import { buildWhatsAppLink } from '../utils/whatsapp'

const route = useRoute()

const props = defineProps<{
  initialCategories?: CategoryTree[]
  initialSolutions?: SolutionSummary[]
  initialSiteSettings?: SiteSettings | null
}>()

const hasInitialData = Boolean(props.initialCategories && props.initialSolutions && props.initialSiteSettings)
const categories = ref<CategoryTree[]>(props.initialCategories ?? [])
const solutions = ref<SolutionSummary[]>(props.initialSolutions ?? [])
const siteSettings = ref<SiteSettings | null>(props.initialSiteSettings ?? null)
const isLoading = shallowRef(!hasInitialData)
const isSubmitting = shallowRef(false)
const loadError = shallowRef('')
const submitMessage = shallowRef('')
const submitError = shallowRef('')
const lastAutoMessage = shallowRef('')
const attachmentFile = shallowRef<File | null>(null)
const { pageConfig } = useWebsiteConfig()
const contactConfig = pageConfig('contact')
const { locale, t } = useI18n()
const { text, localizeText, localizedCategory, localizeProduct, localizeSolution } = useLocalizedContent()
const selectedProductSlugs = shallowRef<string[]>([])
const selectedProducts = shallowRef<Product[]>([])
const selectedPrimaryCategorySlug = shallowRef('')
let selectedProductsRequestId = 0

const form = reactive({
  name: '',
  company: '',
  email: '',
  phone: '',
  product_slug: '',
  solution_slug: '',
  message: '',
})

const selectedCategory = computed(() => flattenCategoryTree(categories.value).find((category) => category.slug === form.product_slug) ?? null)
const primaryCategories = computed(() => categories.value.filter(category => category.parent_id === null))
const selectedPrimaryCategory = computed(() => primaryCategories.value.find(category => category.slug === selectedPrimaryCategorySlug.value) ?? null)
const secondaryCategories = computed(() => selectedPrimaryCategory.value?.children ?? [])
const localizedSolutions = computed(() => solutions.value.map(localizeSolution))
const selectedProductNames = computed(() => {
  const productsBySlug = new Map(selectedProducts.value.map(product => [product.slug, localizeProduct(product).name]))
  return selectedProductSlugs.value.map(slug => productsBySlug.get(slug) ?? slug)
})
const selectedSolution = computed(() => solutions.value.find((solution) => solution.slug === form.solution_slug) ?? null)
const localizedSelectedSolution = computed(() => selectedSolution.value ? localizeSolution(selectedSolution.value) : null)
const companyAddress = computed(() => {
  const fallback = String(siteSettings.value?.company_address ?? '上海虹桥阿里中心')
  if (locale.value === 'zh-CN') return fallback
  return siteSettings.value?.translations?.[locale.value]?.company_address ?? localizeText(fallback)
})
const hasMessageContext = computed(() =>
  selectedProductSlugs.value.length > 0
  || Boolean(selectedCategory.value)
  || Boolean(localizedSelectedSolution.value),
)
const sourcePage = computed(() => route.fullPath || '/contact')
const whatsappLink = computed(() => buildWhatsAppLink(siteSettings.value?.whatsapp_number, {
  productName: selectedProductSlugs.value.length === 1
    ? selectedProductNames.value[0]
    : selectedCategory.value
      ? text(`categories.${selectedCategory.value.slug}`, selectedCategory.value.name)
      : undefined,
  productSlug: selectedProductSlugs.value.length === 1
    ? selectedProductSlugs.value[0]
    : selectedCategory.value?.slug,
  productNames: selectedProductSlugs.value.length > 1 ? selectedProductNames.value : undefined,
  productSlugs: selectedProductSlugs.value.length > 1 ? selectedProductSlugs.value : undefined,
  solutionName: localizedSelectedSolution.value?.title,
  solutionSlug: selectedSolution.value?.slug,
  sourcePage: sourcePage.value,
}))
const visibleManagedBlocks = computed(() =>
  contactConfig.value?.blocks.filter(block => !['contact-channels', 'contact-form'].includes(block.id)) ?? [],
)
const contactHeroStyle = computed(() => {
  const heroImage = resolveOptimizedAssetUrl(contactConfig.value?.heroImageUrl, { width: 1600 })
  if (!heroImage) return undefined
  return {
    backgroundImage: `linear-gradient(90deg, rgba(248, 250, 252, 0.78), rgba(248, 250, 252, 0.34)), url('${heroImage}')`,
    backgroundPosition: 'center, center',
    backgroundRepeat: 'no-repeat, no-repeat',
    backgroundSize: 'cover, cover',
  }
})
const formGuide = computed(() => ({
  intro: text('contact.formGuide', t('contact.formGuide')),
  product: text('contact.productGuide', t('contact.productGuide')),
  solution: text('contact.solutionGuide', t('contact.solutionGuide')),
  message: text('contact.messageGuide', t('contact.messageGuide')),
  attachment: text('contact.attachmentGuide', t('contact.attachmentGuide')),
  attachmentButton: text('contact.attachmentButton', t('contact.attachmentButton')),
}))
const messagePlaceholder = computed(() =>
  hasMessageContext.value ? formGuide.value.message : t('contact.defaultMessage'),
)

function readQueryValue(value: unknown) {
  if (Array.isArray(value)) return value[0] ?? ''
  return typeof value === 'string' ? value : ''
}

function readQueryList(value: unknown) {
  const values = Array.isArray(value) ? value : [value]
  return values
    .filter((item): item is string => typeof item === 'string')
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter(Boolean)
}

function flattenCategoryTree(items: CategoryTree[]): CategoryTree[] {
  const result: CategoryTree[] = []
  const stack = [...items]
  while (stack.length) {
    const item = stack.shift()!
    result.push(item)
    if (item.children?.length) stack.unshift(...item.children)
  }
  return result
}

function categoryLabel(category: CategoryTree) {
  return localizedCategory(category).name
}

function selectCategoryPath(slug: string) {
  const category = flattenCategoryTree(categories.value).find(item => item.slug === slug)
  if (!category) return false
  if (category.parent_id === null) {
    selectedPrimaryCategorySlug.value = category.slug
    form.product_slug = ''
    return true
  }
  const parent = primaryCategories.value.find(item => item.id === category.parent_id)
  selectedPrimaryCategorySlug.value = parent?.slug ?? ''
  form.product_slug = category.slug
  return true
}

function handlePrimaryCategoryChange() {
  form.product_slug = ''
  form.solution_slug = ''
}

function handleSecondaryCategoryChange() {
  form.solution_slug = ''
}

function applyRouteContext() {
  const productSlug = readQueryValue(route.query.product)
  const productSlugs = readQueryList(route.query.products)
  const solutionSlug = readQueryValue(route.query.solution)
  const productMatchesCategory = productSlug ? selectCategoryPath(productSlug) : false
  selectedProductSlugs.value = Array.from(new Set([
    ...productSlugs,
    ...(productSlug && !productMatchesCategory ? [productSlug] : []),
  ]))

  if (productMatchesCategory) {
    form.solution_slug = ''
  }

  if (solutionSlug && solutions.value.some((solution) => solution.slug === solutionSlug)) {
    form.solution_slug = solutionSlug
    selectedPrimaryCategorySlug.value = ''
    form.product_slug = ''
  }
}

async function loadSelectedProducts() {
  const requestId = ++selectedProductsRequestId
  const slugs = [...selectedProductSlugs.value]
  if (!slugs.length) {
    selectedProducts.value = []
    syncMessageContext()
    return
  }

  const results = await Promise.allSettled(slugs.map(slug => getProduct(slug)))
  if (requestId !== selectedProductsRequestId) return
  selectedProducts.value = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
  syncMessageContext()
}

function buildDefaultMessage() {
  if (!hasMessageContext.value) return ''
  const lines = [t('contact.defaultMessage')]
  if (selectedProductNames.value.length) {
    lines.unshift(t('contact.selectedProductsMessage', '', { names: selectedProductNames.value.join(', ') }))
  }
  if (selectedCategory.value) {
    lines.unshift(t('contact.productMessage', '', { name: text(`categories.${selectedCategory.value.slug}`, selectedCategory.value.name) }))
  }
  if (localizedSelectedSolution.value) lines.unshift(t('contact.solutionMessage', '', { name: localizedSelectedSolution.value.title }))
  return lines.join('\n')
}

function syncMessageContext(force = false) {
  const nextMessage = buildDefaultMessage()
  if (force || !form.message.trim() || form.message === lastAutoMessage.value) {
    form.message = nextMessage
    lastAutoMessage.value = nextMessage
  }
}

async function loadContactData() {
  isLoading.value = true
  loadError.value = ''
  try {
    const [categoryResponse, solutionResponse, settings] = await Promise.all([
      getCategories(),
      getSolutions(),
      getSiteSettings(),
    ])
    categories.value = categoryResponse
    solutions.value = solutionResponse
    siteSettings.value = settings
    applyRouteContext()
    await loadSelectedProducts()
    syncMessageContext()
  } catch {
    loadError.value = t('contact.loadError')
  } finally {
    isLoading.value = false
  }
}

function validateForm() {
  if (!form.name.trim()) return t('contact.requiredName')
  if (!form.company.trim()) return t('contact.requiredCompany')
  if (!form.email.trim()) return t('contact.requiredEmail')
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return t('contact.invalidEmail')
  if (!form.message.trim()) return t('contact.requiredMessage')
  return ''
}

function handleAttachmentChange(event: Event) {
  const input = event.target as HTMLInputElement
  attachmentFile.value = input.files?.[0] ?? null
}

function clearAttachment() {
  attachmentFile.value = null
}

async function submitInquiry() {
  submitMessage.value = ''
  submitError.value = validateForm()
  if (submitError.value) return

  isSubmitting.value = true
  try {
    const inquiry = await createInquiry({
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      product_slug: form.product_slug || selectedProductSlugs.value[0] || undefined,
      solution_slug: form.solution_slug || undefined,
      message: form.message.trim(),
      source_page: sourcePage.value,
      attachment: attachmentFile.value,
    })
    submitMessage.value = t('contact.successWithNumber', t('contact.success'), { number: inquiry.submission_number })
    form.name = ''
    form.company = ''
    form.email = ''
    form.phone = ''
    attachmentFile.value = null
    syncMessageContext(true)
  } catch {
    submitError.value = t('contact.submitError')
  } finally {
    isSubmitting.value = false
  }
}

watch(() => [route.query.product, route.query.products, route.query.solution], () => {
  applyRouteContext()
  void loadSelectedProducts()
  syncMessageContext()
})

watch(() => [form.product_slug, form.solution_slug], () => {
  syncMessageContext()
})

onMounted(() => {
  if (!hasInitialData) {
    void loadContactData()
    return
  }
  applyRouteContext()
  void loadSelectedProducts()
  syncMessageContext()
})
</script>

<template>
  <div class="page-solo">
    <section
      class="page-hero managed-page-hero"
      :style="contactHeroStyle"
    >
      <p class="breadcrumb">{{ t('contact.breadcrumb') }}</p>
      <h1>{{ contactConfig?.headline ?? text('pages.contact.headline', t('contact.title')) }}</h1>
      <p>{{ contactConfig?.summary ?? text('pages.contact.summary', t('contact.subtitle')) }}</p>
    </section>
    <ManagedContentBlocks compact :blocks="visibleManagedBlocks" />
    <section class="contact-layout stacked">
      <form class="contact-form" @submit.prevent="submitInquiry">
        <StatusPanel
          v-if="isLoading"
          variant="loading"
          :title="t('contact.loadingTitle')"
          :message="t('contact.loadingMessage')"
        />
        <StatusPanel
          v-else-if="loadError"
          variant="error"
          :title="loadError"
          :message="t('contact.loadErrorMessage')"
          :action-label="t('common.retry')"
          @action="loadContactData"
        />
        <p class="contact-form-guidance">{{ formGuide.intro }}</p>
        <div class="form-row">
          <label>{{ t('contact.name') }} *<input v-model="form.name" :placeholder="t('contact.namePlaceholder')" /></label>
          <label>{{ t('contact.company') }} *<input v-model="form.company" :placeholder="t('contact.companyPlaceholder')" /></label>
        </div>
        <div class="form-row">
          <label>{{ t('contact.email') }} *<input v-model="form.email" placeholder="contact@example.com" /></label>
          <label>{{ t('contact.phone') }}<input v-model="form.phone" placeholder="+1 555 000 0000" /></label>
        </div>
        <div class="form-row">
          <label>
            {{ t('contact.primaryProductCategory') }}
            <select v-model="selectedPrimaryCategorySlug" :class="{ 'placeholder-select': !selectedPrimaryCategorySlug }" :disabled="isLoading" @change="handlePrimaryCategoryChange">
              <option value="">{{ t('contact.selectPrimaryProductCategory') }}</option>
              <option v-for="category in primaryCategories" :key="category.slug" :value="category.slug">{{ categoryLabel(category) }}</option>
            </select>
          </label>
          <label>
            {{ t('contact.secondaryProductCategory') }}
            <select v-model="form.product_slug" :class="{ 'placeholder-select': !form.product_slug }" :disabled="isLoading || !selectedPrimaryCategorySlug" @change="handleSecondaryCategoryChange">
              <option value="">{{ t('contact.selectSecondaryProductCategory') }}</option>
              <option v-for="category in secondaryCategories" :key="category.slug" :value="category.slug">{{ categoryLabel(category) }}</option>
            </select>
          </label>
        </div>
        <label>
          {{ t('contact.solutionInterest') }}
          <select v-model="form.solution_slug" :class="{ 'placeholder-select': !form.solution_slug }" :disabled="isLoading" @change="selectedPrimaryCategorySlug = ''; form.product_slug = ''">
            <option value="">{{ formGuide.solution }}</option>
            <option v-for="solution in localizedSolutions" :key="solution.slug" :value="solution.slug">{{ solution.title }}</option>
          </select>
        </label>
        <label>{{ t('contact.message') }} *<textarea v-model="form.message" :placeholder="messagePlaceholder"></textarea></label>
        <div class="attachment-upload">
          <label class="attachment-upload-control">
            <span>{{ formGuide.attachmentButton }}</span>
            <small>{{ attachmentFile?.name || formGuide.attachment }}</small>
            <input type="file" @change="handleAttachmentChange" />
          </label>
          <button v-if="attachmentFile" class="attachment-clear" type="button" @click="clearAttachment">
            {{ text('contact.attachmentClear', t('contact.attachmentClear')) }}
          </button>
        </div>
        <p v-if="submitError" class="form-alert error">{{ submitError }}</p>
        <p v-if="submitMessage" class="form-alert success">{{ submitMessage }}</p>
        <button class="button primary" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? t('contact.sending') : `${t('contact.send')} →` }}
        </button>
      </form>
      <div class="contact-cards">
        <article class="whatsapp-panel">
          <h3>{{ t('contact.whatsappTitle') }}</h3>
          <p>{{ t('contact.whatsappCopy') }}</p>
          <a v-if="whatsappLink" class="button whatsapp-cta" :href="whatsappLink" target="_blank" rel="noreferrer">{{ t('common.chatNow') }} →</a>
        </article>
        <article class="contact-info-card">
          <strong>{{ t('contact.emailUs') }}</strong><span>{{ siteSettings?.sales_email ?? '' }}</span>
          <strong>{{ t('contact.phone') }}</strong><span>{{ siteSettings?.phone ?? '' }}</span>
          <strong>{{ t('contact.globalHq') }}</strong><span>{{ companyAddress }}</span>
          <strong>{{ t('common.whatsapp') }}</strong><span>{{ siteSettings?.whatsapp_number ?? '' }}</span>
        </article>
      </div>
    </section>
  </div>
</template>
