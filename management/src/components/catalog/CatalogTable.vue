<script setup lang="ts">
import { computed } from 'vue'
import { Archive, ChevronDown, ChevronRight, Eye, Pencil, Plus, RotateCcw, Trash2 } from '@lucide/vue'
import type { CatalogItem, CatalogKind, ManagementCategorySummary } from '../../types/catalog'

const props = defineProps<{
  kind: CatalogKind
  items: CatalogItem[]
  selectedIds: number[]
  expandedCategoryIds: number[]
}>()

const emit = defineEmits<{
  view: [id: number]
  edit: [id: number]
  toggleActive: [id: number, isActive: boolean]
  remove: [id: number]
  updateSelection: [ids: number[]]
  toggleCategoryExpanded: [id: number]
  createChildCategory: [id: number]
}>()

type CatalogDisplayRow = CatalogItem & {
  categoryDepth?: number
  categoryChildCount?: number
  categoryHasChildren?: boolean
  categoryExpanded?: boolean
}

const categoryMap = computed(() => new Map(
  props.items
    .filter((item): item is ManagementCategorySummary => props.kind === 'categories' && 'parent_id' in item)
    .map(category => [category.id, category]),
))
const expandedCategorySet = computed(() => new Set(props.expandedCategoryIds))
const rows = computed<CatalogDisplayRow[]>(() => {
  if (props.kind !== 'categories') return props.items as CatalogDisplayRow[]
  const categories = props.items as ManagementCategorySummary[]
  const childrenByParent = new Map<number, ManagementCategorySummary[]>()
  const roots: ManagementCategorySummary[] = []
  categories.forEach(category => {
    if (category.parent_id) {
      const rows = childrenByParent.get(category.parent_id) ?? []
      rows.push(category)
      childrenByParent.set(category.parent_id, rows)
      return
    }
    roots.push(category)
  })

  function appendCategory(category: ManagementCategorySummary, depth = 0): CatalogDisplayRow[] {
    const children = childrenByParent.get(category.id) ?? []
    const expanded = expandedCategorySet.value.has(category.id)
    const row: CatalogDisplayRow = {
      ...category,
      categoryDepth: depth,
      categoryChildCount: children.length,
      categoryHasChildren: children.length > 0,
      categoryExpanded: expanded,
    }
    if (!expanded) return [row]
    return [row, ...children.flatMap(child => appendCategory(child, depth + 1))]
  }
  return roots.flatMap(root => appendCategory(root))
})
const selectedIdSet = computed(() => new Set(props.selectedIds))
const allSelected = computed(() => rows.value.length > 0 && rows.value.every(item => selectedIdSet.value.has(item.id)))

function titleFor(item: CatalogItem) {
  if ('name' in item) return item.name
  return item.title
}

function subtitleFor(item: CatalogItem) {
  if (props.kind === 'products' && 'model' in item) return `${item.product_code} · 第 ${item.batch_number} 批 · ${item.model} · ${item.category.name}`
  if (props.kind === 'news' && 'published_at' in item) return `${item.published_at} · ${item.source}`
  if (props.kind === 'delivery-cases' && 'delivered_at' in item) return item.delivered_at
  if (props.kind === 'categories' && 'slug' in item) {
    const category = item as ManagementCategorySummary
    const parentName = category.parent_id ? categoryMap.value.get(category.parent_id)?.name : ''
    return category.parent_id ? `${category.slug} · 隶属：${parentName || '未找到父级'}` : `${category.slug} · 顶级分类`
  }
  return 'slug' in item ? item.slug : ''
}

function categoryLevelLabel(item: CatalogItem) {
  if (props.kind !== 'categories' || !('parent_id' in item)) return ''
  return item.parent_id ? '子分类' : '顶级分类'
}

function statusLabel(item: CatalogItem) {
  return item.is_active ? '启用' : '停用'
}

function sortFor(item: CatalogItem) {
  return item.sort_order
}

function extraFor(item: CatalogItem) {
  if (props.kind === 'products' && 'is_hot' in item) return item.is_hot ? '热销产品' : item.price_mode
  if (props.kind === 'categories' && 'color' in item) {
    const row = item as CatalogDisplayRow
    return row.categoryHasChildren ? `${row.categoryChildCount} 个子分类` : '暂无子分类'
  }
  if (props.kind === 'news' && 'source' in item) return item.source
  if (props.kind === 'delivery-cases' && 'industry' in item) return item.industry
  if ('scenarios' in item) return `${item.scenarios.length} 个场景`
  return ''
}

