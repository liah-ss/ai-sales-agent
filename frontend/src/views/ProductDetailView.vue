<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getCategories, getProduct, getRelatedProducts } from '../api/catalog'
import type { CategoryTree } from '../api/catalog'
import { resolveAssetUrl } from '../api/client'
import StatusPanel from '../components/common/StatusPanel.vue'
import SeoGeoEvidence from '../components/common/SeoGeoEvidence.vue'
import ProductAssurancePanel from '../components/product-detail/ProductAssurancePanel.vue'
import ProductGallery from '../components/product-detail/ProductGallery.vue'
import ProductDetailContent from '../components/product-detail/ProductDetailContent.vue'
import ProductPurchasePanel from '../components/product-detail/ProductPurchasePanel.vue'
import ProductSpecificationDeck from '../components/product-detail/ProductSpecificationDeck.vue'
import {
  getAssuranceItems,
  getProductPriceBreaks,
  normalizeAssuranceItems,
  resolveProductFulfillmentItems,
  splitProductSummary,
} from '../components/product-detail/productDetailData'
import ProductCard from '../components/product/ProductCard.vue'
import { useI18n } from '../composables/useI18n'
import { useWebsiteConfig } from '../composables/useWebsiteConfig'
import { useLocalizedContent } from '../data/localizedContent'
import type { Product } from '../types/catalog'
import { publicProductSlug } from '../utils/productUrl'
import { buildWhatsAppLink } from '../utils/whatsapp'

const props = defineProps<{
  initialProduct?: Product | null
  initialRelatedProducts?: Product[]
  initialCategories?: CategoryTree[]
}>()

const route = useRoute()
const product = ref<Product | null>(props.initialProduct ?? null)
const relatedProducts = ref<Product[]>(props.initialRelatedProducts ?? [])
const categories = ref<CategoryTree[]>(props.initialCategories ?? [])
const isLoading = shallowRef(!props.initialProduct)
const error = shallowRef('')
const { pageConfig } = useWebsiteConfig()
const productPageConfig = pageConfig('product')
const { t } = useI18n()
const { localizeProduct, localizedCategory } = useLocalizedContent()

const productSlug = computed(() => typeof route.params.slug === 'string' ? route.params.slug : '')
const productApiKey = computed(() => productSlug.value)
const localizedProduct = computed(() => {
  if (!product.value) return null
  const localized = localizeProduct(product.value)
  return {
    ...localized,
    moq: localized.moq ?? t('detail.defaultMoq'),
  }
})
const productName = computed(() => localizedProduct.value?.name ?? '')
const productSummary = computed(() => localizedProduct.value?.summary || '')
const productSummarySections = computed(() => splitProductSummary(productSummary.value))
const productDescription = computed(() => localizedProduct.value?.description || '')
const productHighlights = computed(() => localizedProduct.value?.highlights ?? [])
const productSpecifications = computed(() => localizedProduct.value?.specifications ?? [])
const productCategoryName = computed(() => localizedProduct.value?.category.name ?? '')
const flatCategories = computed(() => flattenCategoryTree(categories.value))
const productCategoryPath = computed(() => {
  if (!product.value) return []
  const current = flatCategories.value.find(category => category.slug === product.value?.category.slug)
  if (!current) return []
  const root = current.parent_id == null
    ? undefined
    : flatCategories.value.find(category => category.id === current.parent_id)
  const path = root ? [root, current] : [current]
  return path.map(category => localizedCategory(category))
})
const whatsappLink = computed(() => buildWhatsAppLink(null, {
  productName: productName.value || product.value?.name || '',
  productSlug: product.value?.slug,
  sourcePage: route.fullPath,
}))
const productGalleryItems = computed(() => {
  if (!product.value) return []
  const images = product.value.images.length ? product.value.images : product.value.main_image ? [product.value.main_image] : []
  return images.map(image => resolveAssetUrl(image)).filter(Boolean)
})
const configuredHeroImage = computed(() => resolveAssetUrl(productPageConfig.value?.heroImageUrl))
const productPriceBreaks = computed(() => localizedProduct.value
  ? getProductPriceBreaks(localizedProduct.value, {
      tier1: t('detail.tier1'),
      tier2: t('detail.tier2'),
      tier3: t('detail.tier3'),
      tier1Range: t('detail.tier1Range'),
      tier1Price: t('detail.tier1Price'),
      tier2Range: t('detail.tier2Range'),
      tier2Price: t('detail.tier2Price'),
      surpriseInquiry: t('detail.surpriseInquiry'),
    })
  : [])
