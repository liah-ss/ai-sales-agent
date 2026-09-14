<script setup lang="ts">
import { computed } from 'vue'
import { Check } from '@lucide/vue'
import { getProduct } from '../../api/catalog'
import { resolveResponsiveAsset } from '../../api/client'
import { useI18n } from '../../composables/useI18n'
import { useLocalizedContent } from '../../data/localizedContent'
import { splitProductSummary } from '../product-detail/productDetailData'
import type { ProductSummary } from '../../types/catalog'
import { publicProductPath, publicProductSlug } from '../../utils/productUrl'

const props = defineProps<{
  product: ProductSummary
  selectable?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  toggleSelect: [slug: string]
}>()

const { t } = useI18n()
const { localizeProduct } = useLocalizedContent()
const localizedProduct = computed(() => localizeProduct(props.product))
const productSummary = computed(() => splitProductSummary(localizedProduct.value.summary))
const productImage = computed(() => resolveResponsiveAsset(props.product.main_image, { widths: [320, 480, 640] }))
const fallbackIcon = computed(() => {
  const source = `${props.product.slug} ${props.product.category.slug}`
  if (source.includes('transformer')) return '🔌'
  if (source.includes('plc') || source.includes('automation') || source.includes('motor')) return '🤖'
  if (source.includes('cable')) return '🔧'
  if (source.includes('cabinet') || source.includes('switchgear')) return '📦'
  if (source.includes('meter')) return '📊'
  return '⚡'
})

function toggleSelection() {
  emit('toggleSelect', props.product.slug)
}

let detailWarmupStarted = false

function warmProductDetail() {
  if (detailWarmupStarted) return
  detailWarmupStarted = true
  void getProduct(`p-id-${props.product.id}`, [publicProductSlug(props.product)]).catch(() => {
    detailWarmupStarted = false
  })
}
</script>

<template>
  <article
    class="product-card clickable"
    :class="{ selectable, selected }"
  >
    <LocalizedLink
      class="product-card-link"
      :to="publicProductPath(product)"
      :aria-label="localizedProduct.name"
      prefetch
      :prefetch-on="{ interaction: true }"
      @pointerenter="warmProductDetail"
      @pointerdown="warmProductDetail"
      @focus="warmProductDetail"
    />
    <label v-if="selectable" class="product-select-control" :class="{ selected }" @click.stop>
      <input
        type="checkbox"
        :checked="selected"
        :aria-label="t('products.selectForInquiry', '', { name: localizedProduct.name })"
        @change="toggleSelection"
      />
      <span aria-hidden="true"><Check v-if="selected" /></span>
    </label>
    <div
      :class="['product-image', product.image_tone]"
    >
      <img
        v-if="productImage.src"
        :src="productImage.src"
        :srcset="productImage.srcset || undefined"
        sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 280px"
        :alt="localizedProduct.name"
        width="640"
        height="480"
        loading="lazy"
        decoding="async"
      />
      <span v-if="!productImage.src" class="fallback-product-icon" aria-hidden="true">{{ fallbackIcon }}</span>
    </div>
    <div class="product-card-body">
      <p class="product-category" :style="{ color: product.category.color ?? '#7c3aed' }">
        {{ localizedProduct.category.name }}
      </p>
      <h3>{{ localizedProduct.name }}</h3>
      <p>{{ productSummary.functionalSummary }}</p>
      <div class="product-actions" @click.stop>
        <LocalizedLink
          :to="publicProductPath(product)"
          prefetch
          :prefetch-on="{ interaction: true }"
          @pointerenter="warmProductDetail"
          @pointerdown="warmProductDetail"
          @focus="warmProductDetail"
        >{{ t('common.learnMore') }}</LocalizedLink>
        <LocalizedLink class="mini-cta" :to="`/contact?product=${product.slug}`">{{ t('common.inquiryNow') }}</LocalizedLink>
      </div>
    </div>
  </article>
</template>
