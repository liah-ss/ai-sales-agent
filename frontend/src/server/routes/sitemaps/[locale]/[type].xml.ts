import { getSitemapPages, renderUrlSet, sitemapLocales, sitemapTypes } from '../../../utils/sitemap'
import type { SitemapLocale, SitemapType } from '../../../utils/sitemap'

export default defineEventHandler(async (event) => {
  const match = event.path.split('?')[0].match(/^\/sitemaps\/([^/]+)\/([^/]+)\.xml$/)
  const locale = match?.[1] as SitemapLocale
  const type = match?.[2] as SitemapType
  if (!sitemapLocales.includes(locale) || !sitemapTypes.includes(type)) {
    throw createError({ statusCode: 404, statusMessage: 'Sitemap not found' })
  }

  const config = useRuntimeConfig(event)
  if (config.public.hideZhCn && locale === 'zh-cn') {
    throw createError({ statusCode: 404, statusMessage: 'Sitemap not found' })
  }
  const siteUrl = String(config.public.siteUrl).replace(/\/$/, '')
  const pages = await getSitemapPages(event, type)
  const visibleLocales = config.public.hideZhCn
    ? sitemapLocales.filter(item => item !== 'zh-cn')
    : sitemapLocales
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=900, stale-while-revalidate=3600')
  return renderUrlSet(siteUrl, pages, locale, visibleLocales)
})
