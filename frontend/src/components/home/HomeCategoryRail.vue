<script setup lang="ts">
import { Ellipsis } from '@lucide/vue'
import type { CategoryTile } from '../../types/home'

defineProps<{
  categories: CategoryTile[]
  label: string
  moreLabel: string
}>()
</script>

<template>
  <aside class="category-rail" :aria-label="label">
    <article
      v-for="category in categories"
      :key="category.slug"
      class="rail-category"
      :class="{ 'more-category': category.isMore }"
    >
      <LocalizedLink
        v-if="category.isMore"
        class="rail-category-main-button"
        to="/products"
        prefetch
      >
        <span class="rail-category-main">
          <Ellipsis class="category-more-icon" aria-hidden="true" />
          <strong>{{ moreLabel }}</strong>
        </span>
      </LocalizedLink>
      <LocalizedLink
        v-else
        class="rail-category-main-button"
        :to="`/products/category/${encodeURIComponent(category.slug)}`"
        prefetch
      >
        <span class="rail-category-main">
          <span class="category-emoji">{{ category.icon }}</span>
          <strong>{{ category.name }}</strong>
          <small>{{ category.sku }}</small>
        </span>
        <span class="rail-tags">{{ category.tags.slice(0, 3).join('  ') }}</span>
      </LocalizedLink>
      <div v-if="category.children.length" class="rail-subpanel">
        <LocalizedLink
          v-for="child in category.children"
          :key="child.slug"
          class="rail-subcategory"
          :to="`/products/category/${encodeURIComponent(child.slug)}`"
          prefetch
        >
          <strong>{{ child.name }}</strong>
          <small>{{ child.tags.slice(0, 2).join(' · ') }}</small>
        </LocalizedLink>
      </div>
    </article>
  </aside>
</template>
