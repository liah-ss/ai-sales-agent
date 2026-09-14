<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, PackageSearch, Send } from '@lucide/vue'
import FaqExplorer from '../components/faq/FaqExplorer.vue'
import { useI18n } from '../composables/useI18n'
import { useWebsiteConfig } from '../composables/useWebsiteConfig'
import { faqPageText } from '../utils/faq'

const { locale } = useI18n()
const { config, isConfigLoading, configError, loadWebsiteConfig } = useWebsiteConfig()
const faq = computed(() => config.value?.faq ?? null)
const statusCopy = computed(() => ({
  'zh-CN': { loading: '正在加载帮助中心...', retry: '重新加载' },
  en: { loading: 'Loading the Help Center...', retry: 'Try again' },
  id: { loading: 'Memuat Pusat Bantuan...', retry: 'Coba lagi' },
})[locale.value])
const copy = computed(() => {
  if (!faq.value) return null
  return {
    eyebrow: faqPageText(faq.value, 'eyebrow', locale.value),
    title: faqPageText(faq.value, 'title', locale.value),
    accent: faqPageText(faq.value, 'accent', locale.value),
    summary: faqPageText(faq.value, 'summary', locale.value),
    ctaTitle: faqPageText(faq.value, 'ctaTitle', locale.value),
    ctaBody: faqPageText(faq.value, 'ctaBody', locale.value),
    primaryAction: faqPageText(faq.value, 'primaryAction', locale.value),
    secondaryAction: faqPageText(faq.value, 'secondaryAction', locale.value),
  }
})
</script>

<template>
  <div class="faq-page">
    <section v-if="faq && copy" class="faq-hero">
      <div class="faq-hero-inner">
        <p>{{ copy.eyebrow }}</p>
        <h1>{{ copy.title }} <span>{{ copy.accent }}</span></h1>
        <div class="faq-hero-rule"></div>
        <p>{{ copy.summary }}</p>
      </div>
    </section>

    <section class="faq-page-content">
      <div v-if="isConfigLoading && !faq" class="faq-status" role="status">{{ statusCopy.loading }}</div>
      <div v-else-if="configError && !faq" class="faq-status error" role="alert">
        <span>{{ configError }}</span>
        <button type="button" @click="loadWebsiteConfig">{{ statusCopy.retry }}</button>
      </div>
      <FaqExplorer v-else-if="faq" :faq="faq" :locale="locale" />
    </section>

    <section v-if="faq && copy" class="faq-cta-band">
      <div class="faq-cta-inner">
        <div class="faq-cta-mark"><PackageSearch /></div>
        <div class="faq-cta-copy">
          <h2>{{ copy.ctaTitle }}</h2>
          <p>{{ copy.ctaBody }}</p>
        </div>
        <div class="faq-cta-actions">
          <LocalizedLink class="faq-cta-primary" :to="faq.primaryPath">
            <Send />
            <span>{{ copy.primaryAction }}</span>
            <ArrowRight />
          </LocalizedLink>
          <LocalizedLink class="faq-cta-secondary" :to="faq.secondaryPath">
            <span>{{ copy.secondaryAction }}</span>
          </LocalizedLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.faq-page {
  background: #f5f7f8;
}

.faq-hero {
  min-height: 250px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #d9e5e3;
  background: #eef6f5;
}

.faq-hero-inner {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 54px 0 62px;
}

.faq-hero-inner > p:first-child {
  margin: 0 0 14px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.faq-hero h1 {
  max-width: 760px;
  margin: 0;
  color: #102f3b;
  font-size: clamp(38px, 5vw, 62px);
  font-weight: 800;
  line-height: 1.08;
}

.faq-hero h1 span {
  color: #f7ae2b;
}

.faq-hero-rule {
  width: 72px;
  height: 3px;
  margin: 22px 0;
  background: #0fa295;
}

.faq-hero-inner > p:last-child {
  max-width: 720px;
  margin: 0;
  color: #526b76;
  font-size: 16px;
  line-height: 1.8;
}

.faq-page-content {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 46px 0 64px;
}

.faq-status {
  border-left: 3px solid #0f766e;
  padding: 16px 18px;
  background: #ffffff;
  color: #526476;
}

.faq-status.error {
  border-left-color: #c2410c;
}

.faq-status button {
  margin-left: 14px;
  border: 0;
  background: transparent;
  color: #0f766e;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.faq-cta-band {
  border-top: 1px solid #27495a;
  background: #0c2c3c;
  color: #ffffff;
}

.faq-cta-inner {
  width: min(1180px, calc(100% - 48px));
  min-height: 220px;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  align-items: center;
  gap: 22px;
  margin: 0 auto;
  padding: 42px 0;
}

.faq-cta-mark {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border: 1px solid #347080;
  border-radius: 6px;
  background: #103b4b;
  color: #85ddd2;
}

.faq-cta-mark svg {
  width: 26px;
}

.faq-cta-copy h2,
.faq-cta-copy p {
  margin: 0;
}

.faq-cta-copy h2 {
  font-size: 25px;
}

.faq-cta-copy p {
  max-width: 650px;
  margin-top: 9px;
  color: #bdd0d9;
  font-size: 14px;
  line-height: 1.7;
}

.faq-cta-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.faq-cta-actions a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 5px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 750;
  text-decoration: none;
}

.faq-cta-actions svg {
  width: 17px;
}

.faq-cta-primary {
  background: #f59e0b;
  color: #2b1a00;
}

.faq-cta-secondary {
  border: 1px solid #567686;
  color: #ffffff;
}

.faq-cta-actions a:hover {
  transform: translateY(-1px);
}

@media (max-width: 860px) {
  .faq-cta-inner {
    grid-template-columns: 54px minmax(0, 1fr);
  }

  .faq-cta-actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .faq-hero {
    min-height: 230px;
  }

  .faq-hero-inner,
  .faq-page-content,
  .faq-cta-inner {
    width: min(100% - 28px, 1180px);
  }

  .faq-hero-inner {
    padding: 44px 0;
  }

  .faq-hero h1 {
    font-size: 38px;
  }

  .faq-page-content {
    padding: 32px 0 44px;
  }

  .faq-cta-inner {
    grid-template-columns: 1fr;
  }

  .faq-cta-actions {
    grid-column: auto;
    align-items: stretch;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .faq-cta-actions a:hover {
    transform: none;
  }
}
</style>
