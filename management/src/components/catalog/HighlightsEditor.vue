<script setup lang="ts">
import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/vue'
import { moveListItem } from './catalogProductManagementData'

defineProps<{ readonly?: boolean }>()

const items = defineModel<string[]>({ required: true })

function addItem() {
  items.value = [...items.value, '']
}

function updateItem(index: number, value: string) {
  items.value = items.value.map((item, itemIndex) => itemIndex === index ? value : item)
}

function removeItem(index: number) {
  items.value = items.value.filter((_, itemIndex) => itemIndex !== index)
}

function moveItem(index: number, direction: -1 | 1) {
  items.value = moveListItem(items.value, index, direction)
}
</script>

<template>
  <section class="structured-editor highlights-editor">
    <div class="structured-editor-header">
      <strong>产品亮点</strong>
      <button v-if="!readonly" class="secondary-button compact" type="button" @click="addItem"><Plus />添加亮点</button>
    </div>
    <div v-if="items.length" class="structured-editor-list">
      <div v-for="(item, index) in items" :key="index" class="structured-editor-row highlight-item-row">
        <span class="structured-row-index">{{ index + 1 }}</span>
        <label>亮点内容<input :value="item" :disabled="readonly" @input="updateItem(index, ($event.target as HTMLInputElement).value)" /></label>
        <div v-if="!readonly" class="structured-row-actions">
          <button type="button" title="上移" aria-label="亮点上移" :disabled="index === 0" @click="moveItem(index, -1)"><ArrowUp /></button>
          <button type="button" title="下移" aria-label="亮点下移" :disabled="index === items.length - 1" @click="moveItem(index, 1)"><ArrowDown /></button>
          <button class="danger" type="button" title="删除" aria-label="删除亮点" @click="removeItem(index)"><Trash2 /></button>
        </div>
      </div>
    </div>
    <p v-else class="structured-editor-empty">尚未添加产品亮点。</p>
  </section>
</template>
