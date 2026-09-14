<script setup lang="ts">
import { computed } from 'vue'
import type { AnalyticsDailyRow } from '../../types/analytics'

const props = defineProps<{ rows: AnalyticsDailyRow[] }>()

const pageDefinitions = [
  { key: 'product', label: '商品页', pv: 'product_page_pv', uv: 'product_page_uv' },
  { key: 'solution', label: '场景方案', pv: 'solution_page_pv', uv: 'solution_page_uv' },
  { key: 'about', label: '关于我们', pv: 'about_page_pv', uv: 'about_page_uv' },
  { key: 'contact', label: '联系我们', pv: 'contact_page_pv', uv: 'contact_page_uv' },
] as const

const totals = computed(() => pageDefinitions.map(page => ({
  key: page.key,
  label: page.label,
  pv: props.rows.reduce((sum, row) => sum + row[page.pv], 0),
  uv: props.rows.reduce((sum, row) => sum + row[page.uv], 0),
})))
const maximum = computed(() => Math.max(1, ...totals.value.flatMap(item => [item.pv, item.uv])))

function barWidth(value: number) {
  return `${(value / maximum.value) * 100}%`
}
</script>

<template>
  <section class="chart-card" aria-labelledby="page-comparison-title">
    <header class="chart-header">
      <div>
        <span class="system-label">页面对比图</span>
        <h2 id="page-comparison-title">重点页面访问对比</h2>
      </div>
      <div class="chart-legend" aria-label="图例">
        <span><i class="pv" />PV</span>
        <span><i class="uv" />UV</span>
      </div>
    </header>

    <div class="comparison-chart">
      <article v-for="item in totals" :key="item.key" class="comparison-row">
        <strong>{{ item.label }}</strong>
        <div class="bar-group">
          <div class="bar-track">
            <span class="bar pv-bar" :style="{ width: barWidth(item.pv) }" />
            <small>PV {{ item.pv.toLocaleString('zh-CN') }}</small>
          </div>
          <div class="bar-track">
            <span class="bar uv-bar" :style="{ width: barWidth(item.uv) }" />
            <small>UV {{ item.uv.toLocaleString('zh-CN') }}</small>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.chart-card {
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  background: #fff;
  box-shadow: var(--shadow);
}

.chart-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.chart-header h2 { margin: 6px 0 0; font-size: 20px; }
.chart-legend { display: flex; gap: 14px; color: #64748b; font-size: 12px; font-weight: 800; }
.chart-legend span { display: inline-flex; align-items: center; gap: 6px; }
.chart-legend i { width: 12px; height: 12px; border-radius: 3px; }
.chart-legend .pv { background: #ea580c; }
.chart-legend .uv { background: #0f766e; }
.comparison-chart { margin-top: 24px; display: grid; gap: 20px; }
.comparison-row { display: grid; grid-template-columns: 88px minmax(0, 1fr); align-items: center; gap: 12px; }
.comparison-row strong { color: #334155; font-size: 13px; }
.bar-group { display: grid; gap: 7px; }
.bar-track { position: relative; height: 25px; overflow: hidden; border-radius: 4px; background: #f1f5f9; }
.bar { position: absolute; inset: 0 auto 0 0; min-width: 2px; border-radius: inherit; }
.pv-bar { background: #fed7aa; }
.uv-bar { background: #99f6e4; }
.bar-track small { position: relative; z-index: 1; height: 100%; padding: 0 8px; display: flex; align-items: center; color: #334155; font-size: 11px; font-weight: 850; }

@media (max-width: 560px) {
  .comparison-row { grid-template-columns: 1fr; gap: 7px; }
}
</style>
