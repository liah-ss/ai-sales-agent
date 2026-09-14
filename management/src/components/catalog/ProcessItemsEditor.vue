<script setup lang="ts">
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from '@lucide/vue'
import { defaultProcessItems, moveListItem } from './catalogProductManagementData'
import type { ProcessItem } from '../../types/catalog'

defineProps<{ readonly?: boolean }>()

const items = defineModel<ProcessItem[]>({ required: true })

function addItem() {
  if (items.value.length >= 4) return
  items.value = [...items.value, { title: '', copy: '' }]
}

function updateItem(index: number, patch: Partial<ProcessItem>) {
  items.value = items.value.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
}

function moveItem(index: number, direction: -1 | 1) {
  items.value = moveListItem(items.value, index, direction).map(item => ({ ...item }))
}

function removeItem(index: number) {
  items.value = items.value.filter((_, itemIndex) => itemIndex !== index)
}

function restoreDefaults() {
  items.value = defaultProcessItems()
}
</script>

<template>
  <section class="structured-editor process-items-editor">
    <div class="structured-editor-header">
      <div>
        <strong>采购流程</strong>
        <span>{{ items.length }} / 4</span>
      </div>
      <div v-if="!readonly" class="structured-editor-commands">
        <button class="secondary-button compact" type="button" @click="restoreDefaults"><RotateCcw />恢复默认</button>
        <button class="secondary-button compact" type="button" :disabled="items.length >= 4" @click="addItem"><Plus />添加流程</button>
      </div>
    </div>
    <div v-if="items.length" class="structured-editor-list">
      <div v-for="(item, index) in items" :key="index" class="structured-editor-row process-item-row">
        <span class="structured-row-index">{{ index + 1 }}</span>
        <label>流程名称<input :value="item.title" placeholder="例如：需求确认" :disabled="readonly" @input="updateItem(index, { title: ($event.target as HTMLInputElement).value })" /></label>
        <label>流程说明<input :value="item.copy" placeholder="请输入该流程的说明" :disabled="readonly" @input="updateItem(index, { copy: ($event.target as HTMLInputElement).value })" /></label>
        <div v-if="!readonly" class="structured-row-actions">
          <button type="button" title="上移" aria-label="流程上移" :disabled="index === 0" @click="moveItem(index, -1)"><ArrowUp /></button>
          <button type="button" title="下移" aria-label="流程下移" :disabled="index === items.length - 1" @click="moveItem(index, 1)"><ArrowDown /></button>
          <button class="danger" type="button" title="删除" aria-label="删除流程" @click="removeItem(index)"><Trash2 /></button>
        </div>
      </div>
    </div>
    <p v-else class="structured-editor-empty">尚未配置采购流程。</p>
  </section>
</template>
