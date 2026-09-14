<script setup lang="ts">
import { computed } from 'vue'
import PrivacyPolicyContent from '../components/legal/PrivacyPolicyContent.vue'
import { useI18n } from '../composables/useI18n'
import { privacyPolicyContent } from '../data/privacyPolicyContent'

const { locale, t } = useI18n()
const policy = computed(() => privacyPolicyContent[locale.value])
</script>

<template>
  <section class="privacy-policy-page">
    <div class="privacy-policy-shell">
      <p class="privacy-breadcrumb">
        <LocalizedLink to="/">{{ t('nav.home') }}</LocalizedLink>
        <span aria-hidden="true">/</span>
        <span>{{ policy.title }}</span>
      </p>

      <header class="privacy-policy-header">
        <h1>{{ policy.title }}</h1>
        <p>{{ policy.effectiveDate }}</p>
      </header>

      <PrivacyPolicyContent :document="policy" />
    </div>
  </section>
</template>

<style scoped>
.privacy-policy-page {
  min-height: 720px;
  padding: 42px 0 88px;
  background: #f7f9fb;
}

.privacy-policy-shell {
  width: min(920px, calc(100% - 48px));
  margin: 0 auto;
}

.privacy-breadcrumb {
  margin: 0 0 28px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c7b89;
  font-size: 14px;
  font-weight: 750;
}

.privacy-breadcrumb a {
  color: #1f6d86;
}

.privacy-policy-header {
  margin-bottom: 34px;
  padding-bottom: 28px;
  border-bottom: 2px solid #1f6d86;
}

.privacy-policy-header h1 {
  margin: 0;
  color: #151c25;
  font-size: 38px;
  line-height: 1.25;
  letter-spacing: 0;
}

.privacy-policy-header p {
  margin: 12px 0 0;
  color: #647382;
  font-size: 15px;
  font-weight: 750;
}

@media (max-width: 640px) {
  .privacy-policy-page {
    padding: 28px 0 60px;
  }

  .privacy-policy-shell {
    width: min(100% - 28px, 920px);
  }

  .privacy-breadcrumb {
    margin-bottom: 22px;
  }

  .privacy-policy-header {
    margin-bottom: 26px;
    padding-bottom: 22px;
  }

  .privacy-policy-header h1 {
    font-size: 30px;
  }
}
</style>
