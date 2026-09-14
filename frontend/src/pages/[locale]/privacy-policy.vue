<script setup lang="ts">
import PrivacyPolicyView from '../../views/PrivacyPolicyView.vue'
import { useI18n } from '../../composables/useI18n'
import { privacyPolicyContent } from '../../data/privacyPolicyContent'

const { locale, t } = useI18n()
const document = computed(() => privacyPolicyContent[locale.value])
const descriptions = {
  'zh-CN': '了解 ExampleCorp 如何按照适用法律收集、使用、共享和保护企业客户、合作伙伴及服务商的个人与商业信息。',
  en: 'Learn how ExampleCorp collects, uses, shares and protects personal and business information for customers, partners and service providers.',
  id: 'Pelajari cara ExampleCorp mengumpulkan, menggunakan, membagikan, dan melindungi informasi pribadi serta bisnis pelanggan, mitra, dan penyedia layanan.',
}
usePageSeo(computed(() => ({
  title: `${document.value.title} | ExampleCorp`,
  description: descriptions[locale.value],
  path: '/privacy-policy',
  locale: locale.value,
  breadcrumbs: [
    { name: t('nav.home'), path: '/' },
    { name: document.value.title, path: '/privacy-policy' },
  ],
  schema: { '@context': 'https://schema.org', '@type': 'WebPage', name: document.value.title },
})))
</script>

<template><PrivacyPolicyView /></template>
