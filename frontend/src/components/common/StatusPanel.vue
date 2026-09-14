<script setup lang="ts">
import { AlertTriangle, CircleCheck, LoaderCircle, SearchX } from '@lucide/vue'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'loading' | 'error' | 'empty' | 'success'
  title: string
  message?: string
  actionLabel?: string
}>(), {
  variant: 'empty',
  message: '',
  actionLabel: '',
})

defineEmits<{
  action: []
}>()

const icon = computed(() => {
  if (props.variant === 'loading') return LoaderCircle
  if (props.variant === 'error') return AlertTriangle
  if (props.variant === 'success') return CircleCheck
  return SearchX
})
</script>

<template>
  <div :class="['status-panel', `status-panel-${variant}`]" role="status">
    <component :is="icon" class="status-icon" />
    <h2>{{ title }}</h2>
    <p v-if="message">{{ message }}</p>
    <button v-if="actionLabel" class="button secondary" type="button" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>
