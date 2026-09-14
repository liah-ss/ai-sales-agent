<script setup lang="ts">
import type { DeliveryCase } from '../../types/catalog'
import { useI18n } from '../../composables/useI18n'
import RichContent from '../common/RichContent.vue'

const props = defineProps<{
  deliveryCase: DeliveryCase
}>()

const { t } = useI18n()

function paragraphs(content: string) {
  return content.split('\n').map(item => item.trim()).filter(Boolean)
}

function isRichHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function tableHeader(rows: string[][]) {
  return rows[0] ?? []
}

function tableBody(rows: string[][]) {
  return rows.slice(1)
}

function challengeMarker(index: number) {
  return `${String.fromCharCode(97 + index)}.`
}
</script>

<template>
  <div class="delivery-case-structured-content">
    <section class="delivery-case-section">
      <h2>{{ t('deliveryCases.projectOverview') }}</h2>
      <RichContent v-if="isRichHtml(props.deliveryCase.project_overview)" :html="props.deliveryCase.project_overview" />
      <template v-else>
        <p v-for="paragraph in paragraphs(props.deliveryCase.project_overview)" :key="paragraph">{{ paragraph }}</p>
      </template>
    </section>

    <section class="delivery-case-section">
      <h2>{{ t('deliveryCases.indonesiaFit') }}</h2>
      <RichContent v-if="isRichHtml(props.deliveryCase.indonesia_fit)" :html="props.deliveryCase.indonesia_fit" />
      <template v-else>
        <p v-for="paragraph in paragraphs(props.deliveryCase.indonesia_fit)" :key="paragraph">{{ paragraph }}</p>
      </template>
    </section>

    <section class="delivery-case-section">
      <h2>{{ t('deliveryCases.professionalConfiguration') }}</h2>
      <RichContent
        v-if="isRichHtml(props.deliveryCase.professional_configuration)"
        :html="props.deliveryCase.professional_configuration"
      />
      <template v-else>
        <p v-for="paragraph in paragraphs(props.deliveryCase.professional_configuration)" :key="paragraph">
          {{ paragraph }}
        </p>
      </template>
    </section>

    <section class="delivery-case-section">
      <h2>{{ t('deliveryCases.keyParameterTable') }}</h2>
      <div class="delivery-case-table-wrap">
        <table class="delivery-case-table">
          <thead>
            <tr>
              <th v-for="(cell, index) in tableHeader(props.deliveryCase.key_parameter_table)" :key="`head-${index}`">
                {{ cell }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in tableBody(props.deliveryCase.key_parameter_table)" :key="`row-${rowIndex}`">
              <td v-for="(cell, cellIndex) in row" :key="`cell-${rowIndex}-${cellIndex}`">{{ cell }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="delivery-case-section">
      <h2>{{ t('deliveryCases.deliveryChallenges') }}</h2>
      <div class="delivery-challenge-list">
        <div
          v-for="(item, index) in props.deliveryCase.delivery_challenges"
          :key="`${item.challenge}-${index}`"
          class="delivery-challenge-entry"
        >
          <p>
            <span class="delivery-challenge-sequence">{{ challengeMarker(index) }}</span>
            <strong>{{ t('deliveryCases.challenge') }}</strong>{{ item.challenge }}
          </p>
          <p><strong>{{ t('deliveryCases.solution') }}</strong>{{ item.solution }}</p>
        </div>
      </div>
    </section>

    <section class="delivery-case-section">
      <h2>{{ t('deliveryCases.projectResults') }}</h2>
      <RichContent v-if="isRichHtml(props.deliveryCase.project_results)" :html="props.deliveryCase.project_results" />
      <template v-else>
        <p v-for="paragraph in paragraphs(props.deliveryCase.project_results)" :key="paragraph">{{ paragraph }}</p>
      </template>
    </section>
  </div>
</template>
