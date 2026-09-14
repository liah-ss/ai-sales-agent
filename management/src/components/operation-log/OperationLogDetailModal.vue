<script setup lang="ts">
import { computed } from 'vue'
import { X } from '@lucide/vue'
import type { OperationLog, OperationLogValue } from '../../types/operationLog'
import { formatManagementDate } from '../../utils/dateTime'

const props = defineProps<{
  log: OperationLog | null
}>()

const emit = defineEmits<{
  close: []
}>()

function isRecord(value: OperationLogValue | unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function readableName(value: OperationLogValue) {
  if (!isRecord(value)) return ''
  const name = value.name ?? value.title ?? value.headline ?? value.original_name ?? value.slug ?? value.key
  return typeof name === 'string' ? name : ''
}

function valueText(value: unknown) {
  if (value === null || value === undefined || value === '') return '空'
  if (typeof value === 'boolean') return value ? '启用' : '停用'
  if (Array.isArray(value)) return `${value.length} 项`
  if (isRecord(value)) return readableName(value) || '对象内容'
  return String(value)
}

function labelForPath(path: string) {
  const first = path.split('.')[0] ?? path
  const last = path.split('.').at(-1) ?? path
  const labels: Record<string, string> = {
    banners: '首页 Banner', homeSections: '首页板块', featureCards: '首页卡片', pages: '页面内容',
    name: '名称', title: '标题', headline: '标题', subtitle: '副标题', summary: '摘要',
    client_name: '客户名称', industry: '行业场景', location: '交付地区', delivered_at: '交付时间',
    description: '描述', content: '正文', slug: '标识', model: '型号', category_id: '分类',
    main_image: '主图', images: '图片', highlights: '亮点', specifications: '规格参数',
    sort_order: '排序', is_active: '状态', is_hot: '热销', color: '颜色', tag: '标签',
    usage: '用途', status: '状态', note: '备注',
  }
  return labels[first] ?? labels[last] ?? last
}

function collectChanges(before: unknown, after: unknown, path = '', changes: string[] = []) {
  if (changes.length >= 12 || JSON.stringify(before) === JSON.stringify(after)) return changes
  if (isRecord(before) && isRecord(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    for (const key of keys) {
      if (key === 'id' || key.endsWith('_at')) continue
      collectChanges(before[key], after[key], path ? `${path}.${key}` : key, changes)
      if (changes.length >= 12) break
    }
    return changes
  }
  changes.push(`${labelForPath(path)}：${valueText(before)} -> ${valueText(after)}`)
  return changes
}

const changeSummary = computed(() => {
  const log = props.log
  if (!log) return []
  if (!log.before_data && log.after_data) return [`新增：${readableName(log.after_data) || log.module}`]
  if (log.before_data && !log.after_data) return [`删除：${readableName(log.before_data) || log.module}`]
  const changes = collectChanges(log.before_data, log.after_data)
  return changes.length ? changes : ['内容已保存，字段值未发生可识别变化。']
})

function formatJson(value: OperationLogValue) {
  return value ? JSON.stringify(value, null, 2) : '无数据'
}

function formatDate(value: string) {
  return formatManagementDate(value)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="log" class="modal-backdrop" role="presentation" @click.self="emit('close')">
      <section class="modal-panel operation-log-detail" role="dialog" aria-modal="true" aria-label="查看操作日志">
        <button class="icon-button modal-close" type="button" aria-label="关闭" @click="emit('close')">
          <X />
        </button>

        <header class="operation-log-detail-header">
          <span class="system-label">操作日志 #{{ log.id }}</span>
          <h2>{{ log.module }} / {{ log.action }}</h2>
          <p>{{ log.admin_username }} · {{ formatDate(log.created_at) }}</p>
        </header>

        <section class="operation-change-summary">
          <h3>变更内容</h3>
          <ul>
            <li v-for="item in changeSummary" :key="item">{{ item }}</li>
          </ul>
        </section>

        <div class="operation-data-grid">
          <section>
            <h3>修改前</h3>
            <pre>{{ formatJson(log.before_data) }}</pre>
          </section>
          <section>
            <h3>修改后</h3>
            <pre>{{ formatJson(log.after_data) }}</pre>
          </section>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.operation-log-detail {
  width: min(1040px, calc(100vw - 32px));
  max-height: min(820px, calc(100vh - 40px));
  overflow: auto;
}

.operation-log-detail-header {
  padding-right: 44px;
}

.operation-log-detail-header h2 {
  margin: 8px 0 4px;
}

.operation-log-detail-header p {
  margin: 0;
  color: var(--muted);
}

.operation-change-summary {
  margin-top: 20px;
  border-top: 1px solid var(--border);
  padding-top: 18px;
}

.operation-change-summary h3,
.operation-data-grid h3 {
  margin: 0 0 10px;
  font-size: 15px;
}

.operation-change-summary ul {
  margin: 0;
  padding-left: 20px;
  color: #344054;
  line-height: 1.7;
}

.operation-data-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.operation-data-grid pre {
  min-height: 180px;
  max-height: 360px;
  margin: 0;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  background: #f8fafc;
  color: #344054;
  font: 12px/1.65 ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  .operation-data-grid {
    grid-template-columns: 1fr;
  }
}
</style>
