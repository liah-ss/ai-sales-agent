<script setup lang="ts">
import SearchResultsView from '../../views/SearchResultsView.vue'
import { useI18n } from '../../composables/useI18n'

const route = useRoute()
const { locale, t } = useI18n()
usePageSeo(computed(() => ({
  title: `${t('search.action')} ${String(route.query.q || '')} | ExampleCorp`,
  description: t('search.allContent'),
  path: '/search',
  locale: locale.value,
  robots: 'noindex,follow',
})))
</script>

<template><SearchResultsView /></template>
