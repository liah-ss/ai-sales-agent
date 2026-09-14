import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const editorSource = await readFile(new URL('./CatalogEditor.vue', import.meta.url), 'utf8')
const detailSource = await readFile(new URL('../../../../frontend/src/views/SolutionDetailView.vue', import.meta.url), 'utf8')
const richTextEditorSource = await readFile(new URL('./RichTextEditor.vue', import.meta.url), 'utf8')

test('solution editor saves the nine structured document sections', () => {
  assert.match(editorSource, /<SolutionSectionsEditor v-model="form\.documentSections"/)
  assert.match(editorSource, /document_sections: sections/)
  assert.match(editorSource, /solutionSectionsToHtml\(sections\)/)
  assert.doesNotMatch(editorSource, /placeholder="请输入完整方案正文"/)
})

test('public solution detail renders structured sections before compatibility HTML', () => {
  assert.match(detailSource, /v-if="localizedSolution\.document_sections\.length"/)
  assert.match(detailSource, /<RichContent v-else-if="localizedSolution\.content"/)
})

test('rich text toolbar explicitly keeps image upload available', () => {
  assert.match(richTextEditorSource, /toolbarKeys:\s*\[[\s\S]*?'uploadImage'/)
  assert.match(richTextEditorSource, /customUpload:\s*async/)
})
