import assert from 'node:assert/strict'
import test from 'node:test'
import { getProductPriceBreaks, normalizeAssuranceItems, resolveProductFulfillmentItems, splitProductSummary } from './productDetailData.ts'

const priceLabels = {
  tier1: '第一档',
  tier2: '第二档',
  tier3: '第三档',
  tier1Range: '1 - 10 个',
  tier1Price: '¥ 6,743.10',
  tier2Range: '11 - 30 个',
  tier2Price: '¥ 6,412.69',
  surpriseInquiry: '询盘有惊喜',
}

test('inquiry-only mode ignores product and variant prices', () => {
  const product = {
    show_surprise_only: true,
    price_tiers: [{ range: '1台', price: '¥100' }],
    variants: [{ name: 'A', price_tiers: [{ range: '1台', price: '¥80' }] }],
  }

  assert.deepEqual(getProductPriceBreaks(product, priceLabels), [
    { quantity: '询盘有惊喜', price: '询盘有惊喜', surprise: true },
  ])
})

test('normal mode uses configured product tiers', () => {
  const product = {
    show_surprise_only: false,
    price_tiers: [{ label: '工程价', range: '1台起', price: '¥100' }],
  }

  assert.deepEqual(getProductPriceBreaks(product, priceLabels), [
    { label: '工程价', quantity: '1台起', price: '¥100', surprise: false },
  ])
})

test('normal mode returns only visible configured tiers in order', () => {
  const product = {
    show_surprise_only: false,
    price_tiers: [
      { label: 'A', range: '1-10', price: '100', visible: true },
      { label: 'B', range: '11-20', price: 'secret', visible: false },
      { label: 'C', range: '21+', price: '80', visible: true },
    ],
  }

  assert.deepEqual(getProductPriceBreaks(product, priceLabels).map(item => item.price), ['100', '80'])
})

test('all hidden tiers fall back to inquiry copy', () => {
  const product = {
    show_surprise_only: false,
    price_tiers: [{ range: '1+', price: 'secret', visible: false }],
  }

  assert.deepEqual(getProductPriceBreaks(product, priceLabels), [
    { quantity: '询盘有惊喜', price: '询盘有惊喜', surprise: true },
  ])
})

test('product fulfillment uses product-level configuration and legacy methods', () => {
  assert.deepEqual(resolveProductFulfillmentItems({
    fulfillment_items: [{ name: '空运', copy: '加急交付' }],
    fulfillment_methods: ['ignored'],
    category: { fulfillment_items: [{ name: '海运', copy: '' }], fulfillment_methods: [] },
  }), [{ name: '空运', copy: '加急交付' }])

  assert.deepEqual(resolveProductFulfillmentItems({
    fulfillment_items: [],
    fulfillment_methods: [],
    category: { fulfillment_items: [], fulfillment_methods: ['跨境陆运'] },
  }), [])
})

test('assurance durations preserve word spacing outside Chinese', () => {
  assert.deepEqual(normalizeAssuranceItems([
    { duration: '1 year', title: 'Warranty', copy: '' },
    { duration: '3 tahun', title: 'Pemeliharaan', copy: '' },
    { title: '1 年质保', copy: '' },
  ]).map(item => item.duration), ['1 year', '3 tahun', '1年'])
})

test('product summary separates the Chinese application scenario from functional use', () => {
  assert.deepEqual(splitProductSummary('应用场景：面向东南亚工厂配电室、商业楼宇等。\n功能用途：面向大电流工程配电系统。'), {
    applicationScenario: '应用场景：面向东南亚工厂配电室、商业楼宇等。',
    functionalSummary: '功能用途：面向大电流工程配电系统。',
  })
})

test('product summary supports localized and inline section separators', () => {
  assert.deepEqual(splitProductSummary('Application Scenarios: Data centers. Functional Use: Power distribution.'), {
    applicationScenario: 'Application Scenarios: Data centers.',
    functionalSummary: 'Functional Use: Power distribution.',
  })
  assert.deepEqual(splitProductSummary('Aplikasi: Pabrik.\nFungsi & Penggunaan: Distribusi daya.'), {
    applicationScenario: 'Aplikasi: Pabrik.',
    functionalSummary: 'Fungsi & Penggunaan: Distribusi daya.',
  })
})

test('product summary leaves unstructured legacy copy in the original module', () => {
  assert.deepEqual(splitProductSummary('适用于工程配电系统。'), {
    applicationScenario: '',
    functionalSummary: '适用于工程配电系统。',
  })
})
