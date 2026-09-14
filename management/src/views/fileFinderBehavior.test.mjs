import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const view = readFileSync(new URL('./FileManageView.vue', import.meta.url), 'utf8')
const browser = readFileSync(new URL('../components/file/FileBrowserContent.vue', import.meta.url), 'utf8')
const sidebar = readFileSync(new URL('../components/file/FileFolderSidebar.vue', import.meta.url), 'utf8')
const api = readFileSync(new URL('../api/filesManagement.ts', import.meta.url), 'utf8')

test('material files use a Finder-style directory browser', () => {
  assert.match(view, /finder-window/)
  assert.doesNotMatch(view, /finder-dot|finder-dot\.close|finder-dot\.minimize|finder-dot\.maximize/)
  assert.match(view, /FileFolderSidebar/)
  assert.match(view, /FileBrowserContent/)
  assert.match(sidebar, /@drop\.prevent="dropFiles/)
})

test('files support immediate multi-upload, folder drop and authenticated download', () => {
  assert.match(browser, /type="file" multiple/)
  assert.match(browser, /@drop\.prevent="onDrop"/)
  assert.match(browser, /openFilePicker/)
  assert.match(api, /downloadManagementFile/)
  assert.match(view, /link\.download = file\.original_name/)
})
