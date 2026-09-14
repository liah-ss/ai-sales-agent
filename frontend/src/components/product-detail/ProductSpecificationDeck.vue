<script setup lang="ts">
import { computed } from 'vue'
import { Factory, FileCheck2, Gauge, PackageCheck } from '@lucide/vue'
import { formatProductSpecifications } from './productSpecificationData'

export interface ProcessItem {
  title: string
  copy: string
}

const props = defineProps<{
  specsTitle: string
  specsRequest: string
  specifications: Array<{ label: string; value: string }>
  processItems: ProcessItem[]
  packagingParameterLabel: string
  labelSeparator: string
  itemSeparator: string
}>()

const processIcons = [Gauge, Factory, FileCheck2, PackageCheck]
const displaySpecifications = computed(() => formatProductSpecifications(props.specifications, {
  packagingParameterLabel: props.packagingParameterLabel,
  labelSeparator: props.labelSeparator,
  itemSeparator: props.itemSeparator,
}))
const specificationPairs = computed(() => {
  const pairs: Array<Array<{ label: string; value: string } | null>> = []
  for (let index = 0; index < displaySpecifications.value.length; index += 2) {
    pairs.push([displaySpecifications.value[index], displaySpecifications.value[index + 1] ?? null])
  }
  return pairs
})
</script>

<template>
  <section class="specification-deck">
    <div class="specification-heading">
      <h2>{{ specsTitle }}</h2>
    </div>

    <div v-if="specificationPairs.length" class="main-parameter-table">
      <div v-for="(pair, index) in specificationPairs" :key="index" class="main-parameter-row">
        <strong>{{ pair[0]?.label }}</strong>
        <span>{{ pair[0]?.value }}</span>
        <strong>{{ pair[1]?.label ?? '' }}</strong>
        <span>{{ pair[1]?.value ?? '' }}</span>
      </div>
    </div>
    <p v-else class="muted-copy">{{ specsRequest }}</p>

    <slot name="after-specifications"></slot>

    <div class="process-grid">
      <section v-for="(item, index) in processItems" :key="item.title" class="process-card">
        <component :is="processIcons[index] ?? Gauge" class="process-icon" />
        <h3>{{ item.title }}</h3>
        <p>{{ item.copy }}</p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.specification-deck {
  margin-top: 54px;
}

.specification-heading {
  margin-bottom: 18px;
}

.specification-heading h2 {
  margin: 0;
  color: #151c25;
  font-size: 30px;
}

.main-parameter-table {
  overflow: hidden;
  border: 1px solid #e0e7ee;
  border-radius: 8px;
  background: #fff;
}

.main-parameter-row {
  display: grid;
  grid-template-columns: minmax(110px, 180px) minmax(0, 1fr) minmax(110px, 180px) minmax(0, 1fr);
  border-bottom: 1px solid #e0e7ee;
}

.main-parameter-row:last-child {
  border-bottom: 0;
}

.main-parameter-row strong,
.main-parameter-row span {
  min-height: 52px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  border-right: 1px solid #e0e7ee;
  overflow-wrap: anywhere;
}

.main-parameter-row strong {
  background: #f7fafc;
  color: #24313d;
}

.main-parameter-row span {
  color: #4b5966;
}

.main-parameter-row span:last-child {
  border-right: 0;
}

.muted-copy {
  margin: 0;
  color: #6b7783;
  line-height: 1.7;
}

.process-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.process-card {
  min-width: 0;
  border: 1px solid #e0e7ee;
  border-radius: 8px;
  padding: 18px;
  background: #fff;
}

.process-icon {
  width: 24px;
  height: 24px;
  color: #1f6d86;
}

.process-card h3 {
  margin: 14px 0 7px;
  color: #1d2733;
  font-size: 15px;
}

.process-card p {
  margin: 0;
  color: #6b7783;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 980px) {
  .main-parameter-row {
    grid-template-columns: minmax(100px, 150px) minmax(0, 1fr) minmax(100px, 150px) minmax(0, 1fr);
  }

  .process-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .main-parameter-row {
    grid-template-columns: minmax(92px, 0.5fr) minmax(0, 1fr);
  }

  .main-parameter-row strong:nth-of-type(2),
  .main-parameter-row span:nth-of-type(2) {
    border-top: 1px solid #e0e7ee;
  }

  .main-parameter-row strong,
  .main-parameter-row span {
    min-height: 46px;
    padding: 12px;
  }

  .process-grid {
    grid-template-columns: 1fr;
  }
}
</style>
