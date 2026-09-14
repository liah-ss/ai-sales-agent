<script setup lang="ts">
import type { ContentLocale, TranslationMeta } from '../../types/catalog'

defineProps<{
  englishStatus?: TranslationMeta['status']
}>()

const model = defineModel<ContentLocale>({ required: true })

const options: Array<{ locale: ContentLocale, label: string }> = [
  { locale: 'zh-CN', label: '中文' },
  { locale: 'id', label: 'Bahasa Indonesia' },
  { locale: 'en', label: 'English' },
]
</script>

<template>
  <nav class="locale-tabs" aria-label="内容语言">
    <button
      v-for="option in options"
      :key="option.locale"
      class="locale-tab"
      :class="{ active: model === option.locale }"
      type="button"
      @click="model = option.locale"
    >
      <span>{{ option.label }}</span>
      <i
        v-if="option.locale === 'en'"
        class="translation-status-dot"
        :class="englishStatus ?? 'missing'"
        aria-hidden="true"
      ></i>
    </button>
  </nav>
</template>

<style scoped>
.locale-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid #dbe3ec;
  border-radius: 8px;
  background: #f5f7fa;
}

.locale-tab {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #52606d;
  font-weight: 700;
  cursor: pointer;
}

.locale-tab.active {
  background: #ffffff;
  color: #0f4c81;
  box-shadow: 0 1px 3px rgba(15, 76, 129, 0.12);
}

.translation-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9aa5b1;
}

.translation-status-dot.current { background: #138a5b; }
.translation-status-dot.stale { background: #c27a08; }
.translation-status-dot.failed { background: #c83b3b; }
</style>
