import type { Locale } from '../composables/useI18n'
import type { Translations } from '../types/catalog'


function isEmptyLocalizedValue(value: unknown) {
  if (value == null || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

function emptyLocalizedValue(value: unknown) {
  if (Array.isArray(value)) return []
  if (value && typeof value === 'object') return {}
  if (typeof value === 'string') return ''
  return value == null ? value : ''
}


export function resolveLocalizedRecord<T extends { translations?: Translations }>(
  record: T,
  locale: Locale,
  fields: readonly (keyof T)[],
): T {
  if (locale === 'zh-CN') return record
  const translated = record.translations?.[locale]
  if (!translated) return record

  const patch = Object.fromEntries(fields.map((field) => {
    const value = translated[String(field)]
    return [field, isEmptyLocalizedValue(value) ? record[field] : value]
  }))
  return { ...record, ...patch }
}

export function resolveStrictLocalizedRecord<T extends { translations?: Translations }>(
  record: T,
  locale: Locale,
  fields: readonly (keyof T)[],
): T {
  if (locale === 'zh-CN') return record
  const translated = record.translations?.[locale]
  const hasLocalizedContent = fields.some((field) => !isEmptyLocalizedValue(translated?.[String(field)]))
  if (!hasLocalizedContent) return record
  const patch = Object.fromEntries(fields.map((field) => {
    const value = translated?.[String(field)]
    return [field, isEmptyLocalizedValue(value) ? emptyLocalizedValue(record[field]) : value]
  }))
  return { ...record, ...patch }
}
