import assert from 'node:assert/strict'
import test from 'node:test'
import { formatProductSpecifications } from './productSpecificationData.ts'

test('splits packaging JSON into readable package rows', () => {
  const rows = formatProductSpecifications([
    {
      label: '包装信息',
      value: JSON.stringify({
        规格列表: [
          { 规格: 'GEN-4配电柜', '长(cm)': '80', '重量(g)': '50000' },
          { 规格: 'GEN-3配电柜', '长(cm)': '90', '重量(g)': '52000' },
        ],
      }),
    },
  ])

  assert.deepEqual(rows, [
    { label: '包装参数 1', value: '规格：GEN-4配电柜；长(cm)：80；重量(g)：50000' },
    { label: '包装参数 2', value: '规格：GEN-3配电柜；长(cm)：90；重量(g)：52000' },
  ])
})

test('keeps invalid packaging JSON visible', () => {
  const rows = formatProductSpecifications([{ label: '包装信息', value: '{invalid' }])

  assert.deepEqual(rows, [{ label: '包装信息', value: '{invalid' }])
})

test('keeps ordinary specifications unchanged', () => {
  const rows = formatProductSpecifications([{ label: '型号', value: 'GEN-4' }])

  assert.deepEqual(rows, [{ label: '型号', value: 'GEN-4' }])
})

test('uses locale-specific labels and punctuation for packaging rows', () => {
  const rows = formatProductSpecifications([
    {
      label: 'Packaging parameters',
      value: JSON.stringify({ records: [{ Model: 'GEN-4', Length: '80 cm' }] }),
    },
  ], {
    packagingParameterLabel: 'Packaging parameter',
    labelSeparator: ': ',
    itemSeparator: '; ',
  })

  assert.deepEqual(rows, [
    { label: 'Packaging parameter 1', value: 'Model: GEN-4; Length: 80 cm' },
  ])
})
