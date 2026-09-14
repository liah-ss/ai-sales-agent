<script setup lang="ts">
import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/vue'
import { moveListItem } from './catalogProductManagementData'
import type { PriceTier } from '../../types/catalog'

defineProps<{ readonly?: boolean }>()

const items = defineModel<PriceTier[]>({ required: true })
const showPrices = defineModel<boolean>('showPrices', { required: true })

function addItem() {
  if (items.value.length >= 3) return
  items.value = [...items.value, { label: `第${items.value.length + 1}档`, range: '', price: '', visible: true }]
}

function updateItem(index: number, patch: Partial<PriceTier>) {
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
  <section class="structured-editor price-tier-editor">
    <div class="structured-editor-header">
      <div>
        <strong>价格档位</strong>
        <span>{{ items.length }} / 3</span>
      </div>
      <div class="structured-editor-commands">
        <label class="switch-field">
          <input v-model="showPrices" type="checkbox" :disabled="readonly" />
          <span>展示价格</span>
        </label>
        <button v-if="!readonly" class="secondary-button compact" type="button" :disabled="items.length >= 3" @click="addItem">
          <Plus />添加价格档位
        </button>
      </div>
    </div>

    <div v-if="items.length" class="structured-editor-list">
      <div v-for="(item, index) in items" :key="index" class="structured-editor-row price-tier-row">
        <span class="structured-row-index">{{ index + 1 }}</span>
        <label>档位名称<input :value="item.label ?? ''" :disabled="readonly" @input="updateItem(index, { label: ($event.target as HTMLInputElement).value })" /></label>
        <label>数量范围<input :value="item.range" placeholder="例如：1 - 10 个" :disabled="readonly" @input="updateItem(index, { range: ($event.target as HTMLInputElement).value })" /></label>
        <label>价格<input :value="item.price" placeholder="例如：¥ 6,743.10" :disabled="readonly" @input="updateItem(index, { price: ($event.target as HTMLInputElement).value })" /></label>
        <label class="switch-field row-switch"><input :checked="item.visible" type="checkbox" :disabled="readonly" @change="updateItem(index, { visible: ($event.target as HTMLInputElement).checked })" /><span>显示此档</span></label>
        <div v-if="!readonly" class="structured-row-actions">
          <button type="button" title="上移" aria-label="价格档位上移" :disabled="index === 0" @click="moveItem(index, -1)"><ArrowUp /></button>
          <button type="button" title="下移" aria-label="价格档位下移" :disabled="index === items.length - 1" @click="moveItem(index, 1)"><ArrowDown /></button>
          <button class="danger" type="button" title="删除" aria-label="删除价格档位" @click="removeItem(index)"><Trash2 /></button>
        </div>
      </div>
    </div>
    <p v-else class="structured-editor-empty">尚未设置价格档位。</p>
  </section>
</template>
