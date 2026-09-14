<script setup lang="ts">
import { computed } from 'vue'
import type { Solution } from '../../types/catalog'
import RichContent from './RichContent.vue'

type DocumentSection = Solution['document_sections'][number]

const props = defineProps<{
  sections: DocumentSection[]
}>()

const visibleSections = computed(() => props.sections.filter(section => section.title !== '副标题'))

function paragraphs(content: string | undefined) {
  return (content ?? '').split('\n').map(item => item.trim()).filter(Boolean)
}

function tableHeader(rows: string[][] | undefined) {
  return rows?.[0] ?? []
}

function tableBody(rows: string[][] | undefined) {
  return rows?.slice(1) ?? []
}

function isRichHtml(value: string | undefined) {
  return /<\/?[a-z][\s\S]*>/i.test(value ?? '')
}
</script>

<template>
  <div class="solution-document-sections">
    <section v-for="section in visibleSections" :key="section.title" class="solution-document-section">
      <h2>{{ section.title }}</h2>

      <template v-if="section.type === 'table'">
        <div class="solution-document-table-wrap">
          <table class="solution-document-table">
            <thead>
              <tr>
                <th v-for="(cell, index) in tableHeader(section.rows)" :key="`${section.title}-head-${index}`">
                  {{ cell }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in tableBody(section.rows)" :key="`${section.title}-row-${rowIndex}`">
                <td v-for="(cell, cellIndex) in row" :key="`${section.title}-cell-${rowIndex}-${cellIndex}`">
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <template v-else-if="section.type === 'list'">
        <ul class="solution-document-list">
          <li v-for="item in section.items ?? []" :key="item">{{ item }}</li>
        </ul>
      </template>

      <template v-else>
        <RichContent v-if="isRichHtml(section.content)" :html="section.content" />
        <template v-else>
          <p v-for="paragraph in paragraphs(section.content)" :key="paragraph" class="solution-document-paragraph">
            {{ paragraph }}
          </p>
        </template>
      </template>
    </section>
  </div>
</template>
