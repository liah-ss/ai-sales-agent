<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  currentPage: number
  totalPages: number
  label: string
  previousLabel: string
  nextLabel: string
  pageLabel: string
}>()

const route = useRoute()

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

function pageLocation(page: number): RouteLocationRaw {
  const query = { ...route.query }
  delete query.page
  const basePath = route.path.replace(/\/page\/\d+\/?$/, '')
  return { path: page <= 1 ? basePath : `${basePath}/page/${page}`, query }
}
</script>

<template>
  <nav class="catalog-pagination" :aria-label="label">
    <RouterLink
      v-if="currentPage > 1"
      :to="pageLocation(currentPage - 1)"
      custom
      v-slot="{ href, navigate }"
    >
      <a class="catalog-pagination-arrow" :href="href" rel="prev" :aria-label="previousLabel" :title="previousLabel" @click="navigate">
        <ChevronLeft aria-hidden="true" />
      </a>
    </RouterLink>
    <span v-else class="catalog-pagination-arrow disabled" :aria-label="previousLabel">
      <ChevronLeft aria-hidden="true" />
    </span>
    <template v-for="item in visiblePages" :key="item">
      <span v-if="typeof item !== 'number'" class="catalog-pagination-ellipsis" aria-hidden="true">...</span>
      <span
        v-else-if="item === currentPage"
        class="catalog-pagination-page active"
        aria-current="page"
        :aria-label="pageLabel.replace('{page}', String(item))"
      >
        {{ item }}
      </span>
      <RouterLink
        v-else
        :to="pageLocation(item)"
        custom
        v-slot="{ href, navigate }"
      >
        <a class="catalog-pagination-page" :href="href" :aria-label="pageLabel.replace('{page}', String(item))" @click="navigate">
          {{ item }}
        </a>
      </RouterLink>
    </template>
    <RouterLink
      v-if="currentPage < totalPages"
      :to="pageLocation(currentPage + 1)"
      custom
      v-slot="{ href, navigate }"
    >
      <a class="catalog-pagination-arrow" :href="href" rel="next" :aria-label="nextLabel" :title="nextLabel" @click="navigate">
        <ChevronRight aria-hidden="true" />
      </a>
    </RouterLink>
    <span v-else class="catalog-pagination-arrow disabled" :aria-label="nextLabel">
      <ChevronRight aria-hidden="true" />
    </span>
  </nav>
</template>

<style scoped>
.catalog-pagination {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.catalog-pagination-page,
.catalog-pagination-arrow {
  width: 38px;
  height: 38px;
  border: 1px solid #d6e0e8;
  border-radius: 6px;
  display: grid;
  place-items: center;
  background: #fff;
  color: #526577;
  font-size: 13px;
  font-weight: 850;
  text-decoration: none;
}

.catalog-pagination-page:hover:not(.active),
.catalog-pagination-arrow:hover:not(.disabled) {
  border-color: #82aebe;
  background: #f1f7f9;
  color: #145b75;
}

.catalog-pagination-page.active {
  border-color: #1f6d86;
  background: #1f6d86;
  color: #fff;
}

.catalog-pagination .disabled {
  opacity: 0.38;
}

.catalog-pagination-ellipsis {
  width: 24px;
  height: 38px;
  display: grid;
  place-items: center;
  color: #738391;
  font-size: 14px;
  font-weight: 850;
}

.catalog-pagination-arrow svg {
  width: 17px;
  height: 17px;
}
</style>
