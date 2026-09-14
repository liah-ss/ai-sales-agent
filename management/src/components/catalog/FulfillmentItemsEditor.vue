<script setup lang="ts">
import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/vue'
import { moveListItem } from './catalogProductManagementData'
import type { FulfillmentItem } from '../../types/catalog'

defineProps<{
  readonly?: boolean
  title?: string
}>()

const items = defineModel<FulfillmentItem[]>({ required: true })

function addItem() {
  items.value = [...items.value, { name: '', copy: '' }]
}

function updateItem(index: number, patch: Partial<FulfillmentItem>) {
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
  <section class="structured-editor fulfillment-items-editor">
    <div class="structured-editor-header">
      <strong>{{ title ?? '交付与物流' }}</strong>
      <button v-if="!readonly" class="secondary-button compact" type="button" @click="addItem"><Plus />添加物流方式</button>
    </div>
    <div v-if="items.length" class="structured-editor-list">
      <div v-for="(item, index) in items" :key="index" class="structured-editor-row fulfillment-item-row">
        <span class="structured-row-index">{{ index + 1 }}</span>
        <label>方式名称<input :value="item.name" placeholder="例如：全球海运" :disabled="readonly" @input="updateItem(index, { name: ($event.target as HTMLInputElement).value })" /></label>
        <label>说明<input :value="item.copy" placeholder="例如：支持港到港与门到门" :disabled="readonly" @input="updateItem(index, { copy: ($event.target as HTMLInputElement).value })" /></label>
        <div v-if="!readonly" class="structured-row-actions">
          <button type="button" title="上移" aria-label="物流方式上移" :disabled="index === 0" @click="moveItem(index, -1)"><ArrowUp /></button>
          <button type="button" title="下移" aria-label="物流方式下移" :disabled="index === items.length - 1" @click="moveItem(index, 1)"><ArrowDown /></button>
          <button class="danger" type="button" title="删除" aria-label="删除物流方式" @click="removeItem(index)"><Trash2 /></button>
        </div>
      </div>
    </div>
    <p v-else class="structured-editor-empty">未单独配置时使用分类默认物流。</p>
  </section>
</template>
