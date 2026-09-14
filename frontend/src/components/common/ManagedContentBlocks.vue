<script setup lang="ts">
import { computed } from 'vue'
import { resolveResponsiveAsset } from '../../api/client'
import { useI18n } from '../../composables/useI18n'
import { useLocalizedContent } from '../../data/localizedContent'
import type { ContentBlockConfig } from '../../types/websiteConfig'

const props = defineProps<{
  blocks: ContentBlockConfig[]
  compact?: boolean
  inline?: boolean
}>()

const sectionClass = computed(() => ({
  compact: props.compact,
  inline: props.inline,
}))
const { locale, t } = useI18n()
const { text } = useLocalizedContent()

function blockTitle(block: ContentBlockConfig) {
  return block.titleTranslations?.[locale.value] ?? text(`blocks.${block.id}.title`, block.title)
}

function blockBody(block: ContentBlockConfig) {
  return block.bodyTranslations?.[locale.value] ?? text(`blocks.${block.id}.body`, block.body)
}

function blockTypeLabel(block: ContentBlockConfig) {
  return t(`managedBlock.type.${block.type}`, block.type)
}

function blockImage(block: ContentBlockConfig) {
  return resolveResponsiveAsset(block.body, { widths: [480, 800, 1200] })
}

function specRows(body: string) {
  return body
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [label, ...rest] = line.split(':')
      return { label: label.trim(), value: rest.join(':').trim() || line }
    })
}
</script>

<template>
  <section v-if="blocks.length" class="managed-content-section" :class="sectionClass">
    <article v-for="block in blocks" :key="block.id" class="managed-content-block" :class="`block-${block.type}`">
      <template v-if="block.type === 'image'">
        <img v-if="block.body" :src="blockImage(block).src" :srcset="blockImage(block).srcset || undefined" sizes="(max-width: 720px) 100vw, 800px" :alt="blockTitle(block)" width="1200" height="675" loading="lazy" decoding="async" />
        <h3>{{ blockTitle(block) }}</h3>
      </template>

      <template v-else-if="block.type === 'specs'">
        <span>{{ blockTypeLabel(block) }}</span>
        <h3>{{ blockTitle(block) }}</h3>
        <dl class="managed-spec-list">
          <div v-for="row in specRows(blockBody(block))" :key="`${row.label}-${row.value}`">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
      </template>

      <template v-else-if="block.type === 'cta'">
        <span>{{ blockTypeLabel(block) }}</span>
        <h3>{{ blockTitle(block) }}</h3>
        <p>{{ blockBody(block) }}</p>
        <LocalizedLink class="button primary" to="/contact">{{ t('common.contactSales') }}</LocalizedLink>
      </template>

      <template v-else>
        <span>{{ blockTypeLabel(block) }}</span>
        <h3>{{ blockTitle(block) }}</h3>
        <p>{{ blockBody(block) }}</p>
      </template>
    </article>
  </section>
</template>
