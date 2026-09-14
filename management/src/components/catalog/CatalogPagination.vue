<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const props = defineProps<{
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  loading?: boolean
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end'

const visiblePages = computed<PaginationItem[]>(() => {
  if (props.totalPages <= 6) {
    return Array.from({ length: props.totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, props.totalPages, props.currentPage - 1, props.currentPage, props.currentPage + 1])
  if (props.currentPage <= 2) pages.add(3)
  if (props.currentPage >= props.totalPages - 1) pages.add(props.totalPages - 2)

  const orderedPages = [...pages].filter(page => page >= 1 && page <= props.totalPages).sort((a, b) => a - b)
  return orderedPages.reduce<PaginationItem[]>((items, page, index) => {
    const previousPage = orderedPages[index - 1]
    if (previousPage !== undefined && page - previousPage === 2) items.push(previousPage + 1)
    if (previousPage !== undefined && page - previousPage > 2) {
      items.push(page < props.currentPage ? 'ellipsis-start' : 'ellipsis-end')
    }
    items.push(page)
    return items
  }, [])
})

const rangeLabel = computed(() => {
  if (!props.total) return '暂无商品'
  const start = (props.currentPage - 1) * props.pageSize + 1
  const end = Math.min(props.currentPage * props.pageSize, props.total)
  return `显示 ${start}-${end}，共 ${props.total} 件`
})

function changePage(page: number) {
  if (props.loading || page < 1 || page > props.totalPages || page === props.currentPage) return
  emit('change', page)
}
</script>

<template>
  <nav class="management-pagination" aria-label="产品分页">
    <span>{{ rangeLabel }}</span>
    <div class="management-pagination-buttons">
      <button
        type="button"
        aria-label="上一页"
        title="上一页"
        :disabled="loading || currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <template v-for="item in visiblePages" :key="item">
        <span v-if="typeof item !== 'number'" class="management-pagination-ellipsis" aria-hidden="true">...</span>
        <button
          v-else
          type="button"
          :aria-label="`第 ${item} 页`"
          :aria-current="item === currentPage ? 'page' : undefined"
          :class="{ active: item === currentPage }"
          :disabled="loading"
          @click="changePage(item)"
        >
          {{ item }}
        </button>
      </template>
      <button
        type="button"
        aria-label="下一页"
        title="下一页"
        :disabled="loading || currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>
