<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { computed } from 'vue'
import type { PageViewLog } from '../../types/analytics'
import { formatManagementDate } from '../../utils/dateTime'

const props = defineProps<{
  logs: PageViewLog[]
  total: number
  page: number
  pageSize: number
}>()

const emit = defineEmits<{ changePage: [page: number] }>()
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const pageTypeLabels: Record<PageViewLog['page_type'], string> = {
  product: '商品页',
  solution: '场景方案',
  about: '关于我们',
  contact: '联系我们',
  other: '其他页面',
}

function formatTime(value: string) {
  return formatManagementDate(value, {
    dateStyle: 'short',
    timeStyle: 'medium',
    hour12: false,
  })
}
</script>

<template>
  <div class="access-log-table-wrap">
    <table class="access-log-table">
      <thead>
        <tr>
          <th>访问时间</th>
          <th>IP</th>
          <th>页面类型</th>
          <th>访问页面</th>
          <th>来源</th>
          <th>访客 / 会话</th>
          <th>终端信息</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in logs" :key="log.id">
          <td>{{ formatTime(log.created_at) }}</td>
          <td class="mono-cell">{{ log.ip_address }}</td>
          <td><span class="page-type-badge">{{ pageTypeLabels[log.page_type] }}</span></td>
          <td class="path-cell" :title="log.page_title || log.path">{{ log.path }}</td>
          <td class="referer-cell" :title="log.referrer || ''">{{ log.referrer || '直接访问' }}</td>
          <td class="identity-cell">
            <span :title="log.visitor_id">{{ log.visitor_id.slice(0, 12) }}</span>
            <small :title="log.session_id">{{ log.session_id.slice(0, 12) }}</small>
          </td>
          <td class="device-cell" :title="log.user_agent || ''">
            <span>{{ log.language || '-' }} · {{ log.screen_size || '-' }}</span>
            <small v-if="log.is_bot">机器人访问</small>
          </td>
        </tr>
        <tr v-if="!logs.length">
          <td colspan="7" class="empty-cell">所选条件下暂无访问日志</td>
        </tr>
      </tbody>
    </table>
  </div>

  <footer class="log-pagination">
    <span>共 {{ total.toLocaleString('zh-CN') }} 条，第 {{ page }} / {{ totalPages }} 页</span>
    <div>
      <button type="button" :disabled="page <= 1" title="上一页" aria-label="上一页" @click="emit('changePage', page - 1)">
        <ChevronLeft aria-hidden="true" />
      </button>
      <button type="button" :disabled="page >= totalPages" title="下一页" aria-label="下一页" @click="emit('changePage', page + 1)">
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  </footer>
</template>

<style scoped>
.access-log-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border);
}

.access-log-table {
  width: 100%;
  min-width: 1220px;
  border-collapse: collapse;
  font-size: 13px;
}

.access-log-table th,
.access-log-table td {
  max-width: 280px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}

.access-log-table th {
  background: #f1f5f7;
  color: #334155;
  font-size: 12px;
  white-space: nowrap;
}

.access-log-table tbody tr:last-child td { border-bottom: 0; }
.mono-cell, .identity-cell { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.path-cell, .referer-cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.identity-cell span, .identity-cell small, .device-cell span, .device-cell small { display: block; }
.identity-cell small, .device-cell small { margin-top: 3px; color: var(--muted); }
.device-cell small { color: #b45309; font-weight: 800; }
.page-type-badge { padding: 3px 7px; border-radius: 4px; background: #e7f3f5; color: #0e7490; font-weight: 800; white-space: nowrap; }
.empty-cell { padding: 34px !important; color: var(--muted); text-align: center !important; }

.log-pagination {
  padding-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  color: var(--muted);
  font-size: 13px;
}

.log-pagination div { display: flex; gap: 8px; }
.log-pagination button { width: 36px; height: 36px; border: 1px solid var(--border); border-radius: 6px; display: grid; place-items: center; background: #fff; color: var(--ink); }
.log-pagination button:disabled { cursor: not-allowed; opacity: 0.45; }
.log-pagination svg { width: 18px; height: 18px; }
</style>
