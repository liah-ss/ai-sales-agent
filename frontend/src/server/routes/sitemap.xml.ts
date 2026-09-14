import { renderSitemapIndex, sitemapLocales } from '../utils/sitemap'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = String(config.public.siteUrl).replace(/\/$/, '')
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=900, stale-while-revalidate=3600')
  const locales = config.public.hideZhCn ? sitemapLocales.filter(locale => locale !== 'zh-cn') : sitemapLocales
  return renderSitemapIndex(siteUrl, locales)
})
