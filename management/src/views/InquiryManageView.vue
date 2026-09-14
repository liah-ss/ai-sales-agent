<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { CheckCircle2, Inbox, MessageSquare, Search, Trash2 } from '@lucide/vue'
import InquiryDetailPanel from '../components/inquiry/InquiryDetailPanel.vue'
import InquiryList from '../components/inquiry/InquiryList.vue'
import { useAuthStore } from '../stores/auth'
import { useInquiryManagementStore } from '../stores/inquiryManagement'
import type { InquiryStatus } from '../types/inquiry'

const statusFilters = ['all', 'new', 'contacted', 'quoted', 'won', 'lost', 'archived'] as const

const authStore = useAuthStore()
const store = useInquiryManagementStore()
const { inquiries, counts, isLoading, isSaving, error, lastSavedAt } = storeToRefs(store)
const selectedId = shallowRef<number | null>(null)
const selectedIds = shallowRef<number[]>([])
const statusFilter = shallowRef<(typeof statusFilters)[number]>('all')
const query = shallowRef('')

const selectedInquiry = computed(() => inquiries.value.find(item => item.id === selectedId.value) ?? null)
const selectedCount = computed(() => selectedIds.value.length)
const allVisibleSelected = computed(() => inquiries.value.length > 0 && inquiries.value.every(item => selectedIds.value.includes(item.id)))
const summaryTiles = computed(() => [
  { label: '询盘总数', value: String(counts.value.total), icon: Inbox },
  { label: '新询盘', value: String(counts.value.new), icon: MessageSquare },
  { label: '已联系', value: String(counts.value.contacted), icon: CheckCircle2 },
  { label: '已报价', value: String(counts.value.quoted), icon: CheckCircle2 },
])

const statusLabels: Record<(typeof statusFilters)[number], string> = {
  all: '全部',
  new: '新询盘',
  contacted: '已联系',
  quoted: '已报价',
  won: '已成交',
  lost: '已丢单',
  archived: '已归档',
}

function requireToken() {
  if (!authStore.token) throw new Error('Missing management token')
  return authStore.token
}

async function loadInquiries() {
  await store.load(requireToken(), {
    status: statusFilter.value,
    q: query.value.trim(),
  })
  selectedId.value = inquiries.value[0]?.id ?? null
  selectedIds.value = []
}

async function updateStatus(id: number, status: InquiryStatus) {
  const saved = await store.updateStatus(id, status, requireToken())
  if (saved) selectedId.value = saved.id
}

async function addNote(id: number, note: string) {
  const saved = await store.addNote(id, note, requireToken())
  if (saved) selectedId.value = saved.id
}

function toggleAllVisible(checked: boolean) {
  if (checked) {
    selectedIds.value = inquiries.value.map(item => item.id)
    return
  }
  selectedIds.value = []
}

async function removeSelectedInquiries() {
  if (!selectedIds.value.length) return
  const confirmed = window.confirm(`确认批量删除选中的 ${selectedIds.value.length} 条询盘？此操作不可恢复。`)
  if (!confirmed) return
  const removedIds = await store.removeMany(selectedIds.value, requireToken())
  selectedIds.value = selectedIds.value.filter(id => !removedIds.includes(id))
  if (selectedId.value && removedIds.includes(selectedId.value)) {
    selectedId.value = inquiries.value[0]?.id ?? null
  }
}

onMounted(loadInquiries)
watch(statusFilter, loadInquiries)
</script>

<template>
  <section class="page-heading config-heading">
    <span>销售运营</span>
    <h1>询盘管理</h1>
    <p>查看客户询盘、跟进状态、记录销售备注，并快速打开邮件、电话和 WhatsApp 联系通道。</p>
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
  <p v-if="isLoading" class="form-alert config-alert">正在加载询盘...</p>

  <section class="inquiry-toolbar config-panel">
    <label>
      状态
      <select v-model="statusFilter">
        <option v-for="status in statusFilters" :key="status" :value="status">{{ statusLabels[status] }}</option>
      </select>
    </label>
    <label>
      搜索
      <span class="search-field">
        <Search class="button-icon" />
        <input v-model="query" placeholder="公司、邮箱、产品、留言..." @keydown.enter.prevent="loadInquiries" />
      </span>
    </label>
    <button class="primary-button compact" type="button" @click="loadInquiries">应用筛选</button>
    <button
      v-if="selectedCount"
      class="ghost-button compact danger-button"
      type="button"
      :disabled="isSaving"
      @click="removeSelectedInquiries"
    >
      <Trash2 class="button-icon" />
      <span>批量删除 {{ selectedCount }}</span>
    </button>
    <span class="toolbar-state">{{ lastSavedAt || '已同步 API' }}</span>
  </section>

  <section class="inquiry-workbench">
    <aside class="config-panel inquiry-list-panel">
      <div class="inquiry-bulk-row">
        <label>
          <input
            :checked="allVisibleSelected"
            type="checkbox"
            @change="toggleAllVisible(($event.target as HTMLInputElement).checked)"
          />
          <span>全选当前列表</span>
        </label>
        <small>{{ selectedCount ? `已选 ${selectedCount} 条` : '未选择' }}</small>
      </div>
      <InquiryList
        :inquiries="inquiries"
        :selected-id="selectedId"
        :selected-ids="selectedIds"
        @select="selectedId = $event"
        @update-selection="selectedIds = $event"
      />
    </aside>
    <InquiryDetailPanel
      :inquiry="selectedInquiry"
      :is-saving="isSaving"
      @add-note="addNote"
      @update-status="updateStatus"
    />
  </section>
</template>
