import assert from 'node:assert/strict'
import test from 'node:test'
import {
  defaultAssuranceItems,
  defaultProcessItems,
  cleanProcessItems,
  filterManagementProducts,
  getProductCategoryOptions,
  moveProductImage,
  moveAssuranceItem,
  moveListItem,
  normalizeFulfillmentItems,
  normalizeProcessItems,
  normalizePriceTiers,
  normalizeAssuranceItems,
  productCategoryOptionLabel,
  serializeProductPriceTiers,
  setMainProductImage,
} from './catalogProductManagementData.ts'

const categories = [
  { id: 1, name: '变压器', parent_id: null },
  { id: 2, name: '干式变压器', parent_id: 1 },
  { id: 3, name: '低压开关柜', parent_id: 1 },
]

const products = [
  { id: 1, product_code: 'P-001', name: '低压配电柜', model: 'GEN-4', slug: 'low-voltage-mns', summary: '抽出式开关柜', translations: {}, category: categories[2] },
  { id: 2, product_code: 'P-002', name: '环氧浇注干式设备', model: 'SCB14', slug: 'dry-transformer-scb14', summary: '室内变压器', translations: { id: { name: 'Transformator tipe kering' } }, category: categories[1] },
  { id: 3, product_code: 'P-208', name: '零序电流互感器', model: 'LXK-φ80，10P10，2.5VA', slug: 'current-transformer', summary: '高压互感器', translations: {}, category: categories[2] },
  { id: 4, product_code: 'P-102', name: '工商业光伏逆变器', model: 'TS25KTL-A2', slug: 'solar-inverter', summary: '并网逆变器', translations: {}, category: categories[2] },
]

test('filters products by submitted code, model, name, or second-level category', () => {
  assert.deepEqual(filterManagementProducts(products, 'p-002').map(item => item.id), [2])
  assert.deepEqual(filterManagementProducts(products, 'scb14').map(item => item.id), [2])
  assert.deepEqual(filterManagementProducts(products, '环氧浇注').map(item => item.id), [2])
  assert.deepEqual(filterManagementProducts(products, '干式变压器').map(item => item.id), [2])
  assert.deepEqual(filterManagementProducts(products, '').map(item => item.id), [1, 2, 3, 4])
})

test('fuzzy-searches products across fields and normalizes separators and full-width text', () => {
  assert.deepEqual(filterManagementProducts(products, '低压 GEN-4').map(item => item.id), [1])
  assert.deepEqual(filterManagementProducts(products, 'p001').map(item => item.id), [1])
  assert.deepEqual(filterManagementProducts(products, '抽出 开关').map(item => item.id), [1])
  assert.deepEqual(filterManagementProducts(products, 'ＳＣＢ１４').map(item => item.id), [2])
  assert.deepEqual(filterManagementProducts(products, 'transformator kering').map(item => item.id), [2])
})

test('product-code queries match only the normalized product code', () => {
  assert.deepEqual(filterManagementProducts(products, 'P002').map(item => item.id), [2])
  assert.deepEqual(filterManagementProducts(products, 'p-002').map(item => item.id), [2])
  assert.deepEqual(filterManagementProducts(products, 'p 002').map(item => item.id), [2])
  assert.deepEqual(filterManagementProducts(products, 'P102').map(item => item.id), [4])
})

test('returns only second-level category options with parent path labels', () => {
  assert.deepEqual(getProductCategoryOptions(categories).map(item => item.id), [2, 3])
  assert.equal(productCategoryOptionLabel(categories[1], categories), '变压器 / 干式变压器')
})

test('moves images without crossing list boundaries', () => {
  assert.deepEqual(moveProductImage(['a', 'b', 'c'], 2, -1), ['a', 'c', 'b'])
  assert.deepEqual(moveProductImage(['a', 'b'], 0, -1), ['a', 'b'])
  assert.deepEqual(moveProductImage(['a', 'b'], 1, 1), ['a', 'b'])
})

test('moves the selected main image to index zero', () => {
  assert.deepEqual(setMainProductImage(['a', 'b', 'c'], 2), ['c', 'a', 'b'])
  assert.deepEqual(setMainProductImage(['a', 'b'], 0), ['a', 'b'])
})

test('normalizes price visibility, caps tiers, and preserves hidden tiers', () => {
  const tiers = normalizePriceTiers([
    { label: 'A', range: '1-10', price: '100' },
    { label: 'B', range: '11-20', price: '90', visible: false },
    { label: 'C', range: '21+', price: '80' },
    { label: 'D', range: '31+', price: '70' },
  ])

  assert.equal(tiers.length, 3)
  assert.deepEqual(tiers.map(item => item.visible), [true, false, true])
  assert.deepEqual(serializeProductPriceTiers(true, tiers), tiers)
  assert.deepEqual(serializeProductPriceTiers(false, tiers), tiers)
})

test('normalizes legacy fulfillment methods and reorders generic rows', () => {
  assert.deepEqual(normalizeFulfillmentItems([], ['全球海运']), [{ name: '全球海运', copy: '' }])
  assert.deepEqual(normalizeFulfillmentItems([{ name: '跨境陆运', copy: '门到门' }], ['ignored']), [{ name: '跨境陆运', copy: '门到门' }])
  assert.deepEqual(moveListItem(['A', 'B'], 1, -1), ['B', 'A'])
  assert.deepEqual(moveListItem(['A', 'B'], 0, -1), ['A', 'B'])
})

test('normalizes legacy assurance titles into three fields', () => {
  assert.deepEqual(normalizeAssuranceItems([
    { title: '1年质保', copy: '响应' },
    { title: '运维3年', copy: '技术协助' },
  ]), [
    { duration: '1年', title: '质保', copy: '响应' },
    { duration: '3年', title: '运维', copy: '技术协助' },
  ])
})

test('reorders assurance entries and restores defaults', () => {
  const items = [
    { duration: '1年', title: '质保', copy: '响应' },
    { duration: '3年', title: '运维', copy: '协助' },
  ]
  assert.deepEqual(moveAssuranceItem(items, 1, -1), [items[1], items[0]])
  assert.deepEqual(defaultAssuranceItems()[0], {
    duration: '1年',
    title: '质保',
    copy: '整机质量保障与问题响应',
  })
})

test('defaults and cleans the four configurable procurement process items', () => {
  const defaults = defaultProcessItems()
  assert.deepEqual(defaults.map(item => item.title), ['需求确认', '工厂匹配', '订单交易', '发货管控'])
  assert.equal(defaults[2].copy, '商务条款约定、商业合同签订、相关文件资料清单确认。')
  assert.deepEqual(cleanProcessItems([
    { title: ' 需求确认 ', copy: ' 参数确认 ' },
    { title: '', copy: '忽略' },
  ]), [{ title: '需求确认', copy: '参数确认' }])
  assert.deepEqual(normalizeProcessItems([], false), [])
})