function canDelete() {
  return props.kind === 'categories' || props.kind === 'products' || props.kind === 'solutions' || props.kind === 'news' || props.kind === 'delivery-cases'
}

function toggleOne(id: number, checked: boolean) {
  const next = new Set(props.selectedIds)
  if (checked) next.add(id)
  else next.delete(id)
  emit('updateSelection', [...next])
}

function toggleAll(checked: boolean) {
  const next = new Set(props.selectedIds)
  rows.value.forEach(item => {
    if (checked) next.add(item.id)
    else next.delete(item.id)
  })
  emit('updateSelection', [...next])
}

function categoryDepthFor(item: CatalogDisplayRow) {
  return props.kind === 'categories' ? item.categoryDepth ?? 0 : 0
}

function isTopCategory(item: CatalogDisplayRow) {
  return props.kind === 'categories' && 'parent_id' in item && !item.parent_id
}
</script>

<template>
  <div class="data-table-wrap">
    <table class="data-table catalog-data-table">
      <thead>
        <tr>
          <th class="selection-cell">
            <input
              :checked="allSelected"
              type="checkbox"
              aria-label="全选"
              @change="toggleAll(($event.target as HTMLInputElement).checked)"
            />
          </th>
          <th>名称</th>
          <th>{{ props.kind === 'products' ? '编号 / 型号 / 小类' : '标识 / 上下文' }}</th>
          <th v-if="props.kind !== 'products'">附加信息</th>
          <th>排序</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in rows"
          :key="item.id"
          :class="{
            disabled: !item.is_active,
            'category-row': props.kind === 'categories',
            'category-child-row': props.kind === 'categories' && categoryDepthFor(item) > 0,
          }"
        >
          <td class="selection-cell">
            <input
              :checked="selectedIdSet.has(item.id)"
              type="checkbox"
              :aria-label="`选择 ${titleFor(item)}`"
              @change="toggleOne(item.id, ($event.target as HTMLInputElement).checked)"
            />
          </td>
          <td>
            <div
              class="category-name-cell"
              :class="{ 'has-category-tree': props.kind === 'categories' }"
              :style="{ paddingLeft: props.kind === 'categories' ? `${categoryDepthFor(item) * 24}px` : '0px' }"
            >
              <button
                v-if="props.kind === 'categories' && item.categoryHasChildren"
                class="category-expand-button"
                type="button"
                :aria-label="item.categoryExpanded ? '收起子分类' : '展开子分类'"
                :title="item.categoryExpanded ? '收起子分类' : '展开子分类'"
                @click="emit('toggleCategoryExpanded', item.id)"
              >
                <ChevronDown v-if="item.categoryExpanded" />
                <ChevronRight v-else />
              </button>
              <span v-else-if="props.kind === 'categories'" class="category-expand-spacer" aria-hidden="true"></span>
              <div class="category-title-block">
                <strong>{{ titleFor(item) }}</strong>
                <span v-if="categoryLevelLabel(item)" class="category-level-badge">{{ categoryLevelLabel(item) }}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="table-muted">{{ subtitleFor(item) }}</span>
          </td>
          <td v-if="props.kind !== 'products'">{{ extraFor(item) }}</td>
          <td>{{ sortFor(item) }}</td>
          <td>
            <span class="status-pill" :class="item.is_active ? 'status-won' : 'status-archived'">{{ statusLabel(item) }}</span>
          </td>
          <td>
            <div class="table-actions">
              <button
                v-if="isTopCategory(item)"
                class="icon-button category-add-child-button"
                type="button"
                aria-label="新增子分类"
                title="新增子分类"
                @click="emit('createChildCategory', item.id)"
              >
                <Plus />
              </button>
              <button class="icon-button" type="button" aria-label="查看" title="查看" @click="emit('view', item.id)">
                <Eye />
              </button>
              <button class="icon-button" type="button" aria-label="编辑" title="编辑" @click="emit('edit', item.id)">
                <Pencil />
              </button>
              <button
                class="icon-button"
                type="button"
                :aria-label="item.is_active ? '停用' : '恢复'"
                :title="item.is_active ? '停用' : '恢复'"
                @click="emit('toggleActive', item.id, !item.is_active)"
              >
                <Archive v-if="item.is_active" />
                <RotateCcw v-else />
              </button>
              <button
                v-if="canDelete()"
                class="icon-button danger-icon"
                type="button"
                aria-label="删除"
                title="删除"
                @click="emit('remove', item.id)"
              >
                <Trash2 />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <article v-if="!rows.length" class="empty-panel">
      <strong>暂无记录</strong>
      <p>请新增一条记录后开始维护该目录。</p>
    </article>
  </div>
</template>
