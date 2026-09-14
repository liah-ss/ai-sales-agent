import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const view = readFileSync(new URL('./OperationLogView.vue', import.meta.url), 'utf8')
const table = readFileSync(new URL('../components/operation-log/OperationLogTable.vue', import.meta.url), 'utf8')
const detail = readFileSync(new URL('../components/operation-log/OperationLogDetailModal.vue', import.meta.url), 'utf8')
const api = readFileSync(new URL('../api/operationLogs.ts', import.meta.url), 'utf8')

test('operation logs expose single and batch delete actions', () => {
  assert.match(view, /批量删除/)
  assert.match(view, /removeSelectedLogs/)
  assert.match(table, /全选当前日志/)
  assert.match(table, /aria-label="删除日志"/)
  assert.doesNotMatch(table, /<th>变更内容<\/th>/)
  assert.match(table, /aria-label="查看日志"/)
  assert.match(detail, /<h3>变更内容<\/h3>/)
  assert.match(api, /batch-delete/)
  assert.match(api, /deleteOperationLog/)
})
