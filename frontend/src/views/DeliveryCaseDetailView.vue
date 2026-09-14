<script setup lang="ts">
import { computed } from 'vue'
import { Building2, CalendarCheck2 } from '@lucide/vue'
import { resolveResponsiveAsset } from '../api/client'
import DeliveryCaseDocumentSections from '../components/delivery-case/DeliveryCaseDocumentSections.vue'
import RichContent from '../components/common/RichContent.vue'
import SeoGeoEvidence from '../components/common/SeoGeoEvidence.vue'
import { useI18n } from '../composables/useI18n'
import { useLocalizedContent } from '../data/localizedContent'
import type { DeliveryCase } from '../types/catalog'

const props = defineProps<{
  initialDeliveryCase?: DeliveryCase | null
}>()

const { t } = useI18n()
const { localizeDeliveryCase } = useLocalizedContent()

const deliveryCase = computed(() => props.initialDeliveryCase)
const localizedCase = computed(() => deliveryCase.value ? localizeDeliveryCase(deliveryCase.value) : null)
const caseImage = computed(() => {
  const content = localizedCase.value?.content ?? ''
  const image = content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
  return resolveResponsiveAsset(image || deliveryCase.value?.thumbnail_url, { widths: [640, 960, 1400] })
})
const hasStructuredContent = computed(() => Boolean(
  localizedCase.value?.project_overview
  || localizedCase.value?.indonesia_fit
  || localizedCase.value?.professional_configuration
  || localizedCase.value?.key_parameter_table.length
  || localizedCase.value?.delivery_challenges.length
  || localizedCase.value?.project_results,
))

</script>

<template>
  <section class="news-detail-page delivery-case-detail-page">
    <article v-if="localizedCase" class="news-detail-article delivery-case-detail-article">
      <p class="breadcrumb">
        <LocalizedLink to="/">{{ t('nav.home') }}</LocalizedLink> ›
        <LocalizedLink to="/delivery-cases">{{ t('deliveryCases.title') }}</LocalizedLink> ›
        <span>{{ localizedCase.title }}</span>
      </p>
      <header>
        <h1>{{ localizedCase.title }}</h1>
      </header>
      <div class="delivery-case-facts">
        <article>
          <Building2 class="news-meta-icon" />
          <small>{{ t('deliveryCases.client') }}</small>
          <strong>{{ localizedCase.client_name }}</strong>
        </article>
        <article>
          <CalendarCheck2 class="news-meta-icon" />
          <small>{{ t('deliveryCases.deliveredAt') }}</small>
          <strong>{{ localizedCase.delivered_at }}</strong>
        </article>
      </div>
      <figure v-if="caseImage.src" class="delivery-case-main-image">
        <img :src="caseImage.src" :srcset="caseImage.srcset || undefined" sizes="(max-width: 900px) 100vw, 960px" :alt="localizedCase.title" width="1400" height="788" fetchpriority="high" decoding="async" />
      </figure>
      <DeliveryCaseDocumentSections v-if="hasStructuredContent" :delivery-case="localizedCase" />
      <RichContent v-else class="delivery-case-structured-content" :html="localizedCase.content" />
      <SeoGeoEvidence :record="localizedCase" />
    </article>
  </section>
</template>
