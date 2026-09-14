<script setup lang="ts">
import { Eye, Layers3, PackageSearch, Users } from '@lucide/vue'

defineProps<{
  visitsPv: number
  dailyUv: number
  productPv: number
  solutionPv: number
}>()

const metrics = [
  { key: 'visitsPv', label: '访问 PV', icon: Eye },
  { key: 'dailyUv', label: '日 UV 合计', icon: Users },
  { key: 'productPv', label: '商品页 PV', icon: PackageSearch },
  { key: 'solutionPv', label: '场景方案 PV', icon: Layers3 },
] as const
</script>

<template>
  <section class="analytics-summary" aria-label="统计摘要">
    <article v-for="metric in metrics" :key="metric.key">
      <component :is="metric.icon" aria-hidden="true" />
      <div>
        <small>{{ metric.label }}</small>
        <strong>{{ $props[metric.key].toLocaleString('zh-CN') }}</strong>
      </div>
    </article>
  </section>
</template>

<style scoped>
.analytics-summary {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.analytics-summary article {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 13px;
  background: var(--surface);
}

.analytics-summary svg {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  color: var(--signal);
}

.analytics-summary small,
.analytics-summary strong {
  display: block;
}

.analytics-summary small {
  color: var(--muted);
  font-size: 12px;
}

.analytics-summary strong {
  margin-top: 4px;
  color: var(--ink);
  font-size: 24px;
}

@media (max-width: 980px) {
  .analytics-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 560px) {
  .analytics-summary { grid-template-columns: 1fr; }
}
</style>
