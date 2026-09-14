import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const detailViewSource = readFileSync(new URL('./SolutionDetailView.vue', import.meta.url), 'utf8')
const sectionsSource = readFileSync(
  new URL('../components/common/SolutionDocumentSections.vue', import.meta.url),
  'utf8',
)

test('solution detail prefers Word-derived document sections over legacy content', () => {
  const sectionsPosition = detailViewSource.indexOf(
    'v-if="localizedSolution.document_sections.length"',
  )
  const fallbackPosition = detailViewSource.indexOf(
    'v-else-if="localizedSolution.content"',
  )

  assert.notEqual(sectionsPosition, -1)
  assert.notEqual(fallbackPosition, -1)
  assert.ok(sectionsPosition < fallbackPosition)
})

test('solution document sections preserve headings, semantic lists, and tables', () => {
  assert.match(sectionsSource, /<h2>\{\{ section\.title \}\}<\/h2>/)
  assert.match(sectionsSource, /<ul class="solution-document-list">/)
  assert.match(sectionsSource, /<li v-for="item in section\.items/)
  assert.match(sectionsSource, /<table class="solution-document-table">/)
})
