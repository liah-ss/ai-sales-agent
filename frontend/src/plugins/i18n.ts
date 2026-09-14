import { createAppI18n } from '../composables/useI18n'
import { segmentToLocale } from '../utils/localeRouting'

export default defineNuxtPlugin((nuxtApp) => {
  const requestUrl = useRequestURL()
  const locale = segmentToLocale(requestUrl.pathname.split('/').filter(Boolean)[0] || 'id')
  const appI18n = createAppI18n(locale)
  nuxtApp.vueApp.use(appI18n)

  const router = useRouter()
  router.afterEach((to) => {
    const nextLocale = segmentToLocale(to.path.split('/').filter(Boolean)[0] || 'id')
    if (appI18n.global.locale.value !== nextLocale) appI18n.global.locale.value = nextLocale
  })
})
