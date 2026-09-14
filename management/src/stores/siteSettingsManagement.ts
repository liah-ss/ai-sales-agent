import { defineStore } from 'pinia'
import { computed, reactive, shallowRef } from 'vue'
import { getManagementSiteSettings, saveManagementSiteSettings } from '../api/siteSettingsManagement'
import type { HomeMetricSetting, SiteSettings } from '../types/siteSettings'

const defaultSettings: SiteSettings = {
  brand_name: 'ExampleCorp',
  tagline: 'Power equipment global sourcing platform',
  seo_title: 'ExampleCorp | Power Equipment Global Sourcing Platform',
  seo_description: 'ExampleCorp helps global buyers source certified power equipment through scenario procurement, engineering selection and managed delivery.',
  whatsapp_number: '+00 000-0000-0000',
  facebook_url: 'https://www.facebook.com/examplecorp',
  linkedin_url: 'https://www.linkedin.com/in/俊-李-667388422?utm_source=share_via&utm_content=profile&utm_medium=member_android',
  sales_email: 'consultant@example.com',
  phone: '0000-0000-0000',
  topbar_slogan_text: '⚡ 全球工业设备直采 · 场景化采购 · 一站式交付',
  topbar_phone_text: '📞 0000-0000-0000',
  topbar_whatsapp_text: 'WhatsApp',
  topbar_login_text: '登录',
  topbar_register_text: '注册',
  company_address: '上海虹桥阿里中心',
  supported_languages: ['en', 'id', 'zh-CN'],
  footer_description: 'Leading global supplier of premium power and electrical solutions for industrial and commercial markets.',
  home_hero_title: 'Global Provider of Premium Power & Electrical Solutions',
  home_hero_subtitle: 'Your trusted partner for power cables, solar inverters, diesel generators and smart meters, delivering complete power solutions worldwide.',
  home_hero_badge: 'Power solutions provider since 2005',
  home_primary_cta_text: 'Contact Sales',
  home_primary_cta_url: '/contact',
  home_secondary_cta_text: 'Explore Products',
  home_secondary_cta_url: '/products',
  home_contact_title: 'Get In Touch',
  home_contact_subtitle: 'Start your partnership with ExampleCorp today.',
  home_metrics: [
    { value: '20+', label: 'Years Experience', description: 'Power and electrical supply experience' },
    { value: '1,000+', label: 'Projects Delivered', description: 'Commercial and infrastructure projects' },
    { value: '50+', label: 'Export Countries', description: 'Global delivery and service network' },
    { value: '500+', label: 'Skilled Employees', description: 'Engineering, production and support team' },
  ],
  translations: {
    en: {
      company_address: 'Alibaba Center, Hongqiao, Shanghai, China',
      topbar_phone_text: '📞 0000-0000-0000',
    },
    id: {
      company_address: 'Alibaba Center Hongqiao, Shanghai, China',
      topbar_phone_text: '📞 0000-0000-0000',
    },
  },
}

export const useSiteSettingsManagementStore = defineStore('site-settings-management', () => {
  const settings = reactive<SiteSettings>({
    ...defaultSettings,
    home_metrics: defaultSettings.home_metrics.map(item => ({ ...item })),
    translations: {
      en: { ...(defaultSettings.translations.en ?? {}) },
      id: { ...(defaultSettings.translations.id ?? {}) },
    },
  })
  const isLoading = shallowRef(false)
  const isSaving = shallowRef(false)
  const error = shallowRef('')
  const lastSavedAt = shallowRef('')

  const languageSummary = computed(() => settings.supported_languages.join(', '))
  const metricCount = computed(() => settings.home_metrics.length)

  function applySettings(payload: SiteSettings) {
    Object.assign(settings, {
      ...payload,
      supported_languages: [...payload.supported_languages],
      home_metrics: payload.home_metrics.map(item => ({
        ...item,
        labelTranslations: { ...(item.labelTranslations ?? {}) },
        descriptionTranslations: { ...(item.descriptionTranslations ?? {}) },
      })),
      translations: {
        en: { ...(payload.translations?.en ?? {}) },
        id: { ...(payload.translations?.id ?? {}) },
      },
    })
  }

  function snapshot(): SiteSettings {
    return {
      ...settings,
      supported_languages: [...settings.supported_languages],
      home_metrics: settings.home_metrics.map(item => ({
        ...item,
        labelTranslations: { ...(item.labelTranslations ?? {}) },
        descriptionTranslations: { ...(item.descriptionTranslations ?? {}) },
      })),
      translations: {
        en: { ...(settings.translations.en ?? {}) },
        id: { ...(settings.translations.id ?? {}) },
      },
    }
  }

  async function load(token: string) {
    isLoading.value = true
    error.value = ''
    try {
      applySettings(await getManagementSiteSettings(token))
    } catch {
      error.value = 'Unable to load site settings.'
    } finally {
      isLoading.value = false
    }
  }

  async function save(token: string) {
    isSaving.value = true
    error.value = ''
    try {
      applySettings(await saveManagementSiteSettings(snapshot(), token))
      lastSavedAt.value = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date())
    } catch {
      error.value = 'Unable to save site settings.'
    } finally {
      isSaving.value = false
    }
  }

  function setLanguages(value: string) {
    settings.supported_languages = value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }

  function updateMetric(index: number, patch: Partial<HomeMetricSetting>) {
    const metric = settings.home_metrics[index]
    if (metric) Object.assign(metric, patch)
  }

  function addMetric() {
    settings.home_metrics.push({ value: '0', label: 'New metric', description: '' })
  }

  function removeMetric(index: number) {
    settings.home_metrics.splice(index, 1)
  }

  return {
    settings,
    isLoading,
    isSaving,
    error,
    lastSavedAt,
    languageSummary,
    metricCount,
    load,
    save,
    setLanguages,
    updateMetric,
    addMetric,
    removeMetric,
  }
})
