<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { CheckCircle2 } from '@lucide/vue'
import type { PriceBreak } from './productDetailData'
import type { ProductVariant } from '../../types/catalog'

const props = defineProps<{
  productName: string
  productCode: string
  model: string
  categoryName: string
  categoryLabel: string
  productCodeLabel: string
  modelLabel: string
  labelSeparator: string
  summary: string
  summaryTitle: string
  highlights: string[]
  highlightsTitle: string
  variants?: ProductVariant[]
  variantSelectorTitle: string
  priceBreaks: PriceBreak[]
  specifications: Array<{ label: string; value: string }>
  specPreviewTitle: string
  quoteLabel: string
  whatsappLabel: string
  quoteUrl: string
  whatsappUrl: string
}>()

const selectedVariantIndex = shallowRef(0)
const visibleVariants = computed(() => props.variants?.filter(variant => variant.name?.trim()) ?? [])
const selectedVariant = computed(() => visibleVariants.value[selectedVariantIndex.value] ?? null)
const selectedSpecifications = computed(() => {
  const variantSpecs = selectedVariant.value?.specifications ?? []
  return variantSpecs.length ? variantSpecs : props.specifications
})
const selectedModel = computed(() => selectedVariant.value?.model || props.model)
const selectedCode = computed(() => props.productCode)

function selectVariant(index: number) {
  selectedVariantIndex.value = index
}

watch(visibleVariants, () => {
  selectedVariantIndex.value = 0
})
</script>

<template>
  <article class="purchase-panel">
    <h1 class="purchase-product-title">{{ productName }}</h1>
    <dl class="product-identity">
      <div>
        <dt class="product-info-label">{{ categoryLabel }}{{ labelSeparator }}</dt>
        <dd class="product-info-value">{{ categoryName }}</dd>
      </div>
      <div>
        <dt class="product-info-label">{{ productCodeLabel }}{{ labelSeparator }}</dt>
        <dd class="product-info-value">{{ selectedCode }}</dd>
      </div>
      <div>
        <dt class="product-info-label">{{ modelLabel }}{{ labelSeparator }}</dt>
        <dd class="product-info-value">{{ selectedModel }}</dd>
      </div>
    </dl>
    <div v-if="summary.trim()" class="purchase-summary-block">
      <h2 class="product-info-label">{{ summaryTitle }}</h2>
      <p class="purchase-summary product-info-value">{{ summary }}</p>
    </div>

    <div v-if="visibleVariants.length > 1" class="variant-selector">
      <h2>{{ variantSelectorTitle }}</h2>
      <div class="variant-options">
        <button
          v-for="(variant, index) in visibleVariants"
          :key="variant.code || `${variant.name}-${index}`"
          :class="{ active: selectedVariantIndex === index }"
          type="button"
          @click="selectVariant(index)"
        >
          <span class="product-info-value">{{ variant.name }}</span>
        </button>
      </div>
    </div>

    <div class="price-break-panel">
      <div v-for="(tier, index) in priceBreaks" :key="`${tier.label ?? ''}-${tier.quantity}-${index}`" class="price-break-row">
        <span v-if="tier.label">{{ tier.label }}</span>
        <span v-if="!tier.surprise">{{ tier.quantity }}</span>
        <strong>{{ tier.price }}</strong>
      </div>
    </div>

    <section v-if="highlights.length" class="product-highlights">
      <h2 class="product-info-label">{{ highlightsTitle }}</h2>
      <ul>
        <li v-for="highlight in highlights" :key="highlight">
          <CheckCircle2 aria-hidden="true" />
          <span class="product-info-value">{{ highlight }}</span>
        </li>
      </ul>
    </section>

    <div v-if="selectedSpecifications.length" class="spec-preview">
      <h2 class="product-info-label">{{ specPreviewTitle }}</h2>
      <div class="model-preview">
        <span class="product-info-value">{{ selectedModel }}</span>
      </div>
    </div>

    <div class="purchase-actions">
      <LocalizedLink class="button primary purchase-cta" :to="quoteUrl">{{ quoteLabel }}</LocalizedLink>
      <a class="button whatsapp-button purchase-cta" :href="whatsappUrl" target="_blank" rel="noreferrer">
        {{ whatsappLabel }}
      </a>
    </div>
  </article>
