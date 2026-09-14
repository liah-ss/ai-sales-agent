<script setup lang="ts">
import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/vue'
import type { DeliveryChallenge } from '../../types/catalog'
import { moveListItem } from './catalogProductManagementData'

defineProps<{
  title: string
  readonly?: boolean
}>()

const items = defineModel<DeliveryChallenge[]>({ required: true })

function marker(index: number) {
  return `${String.fromCharCode(97 + index)}.`
}

function addItem() {
  items.value = [...items.value, { challenge: '', solution: '' }]
}

function updateItem(index: number, patch: Partial<DeliveryChallenge>) {
  items.value = items.value.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
}

function removeItem(index: number) {
  items.value = items.value.filter((_, itemIndex) => itemIndex !== index)
}

function moveItem(index: number, direction: -1 | 1) {
  items.value = moveListItem(items.value, index, direction).map(item => ({ ...item }))
}
</script>

<template>
  <section class="body-section-field delivery-challenges-editor">
    <div class="body-section-heading">
      <div>
        <strong>{{ title }}</strong>
        <span>按前台顺序维护 a、b、c 等难点与对应解决方案。</span>
      </div>
      <button v-if="!readonly" class="secondary-button compact" type="button" @click="addItem"><Plus />添加一组</button>
    </div>
    <div v-if="items.length" class="delivery-challenge-rows">
      <div v-for="(item, index) in items" :key="index" class="delivery-challenge-row">
        <span class="delivery-challenge-index">{{ marker(index) }}</span>
        <div class="delivery-challenge-fields">
          <label>难点<textarea :value="item.challenge" rows="3" :disabled="readonly" @input="updateItem(index, { challenge: ($event.target as HTMLTextAreaElement).value })"></textarea></label>
          <label>解决方案<textarea :value="item.solution" rows="3" :disabled="readonly" @input="updateItem(index, { solution: ($event.target as HTMLTextAreaElement).value })"></textarea></label>
        </div>
        <div v-if="!readonly" class="structured-row-actions">
          <button type="button" title="上移" :disabled="index === 0" @click="moveItem(index, -1)"><ArrowUp /></button>
          <button type="button" title="下移" :disabled="index === items.length - 1" @click="moveItem(index, 1)"><ArrowDown /></button>
          <button class="danger" type="button" title="删除" @click="removeItem(index)"><Trash2 /></button>
        </div>
      </div>
    </div>
    <p v-else class="structured-editor-empty">尚未添加交付难点。</p>
  </section>
</template>

<style scoped>
.delivery-challenge-rows { display: grid; }
.delivery-challenge-row { padding: 14px; display: grid; grid-template-columns: 34px minmax(0, 1fr) 112px; align-items: start; gap: 10px; border-top: 1px solid #e5ebf0; }
.delivery-challenge-index { color: #245f8b; font-weight: 950; line-height: 38px; }
.delivery-challenge-fields { display: grid; gap: 10px; }
.delivery-challenge-fields label { margin: 0; }
.delivery-challenge-fields textarea { min-height: 76px; resize: vertical; }
@media (max-width: 760px) {
  .delivery-challenge-row { grid-template-columns: 30px minmax(0, 1fr); }
  .structured-row-actions { grid-column: 2; }
}
</style>
