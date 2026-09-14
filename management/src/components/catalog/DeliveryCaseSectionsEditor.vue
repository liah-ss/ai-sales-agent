<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { DeliveryCaseStructuredContent } from '../../types/catalog'
import DeliveryChallengesEditor from './DeliveryChallengesEditor.vue'
import MatrixTableEditor from './MatrixTableEditor.vue'
import { deliveryCaseSectionLabels } from './structuredContentData'

const RichTextEditor = defineAsyncComponent(() => import('./RichTextEditor.vue'))

const props = defineProps<{
  token: string
  locale: 'zh-CN' | 'id' | 'en'
  readonly?: boolean
}>()

const content = defineModel<DeliveryCaseStructuredContent>({ required: true })
const labels = deliveryCaseSectionLabels[props.locale]

function updateField<Key extends keyof DeliveryCaseStructuredContent>(key: Key, value: DeliveryCaseStructuredContent[Key]) {
  content.value = { ...content.value, [key]: value }
}
</script>

<template>
  <section class="sectioned-body-editor">
    <div class="sectioned-body-header">
      <strong>案例正文</strong>
      <p>按前台固定标题分别维护正文、规格对比表以及难点与解决方案。</p>
    </div>
    <section v-for="key in (['project_overview', 'indonesia_fit', 'professional_configuration'] as const)" :key="key" class="body-section-field">
      <div class="body-section-heading"><strong>{{ labels[key] }}</strong></div>
      <RichTextEditor
        :model-value="content[key]"
        :token="token"
        :readonly="readonly"
        :placeholder="`请输入${labels[key]}`"
        @update:model-value="updateField(key, $event)"
      />
    </section>
    <MatrixTableEditor
      :model-value="content.key_parameter_table"
      :title="labels.key_parameter_table"
      :columns="3"
      :readonly="readonly"
      @update:model-value="updateField('key_parameter_table', $event)"
    />
    <DeliveryChallengesEditor
      :model-value="content.delivery_challenges"
      :title="labels.delivery_challenges"
      :readonly="readonly"
      @update:model-value="updateField('delivery_challenges', $event)"
    />
    <section class="body-section-field">
      <div class="body-section-heading"><strong>{{ labels.project_results }}</strong></div>
      <RichTextEditor
        :model-value="content.project_results"
        :token="token"
        :readonly="readonly"
        :placeholder="`请输入${labels.project_results}`"
        @update:model-value="updateField('project_results', $event)"
      />
    </section>
  </section>
</template>
