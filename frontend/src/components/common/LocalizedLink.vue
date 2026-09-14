<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import { useI18n } from '../../composables/useI18n'
import { localizeRouteLocation } from '../../utils/localeRouting'

const props = withDefaults(defineProps<{
  to: RouteLocationRaw
  prefetch?: boolean
  external?: boolean
  prefetchOn?: 'visibility' | 'interaction' | Partial<{
    visibility: boolean
    interaction: boolean
  }>
}>(), {
  prefetch: false,
})

const { locale } = useI18n()
const localizedTo = computed(() => localizeRouteLocation(props.to, locale.value))
</script>

<template>
  <NuxtLink
    :to="localizedTo"
    :prefetch="props.prefetch"
    :prefetch-on="props.prefetchOn"
    :external="props.external"
  >
    <slot />
  </NuxtLink>
</template>
