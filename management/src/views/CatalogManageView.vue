<script setup lang="ts">
import { computed, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Boxes, BriefcaseBusiness, CheckCircle2, Layers3, Newspaper, Plus, Search, Tags, Trash2, UploadCloud } from '@lucide/vue'
import { useRoute } from 'vue-router'
import CatalogModal from '../components/catalog/CatalogModal.vue'
import CatalogPagination from '../components/catalog/CatalogPagination.vue'
import CatalogTable from '../components/catalog/CatalogTable.vue'
import { useAuthStore } from '../stores/auth'
import { useCatalogManagementStore } from '../stores/catalogManagement'
import type {
  CatalogItem,
  CatalogKind,
  CategoryPayload,
  DeliveryCasePayload,
  NewsArticlePayload,
  ProductPayload,
  SolutionPayload,
} from '../types/catalog'

const route = useRoute()
const authStore = useAuthStore()
const store = useCatalogManagementStore()
const {
  categories,
  products,
  solutions,
  news,
  deliveryCases,
  counts,
  isLoading,
  isLoadingProducts,
  isSaving,
  error,
  lastSavedAt,
  productPage,
  productPageSize,
  productTotal,
} = storeToRefs(store)

const modalMode = shallowRef<'view' | 'edit' | 'create'>('view')
const modalOpen = shallowRef(false)
const selectedId = shallowRef<number | null>(null)
const selectedDetail = shallowRef<CatalogItem | null>(null)
const selectedIds = shallowRef<number[]>([])
const expandedCategoryIds = shallowRef<number[]>([])
const categoryParentId = shallowRef<number | null>(null)
const importMessage = shallowRef('')
const searchInput = shallowRef('')
const bulkImportInput = useTemplateRef<HTMLInputElement>('bulkImportInput')
const activeKind = computed<CatalogKind>(() => {
  if (route.name === 'categories') return 'categories'
  if (route.name === 'solutions') return 'solutions'
  if (route.name === 'news-management') return 'news'
  if (route.name === 'delivery-cases-management') return 'delivery-cases'
  return 'products'
})

const kindMeta = computed(() => {
  if (activeKind.value === 'categories') return { label: '分类', scope: '产品筛选目录', icon: Tags, description: '维护对外产品筛选使用的产品分类和层级关系。' }
  if (activeKind.value === 'solutions') return { label: '解决方案', scope: '场景内容与关联产品', icon: Layers3, description: '维护应用场景页面、项目解决方案内容和关联产品入口。' }
  if (activeKind.value === 'news') return { label: '资讯', scope: '行业内容发布', icon: Newspaper, description: '维护行业资讯、上下架状态、缩略图和展示顺序。' }
  if (activeKind.value === 'delivery-cases') return { label: '交付案例', scope: '项目案例发布', icon: BriefcaseBusiness, description: '维护对外交付案例、项目背景、客户行业、交付地区和展示顺序。' }
  return { label: '产品', scope: '驱动前台产品详情页', icon: Boxes, description: '维护产品图片、名称型号、副标题、价格档位、技术参数、物流交付和订单保障展示。' }
})

const sourceItems = computed<CatalogItem[]>(() => {
  if (activeKind.value === 'categories') return categories.value
  if (activeKind.value === 'solutions') return solutions.value
  if (activeKind.value === 'news') return news.value
  if (activeKind.value === 'delivery-cases') return deliveryCases.value
  return products.value
})
const activeItems = computed<CatalogItem[]>(() => {
  return sourceItems.value
})
const productTotalPages = computed(() => Math.max(1, Math.ceil(productTotal.value / productPageSize.value)))
const selectedItem = computed(() => {
  if (selectedDetail.value?.id === selectedId.value) return selectedDetail.value
  return sourceItems.value.find(item => item.id === selectedId.value) ?? null
})
const selectedCount = computed(() => selectedIds.value.length)
const summaryTiles = computed(() => [
  { label: '产品总数', value: String(counts.value.products), icon: Boxes },
  { label: '上架产品', value: String(counts.value.activeProducts), icon: CheckCircle2 },
  { label: '分类数量', value: String(counts.value.categories), icon: Tags },
  { label: '解决方案', value: String(counts.value.solutions), icon: Layers3 },
  { label: '资讯数量', value: String(counts.value.news), icon: Newspaper },
  { label: '交付案例', value: String(counts.value.deliveryCases), icon: BriefcaseBusiness },
])

