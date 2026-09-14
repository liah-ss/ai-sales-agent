import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { getAnalyticsReport, getPageViewLogs } from '../api/analytics'
import type { AnalyticsFilters, AnalyticsReport, PageViewLogList } from '../types/analytics'

const emptyReport: AnalyticsReport = { start_date: '', end_date: '', rows: [] }
const emptyLogs: PageViewLogList = { items: [], total: 0, page: 1, page_size: 50 }

export const useAnalyticsStore = defineStore('analytics', () => {
  const report = shallowRef<AnalyticsReport>(emptyReport)
  const logs = shallowRef<PageViewLogList>(emptyLogs)
  const isLoading = shallowRef(false)
  const error = shallowRef('')

  const totals = computed(() => report.value.rows.reduce((total, row) => ({
    visitsPv: total.visitsPv + row.visits_pv,
    dailyUv: total.dailyUv + row.visits_uv,
    productPv: total.productPv + row.product_page_pv,
    solutionPv: total.solutionPv + row.solution_page_pv,
  }), { visitsPv: 0, dailyUv: 0, productPv: 0, solutionPv: 0 }))

  async function load(filters: AnalyticsFilters, token: string) {
    isLoading.value = true
    error.value = ''
    try {
      const [reportResult, logsResult] = await Promise.all([
        getAnalyticsReport(filters, token),
        getPageViewLogs(filters, token),
      ])
      report.value = reportResult
      logs.value = logsResult
    }
    catch {
      error.value = '无法加载访问统计，请稍后重试。'
    }
    finally {
      isLoading.value = false
    }
  }

  async function loadLogs(filters: AnalyticsFilters, token: string) {
    isLoading.value = true
    error.value = ''
    try {
      logs.value = await getPageViewLogs(filters, token)
    }
    catch {
      error.value = '无法加载访问日志，请稍后重试。'
    }
    finally {
      isLoading.value = false
    }
  }

  return { report, logs, isLoading, error, totals, load, loadLogs }
})
