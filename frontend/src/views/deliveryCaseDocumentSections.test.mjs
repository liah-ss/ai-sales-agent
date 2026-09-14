import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const detailSource = readFileSync(new URL('./DeliveryCaseDetailView.vue', import.meta.url), 'utf8')
const sectionsSource = readFileSync(
  new URL('../components/delivery-case/DeliveryCaseDocumentSections.vue', import.meta.url),
  'utf8',
)
const i18nSource = readFileSync(new URL('../composables/useI18n.ts', import.meta.url), 'utf8')

test('delivery case detail prefers Word-derived structured fields over legacy content', () => {
  assert.match(detailSource, /<DeliveryCaseDocumentSections v-if="hasStructuredContent"/)
  assert.match(detailSource, /<RichContent v-else class="delivery-case-structured-content"/)
})

test('delivery case sections preserve six headings, a specification table, and prose challenge-solution pairs', () => {
  for (const key of [
    'projectOverview',
    'indonesiaFit',
    'professionalConfiguration',
    'keyParameterTable',
    'deliveryChallenges',
    'projectResults',
  ]) {
    assert.match(sectionsSource, new RegExp(`deliveryCases\\.${key}`))
  }

  assert.match(sectionsSource, /<table class="delivery-case-table">/)
  assert.match(sectionsSource, /class="delivery-challenge-entry"/)
  assert.doesNotMatch(sectionsSource, /class="delivery-challenge-item"/)
  assert.match(sectionsSource, /class="delivery-challenge-sequence"/)
  assert.match(sectionsSource, /String\.fromCharCode\(97 \+ index\)/)
  assert.match(sectionsSource, /item\.challenge/)
  assert.match(sectionsSource, /item\.solution/)
  assert.match(i18nSource, /'deliveryCases\.keyParameterTable': '关键规格对比表'/)
})
