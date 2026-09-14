<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { SolutionDocumentSection } from '../../types/catalog'
import MatrixTableEditor from './MatrixTableEditor.vue'
import StringListEditor from './StringListEditor.vue'

const RichTextEditor = defineAsyncComponent(() => import('./RichTextEditor.vue'))

defineProps<{
  token: string
  readonly?: boolean
}>()

const sections = defineModel<SolutionDocumentSection[]>({ required: true })

function updateParagraph(index: number, content: string) {
  sections.value = sections.value.map((section, sectionIndex) => sectionIndex === index
    ? { type: 'paragraph', title: section.title, content }
    : section)
}

function updateItems(index: number, items: string[]) {
  sections.value = sections.value.map((section, sectionIndex) => sectionIndex === index
    ? { type: 'list', title: section.title, items }
    : section)
}

function updateRows(index: number, rows: string[][]) {
  sections.value = sections.value.map((section, sectionIndex) => sectionIndex === index
    ? { type: 'table', title: section.title, rows }
    : section)
}
</script>

<template>
  <section class="sectioned-body-editor">
    <div class="sectioned-body-header">
      <strong>方案正文</strong>
      <p>按前台固定标题分别维护正文、列表和规格对比表。</p>
    </div>
    <template v-for="(section, index) in sections" :key="`${section.title}-${index}`">
      <MatrixTableEditor
        v-if="section.type === 'table'"
        :model-value="section.rows ?? []"
        :title="section.title"
        :columns="4"
        :readonly="readonly"
        @update:model-value="updateRows(index, $event)"
      />
      <StringListEditor
        v-else-if="section.type === 'list'"
        :model-value="section.items ?? []"
        :title="section.title"
        :readonly="readonly"
        @update:model-value="updateItems(index, $event)"
      />
      <section v-else class="body-section-field">
        <div class="body-section-heading"><strong>{{ section.title }}</strong></div>
        <RichTextEditor
          :model-value="section.content ?? ''"
          :token="token"
          :readonly="readonly"
          :placeholder="`请输入${section.title}`"
          @update:model-value="updateParagraph(index, $event)"
        />
      </section>
    </template>
  </section>
</template>
