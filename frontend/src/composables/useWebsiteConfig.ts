import { computed, inject, onMounted, provide, shallowRef, type ShallowRef } from 'vue'
import { getWebsiteConfig } from '../api/websiteConfig'
import { useI18n } from './useI18n'
import type { PageContentConfig, WebsiteConfigPayload } from '../types/websiteConfig'

const websiteConfigKey = Symbol('website-config')

export function provideWebsiteConfig(initialValue: WebsiteConfigPayload | null) {
  const config = shallowRef<WebsiteConfigPayload | null>(initialValue)
  provide(websiteConfigKey, config)
  return config
}

export function useWebsiteConfig() {
  const { locale, t } = useI18n()
  const injectedConfig = inject<ShallowRef<WebsiteConfigPayload | null> | null>(websiteConfigKey, null)
  const config = injectedConfig ?? shallowRef<WebsiteConfigPayload | null>(null)
  const isConfigLoading = shallowRef(false)
  const configError = shallowRef('')

  const enabledSections = computed(() => config.value?.homeSections.filter(section => section.enabled) ?? [])

  function pageConfig(key: PageContentConfig['key']) {
    return computed(() => {
      const page = config.value?.pages.find(item => item.key === key)
      if (!page) return null
      const fallbackKeys = {
        product: ['products.title', 'products.subtitle'],
        solution: ['solutions.title', 'solutions.subtitle'],
        about: ['about.title', 'about.subtitle'],
        contact: ['contact.title', 'contact.subtitle'],
      } as const
      const [headlineKey, summaryKey] = fallbackKeys[key]
      const isChinese = locale.value === 'zh-CN'
      return {
        ...page,
        headline: page.headlineTranslations?.[locale.value] || (isChinese ? page.headline : t(headlineKey)),
        summary: page.summaryTranslations?.[locale.value] || (isChinese ? page.summary : t(summaryKey)),
        blocks: page.blocks
          .filter(block => isChinese || Boolean(block.titleTranslations?.[locale.value] || block.bodyTranslations?.[locale.value]))
          .map(block => ({
            ...block,
            title: block.titleTranslations?.[locale.value] || block.title,
            body: block.type === 'image' ? block.body : (block.bodyTranslations?.[locale.value] || block.body),
          })),
      }
    })
  }

  function isSectionEnabled(id: string) {
    if (!config.value) return true
    return enabledSections.value.some(section => section.id === id)
  }

  async function loadWebsiteConfig() {
    isConfigLoading.value = true
    configError.value = ''
    try {
      config.value = await getWebsiteConfig()
    } catch {
      configError.value = 'Unable to load website configuration.'
    } finally {
      isConfigLoading.value = false
    }
  }

  onMounted(() => {
    if (!config.value) void loadWebsiteConfig()
  })

  return {
    config,
    isConfigLoading,
    configError,
    enabledSections,
    pageConfig,
    isSectionEnabled,
    loadWebsiteConfig,
  }
}
