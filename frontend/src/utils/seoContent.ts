import type { Locale } from '../composables/useI18n'
import type { Translations } from '../types/catalog'

export function localizedField<T>(
  record: T & { translations?: Translations },
  locale: Locale,
  field: keyof T,
): T[keyof T] {
  if (locale === 'zh-CN') return record[field]
  const translated = record.translations?.[locale]?.[String(field)]
  return (translated == null || translated === '' ? record[field] : translated) as T[keyof T]
}

export function plainText(value: unknown, maxLength = 180) {
  const normalized = String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trim()}…` : normalized
}

export function absoluteUrl(siteUrl: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return `${siteUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

export function normalizeBrandText(value: string) {
  return value.replace(/ExampleCorp/gi, 'ExampleCorp')
}

export function hasLocalizedField<T>(
  record: T & { translations?: Translations },
  locale: Locale,
  field: keyof T,
) {
  if (locale === 'zh-CN') return Boolean(String(record[field] ?? '').trim())
  const payload = record.translations?.[locale]
  const status = payload?._meta?.status
  if (status === 'missing' || status === 'failed') return false
  return Boolean(String(payload?.[String(field)] ?? '').trim())
}

export function availableContentLocales<T>(
  record: T & { translations?: Translations },
  field: keyof T,
): Locale[] {
  return (['id', 'en', 'zh-CN'] as const).filter(locale => hasLocalizedField(record, locale, field))
}
