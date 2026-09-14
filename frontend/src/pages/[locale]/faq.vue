<script setup lang="ts">
import FaqView from '../../views/FaqView.vue'
import { useI18n } from '../../composables/useI18n'
import { useWebsiteConfig } from '../../composables/useWebsiteConfig'
import { faqCategoryTitle, faqItemAnswer, faqItemQuestion, faqPageText } from '../../utils/faq'

const { locale } = useI18n()
const { config, loadWebsiteConfig } = useWebsiteConfig()

// Homepage SSR omits the large FAQ item list. Restore it only when a client
// navigation actually enters the help center; direct FAQ SSR is already full.
if (config.value?.faq && config.value.faq.categories.length === 0) {
  await loadWebsiteConfig()
}

const faq = computed(() => config.value?.faq ?? null)

usePageSeo(computed(() => {
  const page = faq.value
  const title = page ? faqPageText(page, 'title', locale.value) : 'FAQ'
  const description = page ? faqPageText(page, 'summary', locale.value) : 'ExampleCorp help center'
  const entities = page?.categories
    .filter(category => category.enabled)
    .flatMap(category => category.items
      .filter(item => item.enabled)
      .map(item => ({
        '@type': 'Question',
        name: faqItemQuestion(item, locale.value),
        acceptedAnswer: { '@type': 'Answer', text: faqItemAnswer(item, locale.value) },
      }))) ?? []

  return {
    title: `${title} | ExampleCorp`,
    description,
    path: '/faq',
    locale: locale.value,
    breadcrumbs: [
      { name: locale.value === 'zh-CN' ? '首页' : locale.value === 'id' ? 'Beranda' : 'Home', path: '/' },
      { name: page ? faqPageText(page, 'eyebrow', locale.value) : title, path: '/faq' },
    ],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      name: title,
      description,
      about: page?.categories.filter(category => category.enabled).map(category => faqCategoryTitle(category, locale.value)) ?? [],
      mainEntity: entities,
    },
  }
}))
</script>

<template><FaqView /></template>
