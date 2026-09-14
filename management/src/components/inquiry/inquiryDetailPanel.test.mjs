import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('./InquiryDetailPanel.vue', import.meta.url), 'utf8')

test('inquiry original is a read-only section that preserves line breaks', () => {
  assert.match(source, /<section class="message-panel"[^>]*>/)
  assert.match(source, />询盘原文</)
  assert.match(source, /white-space:\s*pre-wrap/)
  assert.match(source, /\{\{ inquiry\.message \}\}/)
  assert.doesNotMatch(source, /RichTextEditor/)
  assert.doesNotMatch(source, /contenteditable/)
  assert.doesNotMatch(source, /@click[^>]*inquiry\.message/)
})

test('only the follow-up note remains editable and retains its save action', () => {
  assert.match(source, /<textarea v-model="noteDraft"/)
  assert.match(source, /@submit\.prevent="submitNote"/)
  assert.match(source, /emit\('addNote', props\.inquiry\.id, noteDraft\.value\.trim\(\)\)/)
})
