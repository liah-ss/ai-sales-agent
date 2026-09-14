import { apiDelete, apiGet, apiPost } from './client'
import type { OperationLog, OperationLogBatchDeleteResult, OperationLogFilters, OperationLogSummary } from '../types/operationLog'

export function getOperationLogs(token: string, filters: OperationLogFilters = {}) {
  const search = new URLSearchParams()
  if (filters.module && filters.module !== 'all') search.set('module', filters.module)
  if (filters.q) search.set('q', filters.q)
  if (filters.limit) search.set('limit', String(filters.limit))
  const query = search.toString()
  return apiGet<OperationLogSummary[]>(`/management/operation-logs${query ? `?${query}` : ''}`, token)
}

export function getOperationLog(id: number, token: string) {
  return apiGet<OperationLog>(`/management/operation-logs/${id}`, token)
}

export function deleteOperationLog(id: number, token: string) {
  return apiDelete(`/management/operation-logs/${id}`, token)
}

export function batchDeleteOperationLogs(ids: number[], token: string) {
  return apiPost<OperationLogBatchDeleteResult, { ids: number[] }>(
    '/management/operation-logs/batch-delete',
    { ids },
    token,
  )
}
