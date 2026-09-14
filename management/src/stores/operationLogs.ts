import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { batchDeleteOperationLogs, deleteOperationLog, getOperationLog, getOperationLogs } from '../api/operationLogs'
import type { OperationLogFilters, OperationLogSummary } from '../types/operationLog'

export const useOperationLogsStore = defineStore('operation-logs', () => {
  const logs = shallowRef<OperationLogSummary[]>([])
  const isLoading = shallowRef(false)
  const isDeleting = shallowRef(false)
  const error = shallowRef('')
  const lastLoadedAt = shallowRef('')

  const counts = computed(() => ({
    total: logs.value.length,
    operators: new Set(logs.value.map(log => log.admin_username)).size,
    modules: new Set(logs.value.map(log => log.module)).size,
  }))

  function stampLoaded() {
    lastLoadedAt.value = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date())
  }

  async function load(token: string, filters: OperationLogFilters = {}) {
    isLoading.value = true
    error.value = ''
    try {
      logs.value = await getOperationLogs(token, filters)
      stampLoaded()
    } catch {
      error.value = '无法加载操作日志。'
    } finally {
      isLoading.value = false
    }
  }

  async function remove(id: number, token: string) {
    isDeleting.value = true
    error.value = ''
    try {
      await deleteOperationLog(id, token)
      logs.value = logs.value.filter(log => log.id !== id)
    } catch {
      error.value = '无法删除操作日志。'
      throw new Error(error.value)
    } finally {
      isDeleting.value = false
    }
  }

  async function loadDetail(id: number, token: string) {
    error.value = ''
    try {
      return await getOperationLog(id, token)
    } catch {
      error.value = '无法加载操作日志详情。'
      return null
    }
  }

  async function removeMany(ids: number[], token: string) {
    if (!ids.length) return 0
    isDeleting.value = true
    error.value = ''
    try {
      const result = await batchDeleteOperationLogs(ids, token)
      const deletedIds = new Set(result.deletedIds)
      logs.value = logs.value.filter(log => !deletedIds.has(log.id))
      return result.deletedCount
    } catch {
      error.value = '无法批量删除操作日志。'
      throw new Error(error.value)
    } finally {
      isDeleting.value = false
    }
  }

  return {
    logs,
    isLoading,
    isDeleting,
    error,
    lastLoadedAt,
    counts,
    load,
    loadDetail,
    remove,
    removeMany,
  }
})
