<script setup lang="ts">
import ProductsView from '../../../../views/ProductsView.vue'

const route = useRoute()
const categorySlug = computed(() => String(route.params.categorySlug || ''))
const { data, category, query, hot, sort } = await useProductCatalogPage({ category: categorySlug })
</script>

<template>
  <ProductsView
    :initial-categories="data?.categories"
    :initial-products="data?.products"
    :initial-category="category || 'all'"
    :initial-query="query"
    :initial-hot="hot"
    :initial-sort="sort"
  />
</template>
