<script setup lang="ts">
import { Search } from '@lucide/vue'

defineProps<{
  placeholder: string
  actionLabel: string
}>()

const model = defineModel<string>({ default: '' })

const emit = defineEmits<{
  submit: [query: string]
}>()

function submitSearch() {
  emit('submit', model.value.trim())
}
</script>

<template>
  <form class="home-search-box" role="search" @submit.prevent="submitSearch">
    <input
      v-model="model"
      type="search"
      :placeholder="placeholder"
      autocomplete="off"
    />
    <button type="submit">
      <Search class="home-search-icon" />
      <span>{{ actionLabel }}</span>
    </button>
  </form>
</template>
