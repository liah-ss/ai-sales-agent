import type { Locale } from '../composables/useI18n'

export interface PageSeoInput {
  title: string
  description: string
  path: string
  locale: Locale
  image?: string
  imageAlt?: string
  ogType?: 'website' | 'article' | 'product'
  robots?: 'index,follow' | 'noindex,follow' | 'noindex,nofollow'
  previousPath?: string
  nextPath?: string
  publishedAt?: string
  updatedAt?: string
  schema?: Record<string, unknown> | Array<Record<string, unknown>>
  breadcrumbs?: Array<{ name: string; path: string }>
  availableLocales?: Locale[]
}
