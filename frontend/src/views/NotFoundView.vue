<script setup lang="ts">
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()
</script>

<template>
  <section class="page-panel">
    <h1>{{ t('notFound.title') }}</h1>
    <LocalizedLink class="button primary" to="/">{{ t('notFound.backHome') }}</LocalizedLink>
  </section>
</template>
