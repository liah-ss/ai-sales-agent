<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue'

const props = defineProps<{
  title: string
  columns: number
  readonly?: boolean
}>()

const rows = defineModel<string[][]>({ required: true })

function normalizedRow(row: string[]) {
  return Array.from({ length: props.columns }, (_, index) => row[index] ?? '')
}

function updateCell(rowIndex: number, cellIndex: number, value: string) {
  rows.value = rows.value.map((row, index) => index === rowIndex
    ? normalizedRow(row).map((cell, column) => column === cellIndex ? value : cell)
    : normalizedRow(row))
}

function addRow() {
  rows.value = [...rows.value, Array.from({ length: props.columns }, () => '')]
}

function removeRow(index: number) {
  rows.value = rows.value.filter((_, rowIndex) => rowIndex !== index)
}
</script>

<template>
  <section class="body-section-field matrix-table-editor">
    <div class="body-section-heading">
      <strong>{{ title }}</strong>
      <button v-if="!readonly" class="secondary-button compact" type="button" @click="addRow"><Plus />添加一行</button>
    </div>
    <div class="matrix-table-scroll">
      <div
        v-for="(row, rowIndex) in rows"
        :key="rowIndex"
        class="matrix-table-row"
        :class="{ header: rowIndex === 0 }"
        :style="{ gridTemplateColumns: `repeat(${columns}, minmax(180px, 1fr)) 40px` }"
      >
        <label v-for="(cell, cellIndex) in normalizedRow(row)" :key="cellIndex">
          <span class="sr-only">第 {{ rowIndex + 1 }} 行第 {{ cellIndex + 1 }} 列</span>
          <textarea
            :value="cell"
            rows="2"
            :placeholder="rowIndex === 0 ? `表头 ${cellIndex + 1}` : `内容 ${cellIndex + 1}`"
            :disabled="readonly"
            @input="updateCell(rowIndex, cellIndex, ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
        </label>
        <button
          v-if="!readonly && rowIndex > 0"
          class="matrix-row-delete"
          type="button"
          title="删除此行"
          aria-label="删除此行"
          @click="removeRow(rowIndex)"
        ><Trash2 /></button>
        <span v-else></span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.matrix-table-editor { overflow: hidden; }
.matrix-table-scroll { overflow-x: auto; }
.matrix-table-row { min-width: 760px; padding: 10px 12px; display: grid; align-items: center; gap: 8px; border-top: 1px solid #e5ebf0; }
.matrix-table-row.header { background: #f3f7fa; }
.matrix-table-row label { margin: 0; }
.matrix-table-row textarea { min-height: 62px; resize: vertical; }
.matrix-table-row.header textarea { font-weight: 900; }
.matrix-row-delete { width: 34px; height: 34px; padding: 0; display: grid; place-items: center; border: 1px solid #e0caca; border-radius: 5px; background: #fff; color: #b33d3d; }
.matrix-row-delete svg { width: 15px; height: 15px; }
</style>
