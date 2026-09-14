<script setup lang="ts">
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from '@lucide/vue'
import { defaultAssuranceItems, moveAssuranceItem } from './catalogProductManagementData'
import type { AssuranceItem } from '../../types/catalog'

const props = defineProps<{
  readonly?: boolean
}>()

const items = defineModel<AssuranceItem[]>({ required: true })

function addItem() {
  if (items.value.length >= 4) return
  items.value = [...items.value, { duration: '', title: '', copy: '' }]
}

function updateItem(index: number, key: 'duration' | 'title' | 'copy', value: string) {
  items.value = items.value.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)
}

function moveItem(index: number, direction: -1 | 1) {
  items.value = moveAssuranceItem(items.value, index, direction)
}

function restoreDefaults() {
  items.value = defaultAssuranceItems()
}

function removeItem(index: number) {
  items.value = items.value.filter((_, itemIndex) => itemIndex !== index)
}
</script>

<template>
  <section class="assurance-items-editor">
    <div class="assurance-editor-heading">
      <div>
        <strong>订单保障</strong>
        <p>主标题和副标题都会显示在商品详情页，最多配置 4 条。</p>
      </div>
      <div v-if="!readonly" class="assurance-editor-heading-actions">
        <button class="secondary-button compact" type="button" @click="restoreDefaults">
          <RotateCcw />
          恢复默认配置
        </button>
        <button class="secondary-button compact" type="button" :disabled="items.length >= 4" @click="addItem">
          <Plus />
          添加保障
        </button>
      </div>
    </div>

    <div class="assurance-editor-list">
      <div v-for="(item, index) in items" :key="index" class="assurance-editor-row">
        <span class="assurance-row-index">{{ index + 1 }}</span>
        <label>时长<input :value="item.duration ?? ''" placeholder="例如：1年" :disabled="readonly" @input="updateItem(index, 'duration', ($event.target as HTMLInputElement).value)" /></label>
        <label>标题<input :value="item.title" placeholder="例如：质保" :disabled="readonly" @input="updateItem(index, 'title', ($event.target as HTMLInputElement).value)" /></label>
        <label>副标题<input :value="item.copy ?? ''" placeholder="例如：整机质量保障与问题响应" :disabled="readonly" @input="updateItem(index, 'copy', ($event.target as HTMLInputElement).value)" /></label>
        <div v-if="!readonly" class="assurance-row-actions">
          <button class="icon-button" type="button" title="上移" aria-label="保障上移" :disabled="index === 0" @click="moveItem(index, -1)"><ArrowUp /></button>
          <button class="icon-button" type="button" title="下移" aria-label="保障下移" :disabled="index === items.length - 1" @click="moveItem(index, 1)"><ArrowDown /></button>
          <button class="icon-button danger" type="button" title="删除保障" aria-label="删除保障" @click="removeItem(index)"><Trash2 /></button>
        </div>
      </div>
    </div>
  </section>
</template>
