import type { RouteLocationRaw } from 'vue-router'

import type { Locale } from '../composables/useI18n'

export type LocaleSegment = 'id' | 'en' | 'zh-cn'

export const localeSegments: LocaleSegment[] = ['id', 'en', 'zh-cn']

export function localeToSegment(locale: Locale): LocaleSegment {
  return locale === 'zh-CN' ? 'zh-cn' : locale
}

export function segmentToLocale(segment: string | null | undefined): Locale {
  if (segment === 'zh-cn') return 'zh-CN'
  if (segment === 'id') return 'id'
  return 'en'
}

export function isLocaleSegment(value: string | null | undefined): value is LocaleSegment {
  return localeSegments.includes(value as LocaleSegment)
}

export function stripLocalePrefix(path: string) {
  const segments = path.split('/').filter(Boolean)
  if (isLocaleSegment(segments[0])) segments.shift()
  return `/${segments.join('/')}`.replace(/\/$/, '') || '/'
}

export function localizePath(path: string, locale: Locale) {
  if (!path.startsWith('/') || path.startsWith('/api/') || path.startsWith('/_nuxt/')) return path
  const unprefixed = stripLocalePrefix(path)
  return `/${localeToSegment(locale)}${unprefixed === '/' ? '/' : unprefixed}`
}

export function localizeRouteLocation(to: RouteLocationRaw, locale: Locale): RouteLocationRaw {
  if (typeof to === 'string') return localizePath(to, locale)
  if ('path' in to && typeof to.path === 'string') return { ...to, path: localizePath(to.path, locale) }
  return to
}
