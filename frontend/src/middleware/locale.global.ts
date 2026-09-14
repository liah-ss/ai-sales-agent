import { isLocaleSegment, stripLocalePrefix } from '../utils/localeRouting'

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  const configuredDefaultLocale = String(config.public.defaultLocale || 'id')
  const defaultLocale = isLocaleSegment(configuredDefaultLocale)
    && !(config.public.hideZhCn && configuredDefaultLocale === 'zh-cn')
    ? configuredDefaultLocale
    : 'id'
  const firstSegment = to.path.split('/').filter(Boolean)[0]
  if (config.public.hideZhCn && firstSegment === 'zh-cn') {
    const path = stripLocalePrefix(to.path)
    return navigateTo(`/id${path === '/' ? '/' : path}`, { redirectCode: 301 })
  }
  if (isLocaleSegment(firstSegment)) return
  if (to.path.startsWith('/api/') || to.path.startsWith('/_nuxt/')) return
  if (to.path === '/robots.txt' || to.path === '/llms.txt' || to.path === '/sitemap.xml' || to.path.startsWith('/sitemaps/')) return
  return navigateTo(`/${defaultLocale}${to.fullPath === '/' ? '/' : to.fullPath}`, { redirectCode: 301 })
})
