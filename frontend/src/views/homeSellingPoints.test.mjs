import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('./HomeView.vue', import.meta.url), 'utf8')

test('homepage fallback renders the three requested platform selling points in order', () => {
  const epc = source.indexOf("title: '一站式EPC解决'")
  const localService = source.indexOf("title: '东南亚本地化服务'")
  const standards = source.indexOf("title: 'SNI&IEC标准'")

  assert.ok(epc >= 0)
  assert.ok(epc < localService)
  assert.ok(localService < standards)
  assert.match(source, /统一负责，直连5000\+知名工业设备厂家/)
  assert.match(source, /总部\/分部备件仓/)
  assert.match(source, /国际质量体系认证，出口产品资料与合规文件齐全。/)
})
