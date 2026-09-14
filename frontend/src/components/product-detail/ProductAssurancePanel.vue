<script setup lang="ts">
import { ClipboardCheck, Ship, ShieldCheck, Truck } from '@lucide/vue'
import type { FulfillmentItem } from '../../types/catalog'
import type { AssuranceItem } from './productDetailData'

const props = defineProps<{
  title: string
  items: AssuranceItem[]
  logisticsTitle: string
  logisticsCopy: string
  logisticsItems: FulfillmentItem[]
  multiProductOffer: string
  saveLabel: string
  multiProductUrl: string
  quoteLabel: string
  quoteUrl: string
}>()

const icons = [ShieldCheck, ClipboardCheck]
</script>

<template>
  <aside class="assurance-panel" :aria-label="title">
    <section class="logistics-panel">
      <h2>{{ logisticsTitle }}</h2>
      <p>{{ logisticsCopy }}</p>
      <div class="logistics-list">
        <article v-for="(item, index) in logisticsItems" :key="`${item.name}-${index}`">
          <component :is="index === 0 ? Ship : Truck" class="logistics-icon" />
          <div>
            <strong>{{ item.name }}</strong>
            <p v-if="item.copy">{{ item.copy }}</p>
          </div>
        </article>
      </div>
    </section>

    <h2>{{ title }}</h2>

    <div class="assurance-list">
      <section v-for="(item, index) in items" :key="`${item.title}-${index}`" class="assurance-item">
        <component :is="icons[index] ?? ShieldCheck" class="assurance-icon" />
        <div class="assurance-item-copy">
          <div class="assurance-title-line">
            <strong v-if="item.duration">{{ item.duration }}</strong>
            <h3>{{ item.title }}</h3>
          </div>
          <p v-if="item.copy">{{ item.copy }}</p>
        </div>
      </section>
    </div>

    <div class="assurance-actions">
      <LocalizedLink class="button primary assurance-cta" :to="quoteUrl">{{ quoteLabel }}</LocalizedLink>
      <LocalizedLink class="multi-offer" :to="multiProductUrl">
        {{ multiProductOffer }}
        <strong>{{ saveLabel }}</strong>
      </LocalizedLink>
    </div>
  </aside>
</template>

<style scoped>
.assurance-panel {
  position: sticky;
  top: 96px;
  border: 1px solid #e0e7ee;
  border-radius: 8px;
  padding: 24px;
  background: #fff;
  box-shadow: 0 18px 42px rgba(21, 28, 37, 0.08);
}

.assurance-panel h2 {
  margin: 0;
  color: #151c25;
  font-size: 19px;
}

.logistics-panel {
  margin-bottom: 22px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e7ee;
}

.logistics-panel h2 {
  font-size: 24px;
}

.logistics-list {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.logistics-panel p {
  margin: 8px 0 0;
  color: #6b7783;
  font-size: 13px;
  line-height: 1.62;
}

.logistics-list article {
  min-height: 52px;
  border-radius: 8px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f5f8fb;
  color: #253241;
  font-weight: 850;
}

.logistics-list article > div {
  min-width: 0;
}

.logistics-list article strong {
  color: #253241;
  font-size: 13px;
}

.logistics-list article p {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}

.logistics-icon {
  width: 21px;
  height: 21px;
  color: #1f6d86;
}

.assurance-list {
  margin-top: 20px;
  display: grid;
  gap: 0;
}

.assurance-item {
  min-height: 86px;
  padding: 16px 0;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid #e0e7ee;
}

.assurance-item:first-child {
  border-top: 1px solid #e0e7ee;
}

.assurance-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  padding: 8px;
  background: #edf7f4;
  color: #249266;
}

.assurance-item:nth-child(even) .assurance-icon {
  background: #edf5fa;
  color: #1f6d86;
}

.assurance-title-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.assurance-title-line strong {
  color: #177052;
  font-size: 22px;
  line-height: 1;
  font-weight: 950;
}

.assurance-item:nth-child(even) .assurance-title-line strong {
  color: #1f6d86;
}

.assurance-item h3 {
  margin: 0;
  color: #24313d;
  font-size: 14px;
}

.assurance-item p {
  margin: 7px 0 0;
  color: #6b7783;
  font-size: 12px;
  line-height: 1.5;
}

.assurance-actions {
  margin-top: 24px;
  display: grid;
  gap: 12px;
}

.multi-offer {
  min-height: 48px;
  border: 1px solid #f3a37d;
  border-radius: 8px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: #d8652f;
  font-weight: 900;
  text-align: center;
}

.multi-offer strong {
  border-radius: 6px;
  padding: 4px 7px;
  background: #e56f2f;
  color: #fff;
  font-size: 12px;
}

.assurance-cta {
  min-height: 50px;
  width: 100%;
}

@media (max-width: 1180px) {
  .assurance-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .assurance-panel {
    padding: 18px;
  }

  .logistics-list article,
  .multi-offer,
  .assurance-cta {
    min-height: 48px;
  }

  .multi-offer {
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
  }
}
</style>
