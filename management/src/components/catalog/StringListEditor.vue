<script setup lang="ts">
import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/vue'
import { moveListItem } from './catalogProductManagementData'

defineProps<{
  title: string
  readonly?: boolean
}>()

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
  <section class="body-section-field string-list-editor">
    <div class="body-section-heading">
      <strong>{{ title }}</strong>
      <button v-if="!readonly" class="secondary-button compact" type="button" @click="addItem"><Plus />添加条目</button>
    </div>
    <div v-if="items.length" class="string-list-rows">
      <div v-for="(item, index) in items" :key="index" class="string-list-row">
        <span class="structured-row-index">{{ index + 1 }}</span>
        <textarea :value="item" rows="3" :disabled="readonly" @input="updateItem(index, ($event.target as HTMLTextAreaElement).value)"></textarea>
        <div v-if="!readonly" class="structured-row-actions">
          <button type="button" title="上移" :disabled="index === 0" @click="moveItem(index, -1)"><ArrowUp /></button>
          <button type="button" title="下移" :disabled="index === items.length - 1" @click="moveItem(index, 1)"><ArrowDown /></button>
          <button class="danger" type="button" title="删除" @click="removeItem(index)"><Trash2 /></button>
        </div>
      </div>
    </div>
    <p v-else class="structured-editor-empty">尚未添加内容。</p>
  </section>
</template>

<style scoped>
.string-list-rows { display: grid; }
.string-list-row { padding: 12px; display: grid; grid-template-columns: 30px minmax(0, 1fr) 112px; align-items: center; gap: 10px; border-top: 1px solid #e5ebf0; }
.string-list-row textarea { min-height: 78px; resize: vertical; }
@media (max-width: 760px) {
  .string-list-row { grid-template-columns: 30px minmax(0, 1fr); }
  .structured-row-actions { grid-column: 2; }
}
</style>
