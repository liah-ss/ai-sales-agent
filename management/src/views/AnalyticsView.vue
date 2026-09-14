<script setup lang="ts">
import { BarChart3, RefreshCw, Search } from '@lucide/vue'
import { onMounted, reactive, shallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import AccessLogTable from '../components/analytics/AccessLogTable.vue'
import AnalyticsPageComparisonChart from '../components/analytics/AnalyticsPageComparisonChart.vue'
import AnalyticsPeriodPicker from '../components/analytics/AnalyticsPeriodPicker.vue'
import AnalyticsReportTable from '../components/analytics/AnalyticsReportTable.vue'
import AnalyticsSummary from '../components/analytics/AnalyticsSummary.vue'
import AnalyticsTrendChart from '../components/analytics/AnalyticsTrendChart.vue'
import { useAnalyticsStore } from '../stores/analytics'
import { useAuthStore } from '../stores/auth'
import type { AnalyticsFilters, AnalyticsPageType, AnalyticsPeriodPreset } from '../types/analytics'
import { getAnalyticsDateRange } from '../utils/analyticsDateRanges'

const pageTypeOptions: Array<{ value: AnalyticsPageType; label: string }> = [
  { value: 'all', label: '全部页面' },
  { value: 'product', label: '商品页' },
  { value: 'solution', label: '场景方案' },
  { value: 'about', label: '关于我们' },
  { value: 'contact', label: '联系我们' },
  { value: 'other', label: '其他页面' },
]

const authStore = useAuthStore()
const store = useAnalyticsStore()
const { report, logs, totals, isLoading, error } = storeToRefs(store)
const initialRange = getAnalyticsDateRange('this_week')
const activePreset = shallowRef<AnalyticsPeriodPreset | null>('this_week')
const filters = reactive<AnalyticsFilters>({
  startDate: initialRange.startDate,
  endDate: initialRange.endDate,
  pageType: 'all',
  query: '',
  page: 1,
  pageSize: 50,
})

function token() {
  if (!authStore.token) throw new Error('Missing management token')
  return authStore.token
}

async function loadAnalytics() {
  filters.page = 1
  await store.load({ ...filters }, token())
}

async function selectPreset(preset: AnalyticsPeriodPreset) {
  const range = getAnalyticsDateRange(preset)
  filters.startDate = range.startDate
  filters.endDate = range.endDate
  activePreset.value = preset
  await loadAnalytics()
}

async function applyManualDates() {
  activePreset.value = null
  await loadAnalytics()
}

function updateStartDate(value: string) {
  activePreset.value = null
  filters.startDate = value
}

function updateEndDate(value: string) {
  activePreset.value = null
  filters.endDate = value
}

async function changeLogPage(page: number) {
  filters.page = page
  await store.loadLogs({ ...filters }, token())
}

onMounted(loadAnalytics)
</script>

<template>
  <section class="page-heading config-heading">
    <span>网站运营数据</span>
    <h1>访问统计</h1>
    <p>按日期查看全站、商品、场景方案、关于我们和联系我们页面的 PV、UV，并核查访问明细。</p>
  </section>

  <AnalyticsPeriodPicker
    :start-date="filters.startDate"
    :end-date="filters.endDate"
    :active-preset="activePreset"
    :loading="isLoading"
    @select-preset="selectPreset"
    @update-start-date="updateStartDate"
    @update-end-date="updateEndDate"
    @apply="applyManualDates"
  />

  <section class="analytics-toolbar config-panel">
    <label>日志页面类型
      <select v-model="filters.pageType">
        <option v-for="option in pageTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </label>
    <label>日志搜索
      <span class="analytics-search-field">
        <Search aria-hidden="true" />
        <input v-model="filters.query" placeholder="IP、路径、访客 ID、来源" @keydown.enter.prevent="loadAnalytics" />
      </span>
    </label>
    <button class="primary-button compact" type="button" :disabled="isLoading" @click="loadAnalytics">
      <RefreshCw class="button-icon" :class="{ spinning: isLoading }" aria-hidden="true" />
      <span>{{ isLoading ? '加载中' : '查询' }}</span>
    </button>
  </section>

  <p v-if="error" class="form-alert error config-alert">{{ error }}</p>

  <AnalyticsSummary
    :visits-pv="totals.visitsPv"
    :daily-uv="totals.dailyUv"
    :product-pv="totals.productPv"
    :solution-pv="totals.solutionPv"
  />

  <section class="analytics-charts" aria-label="图表分析">
    <AnalyticsTrendChart :rows="report.rows" />
    <AnalyticsPageComparisonChart :rows="report.rows" />
  </section>

  <section class="config-panel analytics-panel">
    <div class="panel-header split">
      <div>
        <span class="system-label">日报</span>
        <h2>PV / UV 趋势明细</h2>
        <p>{{ report.start_date || filters.startDate }} 至 {{ report.end_date || filters.endDate }}</p>
      </div>
      <BarChart3 class="analytics-panel-icon" aria-hidden="true" />
    </div>
    <AnalyticsReportTable :rows="report.rows" />
  </section>

  <section class="config-panel analytics-panel">
    <div class="panel-header split">
      <div>
        <span class="system-label">访问日志</span>
        <h2>访客访问明细</h2>
        <p>包含访问 IP、页面、来源、匿名访客与会话标识、浏览器和终端信息。</p>
      </div>
    </div>
    <AccessLogTable
      :logs="logs.items"
      :total="logs.total"
      :page="logs.page"
      :page-size="logs.page_size"
      @change-page="changeLogPage"
    />
  </section>
</template>

<style scoped>
.analytics-toolbar {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 170px minmax(220px, 1fr) auto;
  align-items: end;
  gap: 12px;
}

.analytics-charts {
  margin-top: 18px;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
  gap: 18px;
}

.analytics-toolbar label {
  min-width: 0;
  display: grid;
  gap: 7px;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
}

.analytics-search-field { position: relative; display: block; }
.analytics-search-field svg { position: absolute; top: 50%; left: 11px; width: 17px; height: 17px; color: var(--muted); transform: translateY(-50%); }
.analytics-search-field input { padding-left: 36px; }
.analytics-panel { margin-top: 18px; }
.analytics-panel-icon { width: 28px; height: 28px; color: var(--signal); }
.spinning { animation: analytics-spin 0.8s linear infinite; }

@keyframes analytics-spin { to { transform: rotate(360deg); } }

@media (max-width: 1100px) {
  .analytics-charts { grid-template-columns: 1fr; }
  .analytics-toolbar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .analytics-toolbar button { min-height: 44px; }
}

@media (max-width: 620px) {
  .analytics-toolbar { grid-template-columns: 1fr; }
}
</style>
