<script setup lang="ts">
import { computed } from 'vue'
import type { AnalyticsDailyRow } from '../../types/analytics'

const props = defineProps<{ rows: AnalyticsDailyRow[] }>()

const width = 760
const height = 280
const plot = { left: 54, right: 18, top: 20, bottom: 42 }
const chartWidth = width - plot.left - plot.right
const chartHeight = height - plot.top - plot.bottom
const chronologicalRows = computed(() => [...props.rows].sort((left, right) => left.date.localeCompare(right.date)))
const maximum = computed(() => Math.max(1, ...chronologicalRows.value.flatMap(row => [row.visits_pv, row.visits_uv])))

function xAt(index: number) {
  if (chronologicalRows.value.length <= 1) return plot.left + chartWidth / 2
  return plot.left + (index / (chronologicalRows.value.length - 1)) * chartWidth
}

function yAt(value: number) {
  return plot.top + chartHeight - (value / maximum.value) * chartHeight
}

function pointsFor(key: 'visits_pv' | 'visits_uv') {
  return chronologicalRows.value.map((row, index) => ({
    date: row.date,
    value: row[key],
    x: xAt(index),
    y: yAt(row[key]),
  }))
}

const pvPoints = computed(() => pointsFor('visits_pv'))
const uvPoints = computed(() => pointsFor('visits_uv'))
const pvPolyline = computed(() => pvPoints.value.map(point => `${point.x},${point.y}`).join(' '))
const uvPolyline = computed(() => uvPoints.value.map(point => `${point.x},${point.y}`).join(' '))
const yTicks = computed(() => Array.from({ length: 5 }, (_, index) => {
  const value = Math.round((maximum.value * (4 - index)) / 4)
  return { value, y: plot.top + (chartHeight * index) / 4 }
}))
const xLabels = computed(() => {
  const rows = chronologicalRows.value
  if (!rows.length) return []
  const interval = Math.max(1, Math.ceil(rows.length / 6))
  return rows
    .map((row, index) => ({ date: row.date, index, x: xAt(index) }))
    .filter(label => label.index % interval === 0 || label.index === rows.length - 1)
})

function shortDate(value: string) {
  return value.slice(5)
}
</script>

<template>
  <section class="chart-card" aria-labelledby="analytics-trend-title">
    <header class="chart-header">
      <div>
        <span class="system-label">趋势折线图</span>
        <h2 id="analytics-trend-title">访问 PV / UV 走势</h2>
      </div>
      <div class="chart-legend" aria-label="图例">
        <span><i class="pv" />PV</span>
        <span><i class="uv" />UV</span>
      </div>
    </header>

    <div v-if="rows.length" class="chart-scroll">
      <svg class="trend-chart" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="按日访问 PV 和 UV 折线图">
        <g v-for="tick in yTicks" :key="tick.y">
          <line class="grid-line" :x1="plot.left" :x2="width - plot.right" :y1="tick.y" :y2="tick.y" />
          <text class="axis-label y-label" :x="plot.left - 10" :y="tick.y + 4">{{ tick.value }}</text>
        </g>
        <text
          v-for="label in xLabels"
          :key="label.date"
          class="axis-label x-label"
          :x="label.x"
          :y="height - 15"
        >{{ shortDate(label.date) }}</text>
        <polyline class="trend-line pv-line" :points="pvPolyline" />
        <polyline class="trend-line uv-line" :points="uvPolyline" />
        <circle v-for="point in pvPoints" :key="`pv-${point.date}`" class="point pv-point" :cx="point.x" :cy="point.y" r="3.5">
          <title>{{ point.date }} · PV {{ point.value }}</title>
        </circle>
        <circle v-for="point in uvPoints" :key="`uv-${point.date}`" class="point uv-point" :cx="point.x" :cy="point.y" r="3.5">
          <title>{{ point.date }} · UV {{ point.value }}</title>
        </circle>
      </svg>
    </div>
    <p v-else class="chart-empty">所选日期内暂无趋势数据</p>
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

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.chart-header h2 { margin: 6px 0 0; font-size: 20px; }
.chart-legend { display: flex; gap: 14px; color: #64748b; font-size: 12px; font-weight: 800; }
.chart-legend span { display: inline-flex; align-items: center; gap: 6px; }
.chart-legend i { width: 20px; height: 3px; border-radius: 999px; }
.chart-legend .pv { background: #ea580c; }
.chart-legend .uv { background: #0f766e; }
.chart-scroll { margin-top: 16px; overflow-x: auto; }
.trend-chart { width: 100%; min-width: 0; display: block; }
.grid-line { stroke: #e2e8f0; stroke-width: 1; }
.axis-label { fill: #64748b; font-size: 11px; }
.y-label { text-anchor: end; }
.x-label { text-anchor: middle; }
.trend-line { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 3; }
.pv-line { stroke: #ea580c; }
.uv-line { stroke: #0f766e; }
.point { stroke: #fff; stroke-width: 2; }
.pv-point { fill: #ea580c; }
.uv-point { fill: #0f766e; }
.chart-empty { min-height: 280px; margin: 16px 0 0; display: grid; place-items: center; color: var(--muted); }
</style>