</template>

<style scoped>
.purchase-panel {
  border: 1px solid #e0e7ee;
  border-radius: 8px;
  padding: 28px;
  background: #fff;
}

.purchase-product-title {
  margin: 0 0 18px;
  color: #17212b;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.product-identity {
  margin: 0;
  display: grid;
  gap: 8px;
}

.product-identity div {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.product-identity dt,
.product-identity dd {
  margin: 0;
}

.product-identity .product-info-label {
  flex: 0 0 auto;
}

.product-identity .product-info-value {
  min-width: 0;
  overflow-wrap: anywhere;
}

.product-info-label {
  margin: 0;
  color: #5d6b78;
  font-size: 14px;
  font-weight: 850;
  line-height: 1.5;
  letter-spacing: 0;
}

.product-info-value {
  color: #263442;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.65;
  letter-spacing: 0;
}

.purchase-summary-block {
  margin-top: 14px;
}

.purchase-summary-block h2 {
  margin: 0 0 8px;
}

.purchase-summary {
  margin: 0;
}

.price-break-panel {
  margin-top: 24px;
}

.variant-selector {
  margin-top: 22px;
}

.variant-selector h2 {
  margin: 0 0 10px;
  color: #7b8793;
  font-size: 14px;
  font-weight: 850;
}

.variant-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.variant-options button {
  min-height: 48px;
  border: 1px solid #dce3eb;
  border-radius: 8px;
  padding: 10px 12px;
  display: grid;
  gap: 4px;
  text-align: left;
  background: #fff;
  color: #1d2733;
}

.variant-options button.active {
  border-color: #1f6d86;
  background: #f4fafb;
  box-shadow: 0 0 0 2px rgba(31, 109, 134, 0.12);
}

.variant-options span {
  display: block;
}

.spec-preview h2 {
  margin: 0 0 10px;
}

.price-break-panel {
  border: 1px solid #e0e7ee;
  border-radius: 8px;
  min-height: 58px;
  padding: 0;
  display: grid;
  background: #fbfcfd;
}

.price-break-row {
  min-height: 58px;
  padding: 10px 16px;
  display: grid;
  grid-template-columns: minmax(72px, auto) minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e0e7ee;
}

.price-break-row:last-child {
  border-bottom: 0;
}

.price-break-row > span {
  min-width: 0;
  color: #5d6b78;
  font-size: 13px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.price-break-row > strong:only-child {
  grid-column: 1 / -1;
  text-align: center;
}

.price-break-panel strong {
  color: #e56f2f;
  font-size: 22px;
  line-height: 1.25;
}

.spec-preview {
  margin-top: 24px;
}

.product-highlights {
  margin-top: 24px;
}

.product-highlights h2 {
  margin: 0 0 10px;
}

.product-highlights ul {
  margin: 0;
  padding: 16px 0;
  border-top: 1px solid #dfe6ed;
  border-bottom: 1px solid #dfe6ed;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
  list-style: none;
}

.product-highlights li {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.product-highlights li svg {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  margin-top: 2px;
  color: #249266;
}

.model-preview {
  border: 1px solid #e0e7ee;
  border-radius: 8px;
  padding: 15px 18px;
  background: #f5f7fa;
}

.purchase-actions {
  margin-top: 28px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.purchase-cta {
  min-height: 50px;
}

@media (max-width: 820px) {
  .purchase-panel {
    padding: 20px;
  }

  .variant-options,
  .purchase-actions {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .product-highlights ul {
    grid-template-columns: 1fr;
  }

  .purchase-cta {
    width: 100%;
    min-height: 48px;
  }
}

@media (max-width: 420px) {
  .purchase-panel {
    padding: 16px;
  }
  .price-break-panel strong {
    font-size: 20px;
  }

  .price-break-row {
    grid-template-columns: 1fr auto;
  }

  .price-break-row > span:first-child:not(:last-child) {
    grid-column: 1 / -1;
  }
}
</style>
