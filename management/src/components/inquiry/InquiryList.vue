<script setup lang="ts">
import { computed } from 'vue'
import type { ManagementInquiry } from '../../types/inquiry'
import { formatManagementDate } from '../../utils/dateTime'

const props = defineProps<{
  inquiries: ManagementInquiry[]
  selectedId: number | null
  selectedIds: number[]
}>()

const emit = defineEmits<{
  select: [id: number]
  updateSelection: [ids: number[]]
}>()

const rows = computed(() => props.inquiries)
const selectedIdSet = computed(() => new Set(props.selectedIds))

function formatDate(value: string) {
  return formatManagementDate(value, { year: undefined, month: 'short', second: undefined })
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    new: '新询盘',
    contacted: '已联系',
    quoted: '已报价',
    won: '已成交',
    lost: '已丢单',
    archived: '已归档',
  }
  return labels[status] ?? status
}

function contactText(inquiry: ManagementInquiry) {
  return inquiry.email || inquiry.phone || '未留邮箱'
}

function inquiryProductLabel(inquiry: ManagementInquiry) {
  if (inquiry.product_code && inquiry.product_slug) return `${inquiry.product_code} · ${inquiry.product_slug}`
  return inquiry.product_code || inquiry.product_slug || inquiry.solution_slug || '通用询盘'
}

function toggleOne(id: number, checked: boolean) {
  const next = new Set(props.selectedIds)
  if (checked) next.add(id)
  else next.delete(id)
  emit('updateSelection', [...next])
}
</script>

<template>
  <div class="inquiry-list">
    <article
      v-for="inquiry in rows"
      :key="inquiry.id"
      class="inquiry-row"
      :class="{ active: selectedId === inquiry.id }"
    >
      <label class="inquiry-select">
        <input
          :checked="selectedIdSet.has(inquiry.id)"
          type="checkbox"
          :aria-label="`选择 ${inquiry.company}`"
          @change="toggleOne(inquiry.id, ($event.target as HTMLInputElement).checked)"
        />
      </label>
      <button class="inquiry-row-main" type="button" @click="emit('select', inquiry.id)">
        <span class="inquiry-row-top">
          <strong>{{ inquiry.company }}</strong>
          <small>{{ formatDate(inquiry.created_at) }}</small>
        </span>
        <span class="inquiry-row-meta">
          {{ inquiry.name }} · {{ contactText(inquiry) }}
        </span>
        <span class="inquiry-row-bottom">
          <span class="status-pill" :class="`status-${inquiry.status}`">{{ statusLabel(inquiry.status) }}</span>
          <span>{{ inquiryProductLabel(inquiry) }}</span>
        </span>
      </button>
    </article>
  </div>
</template>
