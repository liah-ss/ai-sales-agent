<script setup lang="ts">
import { X } from '@lucide/vue'
import CatalogEditor from './CatalogEditor.vue'
import type {
  CatalogItem,
  CatalogKind,
  CategoryPayload,
  DeliveryCasePayload,
  ManagementCategorySummary,
  NewsArticlePayload,
  ProductPayload,
  SolutionPayload,
} from '../../types/catalog'

defineProps<{
  open: boolean
  mode: 'view' | 'edit' | 'create'
  kind: CatalogKind
  item: CatalogItem | null
  categories: ManagementCategorySummary[]
  isSaving: boolean
  categoryParentId?: number | null
}>()

const emit = defineEmits<{
  close: []
  saveCategory: [payload: CategoryPayload, id?: number]
  saveDeliveryCase: [payload: DeliveryCasePayload, id?: number]
  saveNewsArticle: [payload: NewsArticlePayload, id?: number]
  saveProduct: [payload: ProductPayload, id?: number]
  saveSolution: [payload: SolutionPayload, id?: number]
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" role="presentation" @click.self="emit('close')">
      <section class="modal-panel catalog-modal" role="dialog" aria-modal="true">
        <button class="icon-button modal-close" type="button" aria-label="关闭弹窗" @click="emit('close')">
          <X />
        </button>
        <CatalogEditor
          :categories="categories"
          :is-saving="isSaving"
          :item="item"
          :kind="kind"
          :category-parent-id="categoryParentId"
          :readonly="mode === 'view'"
          @save-category="emit('saveCategory', $event, item?.id)"
          @save-delivery-case="emit('saveDeliveryCase', $event, item?.id)"
          @save-news-article="emit('saveNewsArticle', $event, item?.id)"
          @save-product="emit('saveProduct', $event, item?.id)"
          @save-solution="emit('saveSolution', $event, item?.id)"
        />
      </section>
    </div>
  </Teleport>
</template>
