<script setup lang="ts">
import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/vue'
import { moveListItem } from './catalogProductManagementData'
import type { ProductSpecification } from '../../types/catalog'

defineProps<{ readonly?: boolean }>()

const items = defineModel<ProductSpecification[]>({ required: true })

function addItem() {
  items.value = [...items.value, { label: '', value: '' }]
}

function updateItem(index: number, patch: Partial<ProductSpecification>) {
  items.value = items.value.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
}

function removeItem(index: number) {
  items.value = items.value.filter((_, itemIndex) => itemIndex !== index)
}

function moveItem(index: number, direction: -1 | 1) {
  items.value = moveListItem(items.value, index, direction)
}
</script>

<template>
  <section class="structured-editor specifications-editor">
    <div class="structured-editor-header">
      <strong>规格参数</strong>
      <button v-if="!readonly" class="secondary-button compact" type="button" @click="addItem"><Plus />添加规格</button>
    </div>
    <div v-if="items.length" class="structured-table" role="table" aria-label="规格参数">
      <div class="structured-table-head" role="row"><span>#</span><span>参数名</span><span>参数值</span><span>操作</span></div>
      <div v-for="(item, index) in items" :key="index" class="structured-editor-row specification-item-row" role="row">
        <span class="structured-row-index">{{ index + 1 }}</span>
        <label><span class="sr-only">参数名</span><input :value="item.label" placeholder="例如：额定电压" :disabled="readonly" @input="updateItem(index, { label: ($event.target as HTMLInputElement).value })" /></label>
        <label><span class="sr-only">参数值</span><input :value="item.value" placeholder="例如：8.7/15kV" :disabled="readonly" @input="updateItem(index, { value: ($event.target as HTMLInputElement).value })" /></label>
        <div v-if="!readonly" class="structured-row-actions">
          <button type="button" title="上移" aria-label="规格上移" :disabled="index === 0" @click="moveItem(index, -1)"><ArrowUp /></button>
          <button type="button" title="下移" aria-label="规格下移" :disabled="index === items.length - 1" @click="moveItem(index, 1)"><ArrowDown /></button>
          <button class="danger" type="button" title="删除" aria-label="删除规格" @click="removeItem(index)"><Trash2 /></button>
        </div>
      </div>
    </div>
    <p v-else class="structured-editor-empty">尚未添加规格参数。</p>
  </section>
</template>