const fulfillmentTitle = computed(() => {
  if (!localizedProduct.value) return t('detail.logisticsDelivery')
  return localizedProduct.value.fulfillment_title || t('detail.logisticsDelivery')
})
const fulfillmentCopy = computed(() => {
  if (!localizedProduct.value) return t('detail.defaultFulfillmentCopy')
  return localizedProduct.value.fulfillment_copy || t('detail.defaultFulfillmentCopy')
})
const fulfillmentItems = computed(() => {
  const defaults = [
    { name: t('detail.globalOceanShipping'), copy: '' },
    { name: t('detail.crossBorderLandTransport'), copy: '' },
  ]
  if (!localizedProduct.value) return defaults
  const configured = resolveProductFulfillmentItems(localizedProduct.value)
  return configured.length ? configured : defaults
})
const assuranceItems = computed(() => getAssuranceItems({
  warrantyTitle: t('detail.warrantyTitle'),
  warrantyCopy: t('detail.warrantyCopy'),
  maintenanceTitle: t('detail.maintenanceTitle'),
  maintenanceCopy: t('detail.maintenanceCopy'),
}))
const configuredAssuranceItems = computed(() => {
  if (!localizedProduct.value) return assuranceItems.value
  const configured = localizedProduct.value.assurance_items
  return configured?.length
    ? normalizeAssuranceItems(configured)
    : assuranceItems.value
})
const processItems = computed(() => {
  const configured = (localizedProduct.value?.process_items ?? [])
    .map(item => ({ title: item.title.trim(), copy: item.copy.trim() }))
    .filter(item => item.title)
    .slice(0, 4)
  if (configured.length) return configured
  return [
    { title: t('detail.processRequirementTitle'), copy: t('detail.processRequirementCopy') },
    { title: t('detail.processFactoryTitle'), copy: t('detail.processFactoryCopy') },
    { title: t('detail.processDocumentTitle'), copy: t('detail.processDocumentCopy') },
    { title: t('detail.processShipmentTitle'), copy: t('detail.processShipmentCopy') },
  ]
})

function flattenCategoryTree(items: CategoryTree[]): CategoryTree[] {
  return items.flatMap(category => [category, ...flattenCategoryTree(category.children ?? [])])
}

async function loadProduct(apiKey = productApiKey.value, options: { background?: boolean } = {}) {
  if (!apiKey) return
  const background = options.background === true && Boolean(product.value)
  const currentProduct = product.value
  const requestKey = currentProduct
    && (currentProduct.slug === apiKey || publicProductSlug(currentProduct) === apiKey)
    ? `p-id-${currentProduct.id}`
    : apiKey
  if (!background) {
    isLoading.value = true
    error.value = ''
  }
  try {
    const [productResult, relatedResult, categoriesResult] = await Promise.allSettled([
      getProduct(requestKey),
      getRelatedProducts(requestKey),
      categories.value.length ? Promise.resolve(categories.value) : getCategories(),
    ])
    if (productResult.status === 'rejected') throw productResult.reason

    product.value = productResult.value
    relatedProducts.value = relatedResult.status === 'fulfilled' ? relatedResult.value : []
    if (categoriesResult.status === 'fulfilled') categories.value = categoriesResult.value
  } catch {
    if (!background) {
      error.value = t('detail.notFound')
      product.value = null
      relatedProducts.value = []
    }
  } finally {
    if (!background) isLoading.value = false
  }
}

let lastBackgroundRefreshAt = 0
let initialRefreshTimer: ReturnType<typeof setTimeout> | undefined

function refreshProductInBackground() {
  if (!productSlug.value) return
  const now = Date.now()
  if (now - lastBackgroundRefreshAt < 1_000) return
  lastBackgroundRefreshAt = now
  void loadProduct(productApiKey.value, { background: true })
}

function refreshVisibleProduct() {
  if (document.visibilityState === 'visible') refreshProductInBackground()
}

onMounted(() => {
  // The route already contains prerendered product data. Refresh after the
  // first interaction window so a distant API cannot delay hydration.
  initialRefreshTimer = setTimeout(refreshProductInBackground, 1_500)
  window.addEventListener('focus', refreshProductInBackground)
  document.addEventListener('visibilitychange', refreshVisibleProduct)
})
onBeforeUnmount(() => {
  if (initialRefreshTimer) clearTimeout(initialRefreshTimer)
  window.removeEventListener('focus', refreshProductInBackground)
  document.removeEventListener('visibilitychange', refreshVisibleProduct)
})
watch(() => props.initialProduct, (initialProduct) => {
  if (!initialProduct) return
  const routeSlug = productSlug.value
  if (initialProduct.slug !== routeSlug && publicProductSlug(initialProduct) !== routeSlug) return
  product.value = initialProduct
  isLoading.value = false
  error.value = ''
  void getRelatedProducts(`p-id-${initialProduct.id}`).then((items) => {
    if (product.value?.id === initialProduct.id) relatedProducts.value = items
  }).catch(() => undefined)
})
watch(() => props.initialCategories, (initialCategories) => {
  if (initialCategories?.length) categories.value = initialCategories
})
</script>

