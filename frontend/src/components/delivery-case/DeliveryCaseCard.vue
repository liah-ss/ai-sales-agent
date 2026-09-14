<script setup lang="ts">
import { computed } from 'vue'
import { Building2, CalendarCheck2, Image } from '@lucide/vue'
import { resolveResponsiveAsset } from '../../api/client'
import type { DeliveryCaseSummary } from '../../types/catalog'

const props = defineProps<{
  deliveryCase: DeliveryCaseSummary
}>()

const localizedCase = computed(() => props.deliveryCase)
const thumbnail = computed(() => {
  return resolveResponsiveAsset(props.deliveryCase.thumbnail_url, { widths: [320, 480, 640] })
})
</script>

<template>
  <LocalizedLink class="news-card delivery-case-card" :to="`/delivery-cases/${deliveryCase.slug}`">
    <div class="news-card-media">
      <img v-if="thumbnail.src" :src="thumbnail.src" :srcset="thumbnail.srcset || undefined" sizes="(max-width: 720px) 100vw, 400px" :alt="localizedCase.title" width="640" height="400" loading="lazy" decoding="async" />
      <Image v-if="!thumbnail.src" class="news-card-placeholder" />
    </div>
    <div class="news-card-body delivery-case-card-body">
      <h3>{{ localizedCase.title }}</h3>
      <div class="news-card-meta delivery-case-card-meta">
        <span><Building2 class="news-meta-icon" />{{ localizedCase.client_name }}</span>
      </div>
      <div class="news-card-meta delivery-case-card-meta">
        <span><CalendarCheck2 class="news-meta-icon" />{{ deliveryCase.delivered_at }}</span>
      </div>
    </div>
  </LocalizedLink>
</template>
