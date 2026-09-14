<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { History, Search, ShieldCheck, Trash2, Users } from '@lucide/vue'
import OperationLogTable from '../components/operation-log/OperationLogTable.vue'
import OperationLogDetailModal from '../components/operation-log/OperationLogDetailModal.vue'
import { useAuthStore } from '../stores/auth'
import { useOperationLogsStore } from '../stores/operationLogs'
import type { OperationLog, OperationLogSummary } from '../types/operationLog'

const moduleOptions = ['all', '网站内容', '产品管理', '分类管理', '解决方案', '资讯管理', '交付案例管理', '询盘管理', '资料文件', '站点设置'] as const
const limitOptions = [50, 100, 200, 500]

const authStore = useAuthStore()
const store = useOperationLogsStore()
const { logs, counts, isLoading, isDeleting, error, lastLoadedAt } = storeToRefs(store)

const moduleFilter = shallowRef<(typeof moduleOptions)[number]>('all')
const query = shallowRef('')
const limit = shallowRef(100)
const selectedIds = shallowRef<number[]>([])
const activeLog = shallowRef<OperationLog | null>(null)
const selectedCount = computed(() => selectedIds.value.length)

const summaryTiles = computed(() => [
  { label: '日志数量', value: String(counts.value.total), icon: History },
  { label: '操作人员', value: String(counts.value.operators), icon: Users },
  { label: '功能板块', value: String(counts.value.modules), icon: ShieldCheck },
  { label: '查询上限', value: String(limit.value), icon: Search },
])

const moduleLabels: Record<(typeof moduleOptions)[number], string> = {
  all: '全部',
  网站内容: '网站内容',
  产品管理: '产品管理',
  分类管理: '分类管理',
  解决方案: '解决方案',
  资讯管理: '资讯管理',
  交付案例管理: '交付案例管理',
  询盘管理: '询盘管理',
  资料文件: '资料文件',
  站点设置: '站点设置',
}

function requireToken() {
  if (!authStore.token) throw new Error('Missing management token')
  return authStore.token
}

async function loadLogs() {
  await store.load(requireToken(), {
    module: moduleFilter.value,
    q: query.value.trim(),
    limit: limit.value,
  })
  selectedIds.value = []
}

onMounted(loadLogs)

async function removeLog(log: OperationLogSummary) {
  if (!window.confirm(`确认删除这条“${log.module} / ${log.action}”日志？删除后不可恢复。`)) return
  try {
    await store.remove(log.id, requireToken())
    selectedIds.value = selectedIds.value.filter(id => id !== log.id)
  } catch {
    // Store exposes the request error above the table.
  }
}

async function viewLog(log: OperationLogSummary) {
  activeLog.value = await store.loadDetail(log.id, requireToken())
}

async function removeSelectedLogs() {
  const ids = [...selectedIds.value]
  if (!ids.length || !window.confirm(`确认删除已选择的 ${ids.length} 条操作日志？删除后不可恢复。`)) return
  try {
    await store.removeMany(ids, requireToken())
    selectedIds.value = []
  } catch {
    // Store exposes the request error above the table.
  }
}
</script>

<template>
  <section class="page-heading config-heading">
    <span>系统审计</span>
    <h1>操作日志</h1>
    <p>记录内部管理系统中的操作人、操作时间、功能板块和具体变更内容。</p>
  </section>

  <section class="config-summary">
    <article v-for="item in summaryTiles" :key="item.label" class="summary-tile">
      <component :is="item.icon" class="summary-icon" />
      <div>
        <small>{{ item.label }}</small>
        <strong>{{ item.value }}</strong>
      </div>
    </article>
  </section>

  <p v-if="error" class="form-alert error config-alert">{{ error }}</p>
  <p v-if="isLoading" class="form-alert config-alert">正在加载操作日志...</p>

  <section class="operation-toolbar config-panel">
    <label>
      功能板块
      <select v-model="moduleFilter">
        <option v-for="module in moduleOptions" :key="module" :value="module">{{ moduleLabels[module] }}</option>
      </select>
    </label>
    <label>
      搜索
      <span class="search-field">
        <Search class="button-icon" />
        <input v-model="query" placeholder="操作人、板块、动作..." @keydown.enter.prevent="loadLogs" />
      </span>
    </label>
    <label>
      查询上限
      <select v-model.number="limit">
        <option v-for="option in limitOptions" :key="option" :value="option">{{ option }}</option>
      </select>
    </label>
    <button class="primary-button compact" type="button" @click="loadLogs">应用筛选</button>
    <button
      v-if="selectedCount"
      class="ghost-button compact danger-button"
      type="button"
      :disabled="isDeleting"
      @click="removeSelectedLogs"
    >
      <Trash2 class="button-icon" />
      <span>{{ isDeleting ? '删除中...' : `批量删除 ${selectedCount}` }}</span>
    </button>
    <span class="toolbar-state">{{ lastLoadedAt || '等待查询' }}</span>
  </section>

  <section class="config-panel operation-log-panel">
    <div class="panel-header split">
      <div>
        <span class="system-label">审计记录</span>
        <h2>变更明细</h2>
        <p>横向展示每次操作的核心信息，变更内容会自动概括为字段和内容摘要。</p>
      </div>
    </div>

    <OperationLogTable
      :logs="logs"
      :selected-ids="selectedIds"
      :is-deleting="isDeleting"
      @remove="removeLog"
      @view="viewLog"
      @update-selection="selectedIds = $event"
    />
  </section>

  <OperationLogDetailModal :log="activeLog" @close="activeLog = null" />
</template>
