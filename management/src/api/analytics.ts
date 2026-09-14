import { apiGet } from './client'
import type { AnalyticsFilters, AnalyticsReport, PageViewLogList } from '../types/analytics'

function analyticsQuery(filters: AnalyticsFilters, includeLogFilters = false) {
  const search = new URLSearchParams({
    start_date: filters.startDate,
    end_date: filters.endDate,
  })
  if (includeLogFilters) {
    if (filters.pageType && filters.pageType !== 'all') search.set('page_type', filters.pageType)
    if (filters.query?.trim()) search.set('q', filters.query.trim())
    search.set('page', String(filters.page ?? 1))
    search.set('page_size', String(filters.pageSize ?? 50))
  }
  return search.toString()
}

export function getAnalyticsReport(filters: AnalyticsFilters, token: string) {
  return apiGet<AnalyticsReport>(`/management/analytics/report?${analyticsQuery(filters)}`, token)
}

export function getPageViewLogs(filters: AnalyticsFilters, token: string) {
  return apiGet<PageViewLogList>(`/management/analytics/logs?${analyticsQuery(filters, true)}`, token)
}
