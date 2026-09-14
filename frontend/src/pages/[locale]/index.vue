<script setup lang="ts">
import HomeView from '../../views/HomeView.vue'
import { resolveResponsiveAsset } from '../../api/client'
import { useI18n } from '../../composables/useI18n'
import type { CategoryTree } from '../../api/catalog'
import type { HomeResponse } from '../../types/catalog'
import { normalizeBrandText } from '../../utils/seoContent'

const { locale, t } = useI18n()
const apiHeaders = useApiRequestHeaders()
const { data, error } = await useAsyncData(`home-${locale.value}`, async () => {
  const [home, categories] = await Promise.all([
    $fetch<HomeResponse>('/api/home', { headers: apiHeaders }),
    $fetch<CategoryTree[]>('/api/categories', { headers: apiHeaders }),
  ])
  return { home, categories }
})

if (error.value) throw createError({ statusCode: 503, statusMessage: 'Public content is temporarily unavailable' })
const initialHome = data.value?.home
const initialCategories = data.value?.categories
const initialSolutions = initialHome?.solutions ?? []
const heroImage = computed(() => resolveResponsiveAsset(initialHome?.banners[0]?.image_url, {
  widths: [640, 960, 1280, 1600],
  quality: 76,
}))

useHead(() => ({
  link: heroImage.value.src
    ? [{
        rel: 'preload',
        as: 'image',
        href: heroImage.value.src,
        imagesrcset: heroImage.value.srcset || undefined,
        imagesizes: '(max-width: 1024px) 100vw, 834px',
        fetchpriority: 'high',
      }]
    : [],
}))

const title = computed(() => locale.value === 'en'
  ? normalizeBrandText(data.value?.home.site.seo_title || `${t('home.heroTitle')} | ExampleCorp`)
  : `${t('home.heroTitle')} | ExampleCorp`)
const description = computed(() => locale.value === 'en'
  ? normalizeBrandText(data.value?.home.site.seo_description || t('home.heroSubtitle'))
  : t('home.heroSubtitle'))

usePageSeo(computed(() => ({
  title: title.value,
  description: description.value,
  path: '/',
  locale: locale.value,
  image: data.value?.home.banners[0]?.image_url,
})))
</script>

<template>
  <HomeView
    :initial-home="initialHome"
    :initial-categories="initialCategories"
    :initial-solutions="initialSolutions"
    :initial-locale="locale"
  />
</template>
