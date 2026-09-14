import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  cleanSolutionSections,
  deliveryCaseContentToHtml,
  normalizeDeliveryCaseContent,
  normalizeSolutionSections,
  solutionSectionsToHtml,
} from './structuredContentData.ts'

const source = name => readFile(new URL(name, import.meta.url), 'utf8')

test('solution body editor exposes all nine fixed document titles and structured controls', async () => {
  const data = await source('./structuredContentData.ts')
  const editor = await source('./SolutionSectionsEditor.vue')
  for (const title of [
    '详细方案描述', '与印尼适配', '专业规格与标准依据', '产品规格对比表',
    '原创经验与测试数据', '曾经踩过的坑与痛点', '核心参数', '我方特殊贡献', '项目收益',
  ]) assert.match(data, new RegExp(title))
  assert.match(editor, /<MatrixTableEditor/)
  assert.match(editor, /<StringListEditor/)
  assert.match(editor, /<RichTextEditor/)
})

test('delivery case body editor separates six sections and preserves challenge markers', async () => {
  const data = await source('./structuredContentData.ts')
  const editor = await source('./DeliveryCaseSectionsEditor.vue')
  const challenges = await source('./DeliveryChallengesEditor.vue')
  for (const title of ['项目概述', '与印尼适配', '专业配置与标准', '关键规格对比表', '交付难点与解决方案', '项目成效']) {
    assert.match(data, new RegExp(title))
  }
  assert.match(editor, /<MatrixTableEditor/)
  assert.match(editor, /<DeliveryChallengesEditor/)
  assert.match(challenges, /String\.fromCharCode\(97 \+ index\)/)
})

test('Chinese, Indonesian, and English forms use the same structured body editors', async () => {
  const catalog = await source('./CatalogEditor.vue')
  const localized = await source('./LocalizedCatalogFields.vue')
  const english = await source('./EnglishTranslationPanel.vue')
  for (const editor of ['SolutionSectionsEditor', 'DeliveryCaseSectionsEditor']) {
    assert.match(catalog, new RegExp(`<${editor}`))
    assert.match(localized, new RegExp(`<${editor}`))
    assert.match(english, new RegExp(`<${editor}`))
  }
  assert.match(catalog, /key_parameter_table/)
  assert.match(catalog, /delivery_challenges/)
  assert.match(catalog, /project_results/)
})

test('English structured sections use localized headings and tables', () => {
  const solution = normalizeSolutionSections([], 'en')
  const delivery = normalizeDeliveryCaseContent({}, 'en')
  assert.equal(solution.length, 9)
  assert.equal(solution[0].title, 'Detailed Solution Description')
  assert.deepEqual(delivery.key_parameter_table[0], [
    'Configuration Item', 'Standard Approach', 'Optimized Delivery Specification and Value',
  ])
})

test('solution normalization and compatibility HTML preserve all nine sections', () => {
  const sections = normalizeSolutionSections([], 'zh-CN')
  assert.equal(sections.length, 9)
  assert.deepEqual(sections.map(section => section.type), [
    'paragraph', 'paragraph', 'paragraph', 'table', 'paragraph', 'list', 'paragraph', 'list', 'list',
  ])
  const html = solutionSectionsToHtml(cleanSolutionSections(sections))
  assert.equal((html.match(/<h2>/g) ?? []).length, 9)
  assert.match(html, /<table>/)
})

test('delivery case compatibility HTML preserves six headings, table rows, and lettered challenges', () => {
  const content = normalizeDeliveryCaseContent({
    key_parameter_table: [['配置项', '常规做法', '优化后交付规格与价值'], ['容量', '固定', '弹性']],
    delivery_challenges: [
      { challenge: '难点一', solution: '方案一' },
      { challenge: '难点二', solution: '方案二' },
      { challenge: '难点三', solution: '方案三' },
    ],
  }, 'zh-CN')
  const html = deliveryCaseContentToHtml(content, 'zh-CN')
  assert.equal((html.match(/<h2>/g) ?? []).length, 6)
  assert.match(html, /<table>/)
  assert.match(html, /a\. <strong>难点：<\/strong>难点一/)
  assert.match(html, /b\. <strong>难点：<\/strong>难点二/)
  assert.match(html, /c\. <strong>难点：<\/strong>难点三/)
})
