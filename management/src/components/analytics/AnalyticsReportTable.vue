<script setup lang="ts">
import type { AnalyticsDailyRow } from '../../types/analytics'

defineProps<{ rows: AnalyticsDailyRow[] }>()

const columns = [
  ['visits_pv', '访问 PV'],
  ['visits_uv', '访问 UV'],
  ['product_page_pv', '商品页 PV'],
  ['product_page_uv', '商品页 UV'],
  ['solution_page_pv', '场景方案 PV'],
  ['solution_page_uv', '场景方案 UV'],
  ['about_page_pv', '关于我们 PV'],
  ['about_page_uv', '关于我们 UV'],
  ['contact_page_pv', '联系我们 PV'],
  ['contact_page_uv', '联系我们 UV'],
] as const
</script>

<template>
  <div class="analytics-table-wrap">
    <table class="analytics-table">
      <thead>
        <tr>
          <th>日期</th>
          <th v-for="column in columns" :key="column[0]">{{ column[1] }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.date">
          <td class="date-cell">{{ row.date }}</td>
          <td v-for="column in columns" :key="column[0]">{{ row[column[0]].toLocaleString('zh-CN') }}</td>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="columns.length + 1" class="empty-cell">所选日期内暂无访问数据</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.analytics-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border);
}

.analytics-table {
  width: 100%;
  min-width: 1180px;
  border-collapse: collapse;
  font-size: 13px;
}

.analytics-table th,
.analytics-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  text-align: right;
  white-space: nowrap;
}

.analytics-table th {
  background: #f1f5f7;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
}

.analytics-table th:first-child,
.analytics-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 1;
  text-align: left;
}

.analytics-table td:first-child { background: #fff; }
.analytics-table th:first-child { z-index: 2; background: #e8eef2; }
.analytics-table tbody tr:last-child td { border-bottom: 0; }
.date-cell { color: #1f3a4a; font-weight: 800; }
.empty-cell { padding: 34px; color: var(--muted); text-align: center !important; }
</style>