function requireToken() {
  if (!authStore.token) throw new Error('Missing management token')
  return authStore.token
}

async function submitProductSearch() {
  searchInput.value = searchInput.value.trim()
  selectedIds.value = []
  await store.loadProductsPage(requireToken(), { page: 1, q: searchInput.value })
}

async function setProductPage(page: number) {
  if (page < 1 || page > productTotalPages.value || page === productPage.value) return
  closeModal()
  selectedId.value = null
  selectedIds.value = []
  await store.loadProductsPage(requireToken(), { page })
}

function createNew() {
  selectedId.value = null
  categoryParentId.value = null
  modalMode.value = 'create'
  modalOpen.value = true
}

function createChildCategory(parentId: number) {
  selectedId.value = null
  categoryParentId.value = parentId
  modalMode.value = 'create'
  modalOpen.value = true
}

async function openView(id: number) {
  selectedId.value = id
  categoryParentId.value = null
  selectedDetail.value = await store.loadItemDetail(activeKind.value, id, requireToken())
  if (!selectedDetail.value) return
  modalMode.value = 'view'
  modalOpen.value = true
}

async function openEdit(id: number) {
  selectedId.value = id
  categoryParentId.value = null
  selectedDetail.value = await store.loadItemDetail(activeKind.value, id, requireToken())
  if (!selectedDetail.value) return
  modalMode.value = 'edit'
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  selectedDetail.value = null
}

async function toggleActive(id: number, isActive: boolean) {
  await store.setActive(activeKind.value, id, isActive, requireToken())
}

async function removeItem(id: number) {
  const item = sourceItems.value.find(row => row.id === id)
  const title = item && 'name' in item ? item.name : item && 'title' in item ? item.title : ''
  const confirmed = window.confirm(`确认删除${kindMeta.value.label}${title ? `「${title}」` : ''}？此操作不可恢复。`)
  if (!confirmed) return
  const removed = await store.remove(activeKind.value, id, requireToken())
  if (removed && selectedId.value === id) {
    selectedId.value = null
    closeModal()
  }
}

async function removeSelectedItems() {
  if (!selectedIds.value.length) return
  const confirmed = window.confirm(`确认批量删除选中的 ${selectedIds.value.length} 条${kindMeta.value.label}数据？此操作不可恢复。`)
  if (!confirmed) return
  const removedIds = await store.removeMany(activeKind.value, selectedIds.value, requireToken())
  selectedIds.value = selectedIds.value.filter(id => !removedIds.includes(id))
  if (selectedId.value && removedIds.includes(selectedId.value)) {
    selectedId.value = null
    closeModal()
  }
}

function openBulkImport() {
  bulkImportInput.value?.click()
}

function resolveImportRows(data: unknown) {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const keyedRows = record[activeKind.value]
    if (Array.isArray(keyedRows)) return keyedRows
    if (Array.isArray(record.items)) return record.items
  }
  return []
}

async function handleBulkImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  importMessage.value = ''
  if (!file) return

  try {
    const data = JSON.parse(await file.text())
    const rows = resolveImportRows(data)
    if (!rows.length) {
      importMessage.value = '未识别到可导入数据，请使用 JSON 数组或 { "items": [...] }。'
      return
    }
    const confirmed = window.confirm(`确认导入 ${rows.length} 条${kindMeta.value.label}数据？`)
    if (!confirmed) return
    const count = await store.importBulk(activeKind.value, rows, requireToken())
    if (count) importMessage.value = `已导入 ${count} 条${kindMeta.value.label}数据。`
  } catch {
    importMessage.value = '导入文件解析失败，请上传 UTF-8 JSON 文件。'
  }
}

async function saveCategory(payload: CategoryPayload, id?: number) {
  const saved = await store.saveCategory(payload, requireToken(), id)
  if (saved) {
    selectedId.value = saved.id
    if (saved.parent_id && !expandedCategoryIds.value.includes(saved.parent_id)) {
      expandedCategoryIds.value = [...expandedCategoryIds.value, saved.parent_id]
    }
    categoryParentId.value = null
    closeModal()
  }
}

async function saveProduct(payload: ProductPayload, id?: number) {
  const saved = await store.saveProduct(payload, requireToken(), id)
  if (saved) {
    selectedId.value = saved.id
    closeModal()
  }
}

async function saveSolution(payload: SolutionPayload, id?: number) {
  const saved = await store.saveSolution(payload, requireToken(), id)
  if (saved) {
    selectedId.value = saved.id
    closeModal()
  }
}

