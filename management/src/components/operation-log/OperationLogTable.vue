<script setup lang="ts">
import { computed } from 'vue'
import { Eye, Trash2 } from '@lucide/vue'
import type { OperationLogSummary } from '../../types/operationLog'
import { formatManagementDate } from '../../utils/dateTime'

const props = defineProps<{
  logs: OperationLogSummary[]
  selectedIds: number[]
  isDeleting: boolean
}>()

const emit = defineEmits<{
  updateSelection: [ids: number[]]
  view: [log: OperationLogSummary]
  remove: [log: OperationLogSummary]
}>()

const selectedIdSet = computed(() => new Set(props.selectedIds))
const allSelected = computed(() => props.logs.length > 0 && props.logs.every(log => selectedIdSet.value.has(log.id)))

function toggleAll(checked: boolean) {
  emit('updateSelection', checked ? props.logs.map(log => log.id) : [])
}

function toggleOne(id: number, checked: boolean) {
  const next = new Set(props.selectedIds)
  if (checked) next.add(id)
  else next.delete(id)
  emit('updateSelection', [...next])
}

function formatDate(value: string) {
  return formatManagementDate(value)
}

</script>

<template>
  <div class="data-table-wrap">
    <table class="data-table operation-log-table">
      <thead>
        <tr>
          <th class="selection-cell">
            <input
              :checked="allSelected"
              type="checkbox"
              aria-label="全选当前日志"
              @change="toggleAll(($event.target as HTMLInputElement).checked)"
            />
          </th>
          <th>操作人</th>
          <th>时间</th>
          <th>功能板块</th>
          <th>操作</th>
          <th>管理</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in logs" :key="log.id">
          <td class="selection-cell">
            <input
              :checked="selectedIdSet.has(log.id)"
              type="checkbox"
              :aria-label="`选择日志 ${log.id}`"
              @change="toggleOne(log.id, ($event.target as HTMLInputElement).checked)"
            />
          </td>
          <td>
            <strong>{{ log.admin_username }}</strong>
            <span class="table-muted">ID: {{ log.admin_user_id ?? '-' }}</span>
          </td>
          <td>{{ formatDate(log.created_at) }}</td>
          <td><span class="status-pill status-won">{{ log.module }}</span></td>
          <td>{{ log.action }}</td>
          <td>
            <div class="table-actions">
              <button class="icon-button" type="button" aria-label="查看日志" title="查看" @click="emit('view', log)">
                <Eye />
              </button>
              <button
                class="icon-button danger-icon"
                type="button"
                :disabled="isDeleting"
                aria-label="删除日志"
                title="删除"
                @click="emit('remove', log)"
              >
                <Trash2 />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <article v-if="!logs.length" class="empty-panel">
      <strong>暂无操作日志</strong>
      <p>完成一次内容、产品、询盘或文件修改后，这里会显示审计记录。</p>
    </article>
  </div>
</template>

<style scoped>
.operation-log-table {
  min-width: 760px;
}

.operation-log-table th:last-child,
.operation-log-table td:last-child {
  width: 104px;
  text-align: center;
}
</style>
