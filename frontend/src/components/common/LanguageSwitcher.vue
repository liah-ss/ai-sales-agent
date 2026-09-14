<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n, type Locale } from '../../composables/useI18n'
import { localizePath } from '../../utils/localeRouting'

const props = withDefaults(defineProps<{
  languages: string[]
  compact?: boolean
}>(), {
  compact: false,
})

const emit = defineEmits<{
  change: [locale: Locale]
}>()

const { locale, setLocale, languageLabel, languageOptions } = useI18n()
const route = useRoute()
const router = useRouter()

const options = computed(() => languageOptions(props.languages))

function chooseLocale(language: Locale) {
  setLocale(language)
  const localizedPath = localizePath(route.path, language)
  if (localizedPath !== route.path) {
    void router.push({ path: localizedPath, query: route.query, hash: route.hash })
  }
  emit('change', language)
}
</script>

<template>
  <div class="language-switcher" :class="{ compact }">
    <button
      v-for="language in options"
      :key="language"
      class="language-pill"
      :class="{ active: locale === language }"
      type="button"
      @click="chooseLocale(language)"
    >
      {{ languageLabel(language) }}
    </button>
  </div>
</template>