async function saveNewsArticle(payload: NewsArticlePayload, id?: number) {
  const saved = await store.saveNewsArticle(payload, requireToken(), id)
  if (saved) {
    selectedId.value = saved.id
    closeModal()
  }
}

async function saveDeliveryCase(payload: DeliveryCasePayload, id?: number) {
  const saved = await store.saveDeliveryCase(payload, requireToken(), id)
  if (saved) {
    selectedId.value = saved.id
    closeModal()
  }
}

onMounted(async () => {
  await store.loadKind(activeKind.value, requireToken())
})

watch(activeKind, (kind) => {
  closeModal()
  selectedIds.value = []
  expandedCategoryIds.value = []
  categoryParentId.value = null
  searchInput.value = ''
  void store.loadKind(kind, requireToken())
})

function toggleCategoryExpanded(id: number) {
  const next = new Set(expandedCategoryIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedCategoryIds.value = [...next]
}
</script>

<template>
  <section class="page-heading config-heading">
    <span>商品内容运营 / {{ kindMeta.scope }}</span>
    <h1>{{ kindMeta.label }}管理</h1>
    <p>{{ kindMeta.description }}</p>
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
  <p v-if="importMessage" class="form-alert config-alert">{{ importMessage }}</p>
  <p v-if="isLoading" class="form-alert config-alert">正在加载目录数据...</p>

  <section class="catalog-workbench table-mode">
    <div class="catalog-list-panel config-panel">
      <div class="panel-header split">
        <div>
          <span class="system-label">{{ lastSavedAt || '已同步 API' }}</span>
          <h2>{{ kindMeta.label }}</h2>
          <p>数据按横排表格展示，可通过操作按钮查看、编辑、停用或恢复记录。</p>
        </div>
        <div class="panel-actions">
          <button
            v-if="selectedCount"
            class="ghost-button compact danger-button"
            type="button"
            :disabled="isSaving"
            @click="removeSelectedItems"
          >
            <Trash2 class="button-icon" />
            <span>批量删除 {{ selectedCount }}</span>
          </button>
          <button class="ghost-button compact" type="button" :disabled="isSaving" @click="openBulkImport">
            <UploadCloud class="button-icon" />
            <span>批量导入 JSON</span>
          </button>
          <input ref="bulkImportInput" class="sr-only-input" type="file" accept=".json,application/json" @change="handleBulkImport" />
          <button class="primary-button compact" type="button" @click="createNew">
            <Plus class="button-icon" />
            <span>{{ activeKind === 'categories' ? '新增顶级分类' : '新增' }}</span>
          </button>
        </div>
      </div>
      <form v-if="activeKind === 'products'" class="management-product-search" role="search" @submit.prevent="submitProductSearch">
        <label>
          <span class="sr-only-input">搜索商品</span>
          <input v-model="searchInput" type="search" placeholder="搜索商品名称、编号、型号或小类" />
        </label>
        <button class="primary-button compact" type="submit">
          <Search class="button-icon" />
          <span>搜索</span>
        </button>
        <span class="management-search-result">共 {{ productTotal }} 件商品</span>
      </form>
      <CatalogTable
        :aria-busy="activeKind === 'products' && isLoadingProducts"
        :items="activeItems"
        :kind="activeKind"
        :expanded-category-ids="expandedCategoryIds"
        :selected-ids="selectedIds"
        @create-child-category="createChildCategory"
        @edit="openEdit"
        @remove="removeItem"
        @toggle-category-expanded="toggleCategoryExpanded"
        @toggle-active="toggleActive"
        @update-selection="selectedIds = $event"
        @view="openView"
      />
      <CatalogPagination
        v-if="activeKind === 'products' && productTotalPages > 1"
        :current-page="productPage"
        :total-pages="productTotalPages"
        :total="productTotal"
        :page-size="productPageSize"
        :loading="isLoadingProducts"
        @change="setProductPage"
      />
    </div>

    <CatalogModal
      :open="modalOpen"
      :mode="modalMode"
      :categories="categories"
      :category-parent-id="categoryParentId"
      :is-saving="isSaving"
      :item="selectedItem"
      :kind="activeKind"
      @close="closeModal"
      @save-category="saveCategory"
      @save-delivery-case="saveDeliveryCase"
      @save-news-article="saveNewsArticle"
      @save-product="saveProduct"
      @save-solution="saveSolution"
    />
  </section>
</template>
