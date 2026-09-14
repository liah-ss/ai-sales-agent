import { localeToSegment, localizePath } from '../utils/localeRouting'
import { absoluteUrl } from '../utils/seoContent'
import type { PageSeoInput } from '../types/seo'

const htmlLocaleMap = {
  en: 'en',
  id: 'id-ID',
  'zh-CN': 'zh-CN',
} as const

const openGraphLocaleMap = {
  en: 'en_US',
  id: 'id_ID',
  'zh-CN': 'zh_CN',
} as const

function normalizeSchemaImages(value: unknown, assetBaseUrl: string): unknown {
  if (Array.isArray(value)) return value.map(item => normalizeSchemaImages(item, assetBaseUrl))
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(Object.entries(value).map(([key, child]) => {
    if (key === 'image') {
      if (typeof child === 'string') return [key, encodeURI(absoluteUrl(assetBaseUrl, child))]
      if (Array.isArray(child)) {
        return [key, child.map(item => typeof item === 'string' ? encodeURI(absoluteUrl(assetBaseUrl, item)) : item)]
      }
    }
    return [key, normalizeSchemaImages(child, assetBaseUrl)]
  }))
}

export function usePageSeo(input: MaybeRefOrGetter<PageSeoInput>) {
  const config = useRuntimeConfig()
  const seo = computed(() => toValue(input))
  const siteUrl = String(config.public.siteUrl).replace(/\/$/, '')
  const assetBaseUrl = String(config.public.assetBaseUrl || siteUrl).replace(/\/$/, '')
  const visibleLocales = computed(() => config.public.hideZhCn
    ? (['id', 'en'] as const)
    : (['id', 'en', 'zh-CN'] as const))
  const canonical = computed(() => `${siteUrl}${localizePath(seo.value.path, seo.value.locale)}`)
  const socialImage = computed(() => {
    const image = seo.value.image?.trim()
    if (!image) return undefined
    return absoluteUrl(assetBaseUrl, image)
  })
  const socialImageAlt = computed(() => socialImage.value
    ? String(seo.value.imageAlt || seo.value.title).trim()
    : undefined)
  const alternates = computed(() => visibleLocales.value
    .filter(locale => !seo.value.availableLocales || seo.value.availableLocales.includes(locale))
    .map(locale => ({
      hreflang: htmlLocaleMap[locale],
      href: `${siteUrl}${localizePath(seo.value.path, locale)}`,
    })))
  const defaultLocale = computed(() => seo.value.availableLocales?.includes('id') === false
    ? (seo.value.availableLocales[0] || 'id')
    : 'id')
  const structuredData = computed(() => {
    const schemas = seo.value.schema
      ? (Array.isArray(seo.value.schema) ? [...seo.value.schema] : [seo.value.schema])
      : []
    if (seo.value.breadcrumbs?.length) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': `${canonical.value}#breadcrumb`,
        itemListElement: seo.value.breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${siteUrl}${localizePath(item.path, seo.value.locale)}`,
        })),
      })
    }
    return schemas.map(schema => normalizeSchemaImages(schema, assetBaseUrl))
  })

  useSeoMeta({
    title: () => seo.value.title,
    description: () => seo.value.description,
    robots: () => seo.value.robots || 'index,follow',
    ogTitle: () => seo.value.title,
    ogDescription: () => seo.value.description,
    ogUrl: canonical,
    ogSiteName: 'ExampleCorp',
    ogImage: socialImage,
    ogImageAlt: socialImageAlt,
    ogLocale: () => openGraphLocaleMap[seo.value.locale],
    ogLocaleAlternate: () => visibleLocales.value
      .filter(locale => locale !== seo.value.locale)
      .filter(locale => !seo.value.availableLocales || seo.value.availableLocales.includes(locale))
      .map(locale => openGraphLocaleMap[locale]),
    twitterCard: 'summary_large_image',
    twitterTitle: () => seo.value.title,
    twitterDescription: () => seo.value.description,
    twitterImage: socialImage,
    twitterImageAlt: socialImageAlt,
    articlePublishedTime: () => seo.value.publishedAt,
    articleModifiedTime: () => seo.value.updatedAt,
  })

  useHead(() => ({
    htmlAttrs: { lang: htmlLocaleMap[seo.value.locale] },
    meta: [
      { property: 'og:type', content: seo.value.ogType || 'website' },
    ],
    link: [
      { rel: 'canonical', href: canonical.value },
      ...(seo.value.previousPath ? [{ rel: 'prev', href: `${siteUrl}${localizePath(seo.value.previousPath, seo.value.locale)}` }] : []),
      ...(seo.value.nextPath ? [{ rel: 'next', href: `${siteUrl}${localizePath(seo.value.nextPath, seo.value.locale)}` }] : []),
      ...alternates.value.map(alternate => ({ rel: 'alternate', ...alternate })),
      { rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}${localizePath(seo.value.path, defaultLocale.value)}` },
    ],
    script: structuredData.value.length
      ? [{
          key: `schema-${localeToSegment(seo.value.locale)}-${seo.value.path}`,
          type: 'application/ld+json',
          textContent: JSON.stringify(structuredData.value.length === 1 ? structuredData.value[0] : structuredData.value).replace(/</g, '\\u003c'),
        }]
      : [],
  }))

  return { canonical, alternates }
}
