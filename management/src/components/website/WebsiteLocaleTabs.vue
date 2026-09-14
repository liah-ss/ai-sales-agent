<script setup lang="ts">
import type { WebsiteLocale } from '../../types/websiteConfig'

const model = defineModel<WebsiteLocale>({ required: true })

const options: Array<{ locale: WebsiteLocale, label: string }> = [
  { locale: 'zh-CN', label: '中文' },
  { locale: 'id', label: 'Bahasa Indonesia' },
  { locale: 'en', label: 'English' },
]
</script>

<template>
  <nav class="website-locale-tabs" aria-label="网站内容语言">
    <button
      v-for="option in options"
      :key="option.locale"
      class="website-locale-tab"
      :class="{ active: model === option.locale }"
      type="button"
      @click="model = option.locale"
    >
      {{ option.label }}
    </button>
  </nav>
</template>

<style scoped>
.website-locale-tabs {
  width: fit-content;
  display: flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid #dbe3ec;
  border-radius: 8px;
  background: #f5f7fa;
}

.website-locale-tab {
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #52606d;
  font-weight: 700;
  cursor: pointer;
}

.website-locale-tab.active {
  background: #fff;
  color: #0f4c81;
  box-shadow: 0 1px 3px rgba(15, 76, 129, 0.12);
}

.website-locale-tab:focus-visible {
  outline: 2px solid #0f4c81;
  outline-offset: 2px;
}
</style>
