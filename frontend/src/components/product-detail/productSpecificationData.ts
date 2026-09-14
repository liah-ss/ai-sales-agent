export interface DisplaySpecification {
  label: string
  value: string
}

type PackagingRecord = Record<string, unknown>

export interface SpecificationFormatOptions {
  packagingParameterLabel?: string
  labelSeparator?: string
  itemSeparator?: string
}

function isPackagingLabel(label: string) {
  return /包装|packag|kemasan/i.test(label)
}

function formatPackagingRecord(record: PackagingRecord, options: SpecificationFormatOptions) {
  const labelSeparator = options.labelSeparator ?? '：'
  const itemSeparator = options.itemSeparator ?? '；'
  return Object.entries(record)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim())
    .map(([key, value]) => `${key}${labelSeparator}${String(value)}`)
    .join(itemSeparator)
}

function parsePackagingRows(value: string, options: SpecificationFormatOptions): DisplaySpecification[] | null {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    const records = Object.values(parsed).find(Array.isArray)
    if (!Array.isArray(records)) return null

    const rows = records
      .filter((record): record is PackagingRecord => Boolean(record) && typeof record === 'object' && !Array.isArray(record))
      .map((record, index) => ({
        label: `${options.packagingParameterLabel ?? '包装参数'} ${index + 1}`,
        value: formatPackagingRecord(record, options),
      }))
      .filter(row => row.value)

    return rows.length ? rows : null
  } catch {
    return null
  }
}

export function formatProductSpecifications(
  specifications: DisplaySpecification[],
  options: SpecificationFormatOptions = {},
) {
  return specifications.flatMap((row) => {
    if (!isPackagingLabel(row.label)) return [row]
    return parsePackagingRows(row.value, options) ?? [row]
  })
}