<template>
  <section class="detail-page">
    <p class="breadcrumb">
      <LocalizedLink to="/">{{ t('nav.home') }}</LocalizedLink> ›
      <LocalizedLink to="/products">{{ t('nav.products') }}</LocalizedLink>
      <template v-for="category in productCategoryPath" :key="category.slug">
        <span>›</span>
        <LocalizedLink :to="`/products/category/${category.slug}`">
          {{ category.name }}
        </LocalizedLink>
      </template>
    </p>
    <StatusPanel
      v-if="isLoading"
      variant="loading"
      :title="t('detail.loadingTitle')"
      :message="t('detail.loadingMessage')"
    />
    <div v-else-if="error || !product" class="status-panel status-panel-error" role="status">
      <h2>{{ error }}</h2>
      <p>{{ t('detail.errorCopy') }}</p>
      <div class="empty-actions">
        <button class="button secondary" type="button" @click="loadProduct()">{{ t('common.retry') }}</button>
        <LocalizedLink class="button secondary" to="/products">{{ t('detail.backProducts') }}</LocalizedLink>
      </div>
    </div>
    <div v-else class="product-detail-shell">
      <ProductGallery
        :images="productGalleryItems"
        :fallback-image="configuredHeroImage"
        :image-tone="product.image_tone"
        :product-name="productName"
      />

      <ProductPurchasePanel
        :product-name="productName"
        :product-code="product.product_code"
        :model="product.model"
        :category-name="productCategoryName"
        :category-label="t('detail.productCategory')"
        :product-code-label="t('detail.productCode')"
        :model-label="t('detail.model')"
        :label-separator="t('detail.labelSeparator')"
        :summary="productSummarySections.functionalSummary"
        :summary-title="t('detail.functionSummary')"
        :highlights="productHighlights"
        :highlights-title="t('detail.productHighlights')"
        :variants="localizedProduct?.variants ?? []"
        :variant-selector-title="t('detail.variantSelector')"
        :price-breaks="productPriceBreaks"
        :specifications="productSpecifications"
        :spec-preview-title="t('detail.model')"
        :quote-label="t('detail.quote')"
        :whatsapp-label="t('common.chatWhatsApp')"
        :quote-url="`/contact?product=${product.slug}`"
        :whatsapp-url="whatsappLink"
      />

      <ProductAssurancePanel
        :title="t('detail.orderProtection')"
        :items="configuredAssuranceItems"
        :logistics-title="fulfillmentTitle"
        :logistics-copy="fulfillmentCopy"
        :logistics-items="fulfillmentItems"
        :multi-product-offer="t('detail.multiProductOffer')"
        :save-label="t('detail.saveMore')"
        multi-product-url="/products?select=1"
        :quote-label="t('detail.quote')"
        :quote-url="`/contact?product=${product.slug}`"
      />
    </div>

    <ProductSpecificationDeck
      v-if="product"
      :specs-title="t('detail.specs')"
      :specs-request="t('detail.specsRequest')"
      :specifications="productSpecifications"
      :process-items="processItems"
      :packaging-parameter-label="t('detail.packagingParameter')"
      :label-separator="t('detail.specificationLabelSeparator')"
      :item-separator="t('detail.specificationItemSeparator')"
    >
      <template #after-specifications>
        <ProductDetailContent
          v-if="productSummarySections.applicationScenario || productDescription.trim()"
          :title="t('detail.productDescription')"
          :intro="productSummarySections.applicationScenario"
          :content="productDescription"
        />
      </template>
    </ProductSpecificationDeck>

    <section v-if="relatedProducts.length" class="related-section">
      <div class="section-heading split">
        <div>
          <span>{{ t('detail.related') }}</span>
          <h2>{{ t('detail.moreIn') }} {{ productCategoryName }}</h2>
        </div>
        <LocalizedLink :to="`/products/category/${product?.category.slug}`">{{ t('detail.viewCategory') }} →</LocalizedLink>
      </div>
      <div class="product-grid related-grid">
        <ProductCard v-for="item in relatedProducts" :key="item.slug" :product="item" />
      </div>
    </section>
    <SeoGeoEvidence v-if="localizedProduct" :record="localizedProduct" />
  </section>
</template>
