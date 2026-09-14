<script setup lang="ts">
import { computed } from 'vue'
import { resolveOptimizedAssetUrl } from '../../api/client'
import { useI18n } from '../../composables/useI18n'
import { useLocalizedContent } from '../../data/localizedContent'
import type { SiteSettings } from '../../types/site'

const props = defineProps<{
  siteSettings: SiteSettings | null
  healthStatus: string
}>()

const { locale, t } = useI18n()
const { text } = useLocalizedContent()
const logoUrl = computed(() => resolveOptimizedAssetUrl('/logo-footer.png', { width: 480, quality: 86 }))
// Keep the logo source compatible with the Docker/Nuxt deployment, where
// the static /media directory is not mounted into the application container.
const productionLogoUrl = computed(() => logoUrl.value)
const brandName = computed(() => {
  return !props.siteSettings?.brand_name || props.siteSettings.brand_name === 'ExampleCorp'
    ? 'ExampleCorp'
    : props.siteSettings.brand_name
})
const footerDescription = computed(() => {
  const translated = locale.value === 'zh-CN'
    ? undefined
    : props.siteSettings?.translations?.[locale.value]?.footer_description
  if (translated?.trim()) return translated
  if (locale.value === 'en' && props.siteSettings?.footer_description?.trim()) {
    return props.siteSettings.footer_description
  }
  return t('footer.description')
})
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer-inner">
      <div class="footer-brand">
        <div class="footer-brand-heading">
          <img class="footer-brand-logo" :src="productionLogoUrl" :alt="brandName" width="240" height="54" loading="lazy" decoding="async" />
        </div>
        <p>
          {{ footerDescription }}
        </p>
      </div>

      <div class="footer-column">
        <strong>{{ text('footer.procurementService', 'Procurement service') }}</strong>
        <LocalizedLink to="/contact">{{ text('footer.submitDemand', 'Submit procurement demand') }}</LocalizedLink>
        <LocalizedLink to="/solutions/ev-charging-station">{{ text('footer.scenarioSelect', 'Scenario-based selection') }}</LocalizedLink>
        <LocalizedLink to="/products">{{ t('nav.products') }}</LocalizedLink>
        <LocalizedLink to="/contact">{{ t('nav.contact') }}</LocalizedLink>
      </div>

      <div class="footer-column">
        <strong>{{ text('footer.platformGuarantee', 'Platform guarantee') }}</strong>
        <LocalizedLink to="/about">{{ text('footer.supplierStandard', 'Supplier admission standards') }}</LocalizedLink>
        <LocalizedLink to="/about">{{ text('footer.qualityProcess', 'Quality control process') }}</LocalizedLink>
        <LocalizedLink to="/solutions/ev-charging-station">{{ text('footer.deliveryPromise', 'Delivery commitment') }}</LocalizedLink>
        <LocalizedLink to="/about">{{ text('footer.afterSales', 'After-sales warranty') }}</LocalizedLink>
        <LocalizedLink to="/privacy-policy">{{ text('footer.privacyPolicy', 'Privacy policy') }}</LocalizedLink>
      </div>

      <div class="footer-column">
        <strong>{{ text('footer.aboutUs', 'About us') }}</strong>
        <LocalizedLink to="/about">{{ t('nav.about') }}</LocalizedLink>
        <LocalizedLink to="/contact">{{ t('nav.contact') }}</LocalizedLink>
        <LocalizedLink to="/faq">{{ text('nav.helpCenter', 'Help Center') }}</LocalizedLink>
        <LocalizedLink to="/products">{{ t('footer.viewAll') }}</LocalizedLink>
        <span>{{ siteSettings?.sales_email ?? 'consultant@example.com' }}</span>
      </div>
    </div>
  </footer>
</template>
