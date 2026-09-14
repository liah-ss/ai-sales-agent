import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyRichContent, isSimpleParagraphHtml } from './richContentBlocks.ts'

test('recognizes numbered technical section headings without changing their text', () => {
  assert.deepEqual(classifyRichContent('2、使用条件'), [
    { type: 'heading', content: '2、使用条件' },
  ])
})

test('recognizes labeled outcome paragraphs', () => {
  assert.deepEqual(classifyRichContent('项目成效: 在线率提升至 99.9%'), [
    { type: 'emphasis', label: '项目成效', content: '在线率提升至 99.9%' },
  ])
})

test('pairs adjacent challenge and solution paragraphs', () => {
  assert.deepEqual(classifyRichContent('难点: 偏远站点供电不稳\n解决方案: 配置储能和远程监控'), [
    {
      type: 'pair',
      challenge: '偏远站点供电不稳',
      solution: '配置储能和远程监控',
    },
  ])
})

test('groups consecutive numbered paragraphs as one list', () => {
  assert.deepEqual(classifyRichContent('1、确认额定参数\n2、核对安装环境\n3、确认交付周期'), [
    {
      type: 'list',
      ordered: true,
      items: ['1、确认额定参数', '2、核对安装环境', '3、确认交付周期'],
    },
  ])
})

test('groups repeated slash-delimited technical rows as parameters', () => {
  assert.deepEqual(classifyRichContent('供电架构 / 传统整柜供电 / 模块化冗余供电\n运维能力 / 人工巡检 / 远程告警和复位'), [
    {
      type: 'parameters',
      rows: [
        { label: '供电架构', value: '传统整柜供电 / 模块化冗余供电' },
        { label: '运维能力', value: '人工巡检 / 远程告警和复位' },
      ],
    },
  ])
})

test('keeps ambiguous prose as an unchanged paragraph', () => {
  assert.deepEqual(classifyRichContent('普通技术说明，不应被猜测成特殊结构。'), [
    { type: 'paragraph', content: '普通技术说明，不应被猜测成特殊结构。' },
  ])
})

test('classifies simple paragraph html but leaves authored structures untouched', () => {
  assert.equal(isSimpleParagraphHtml('<p>项目背景：园区扩容</p><p>项目成效：供电稳定性提升</p>'), true)
  assert.equal(isSimpleParagraphHtml('<h2>项目背景</h2><p>园区扩容</p>'), false)
  assert.equal(isSimpleParagraphHtml('<p>说明</p><img src="/image.png">'), false)

  assert.deepEqual(classifyRichContent('<p>项目背景：园区扩容</p><p>项目成效：供电稳定性提升</p>'), [
    { type: 'labeled', label: '项目背景', content: '园区扩容' },
    { type: 'emphasis', label: '项目成效', content: '供电稳定性提升' },
  ])
})

test('splits known inline product chapters into heading and prose blocks', () => {
  assert.deepEqual(classifyRichContent('1、用途 用于低压配电系统。 2、使用条件 环境温度不高于40°C。'), [
    { type: 'heading', content: '1、用途' },
    { type: 'paragraph', content: '用于低压配电系统。' },
    { type: 'heading', content: '2、使用条件' },
    { type: 'paragraph', content: '环境温度不高于40°C。' },
  ])
})
