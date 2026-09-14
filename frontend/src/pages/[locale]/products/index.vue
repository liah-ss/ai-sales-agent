<script setup lang="ts">
import ProductsView from '../../../views/ProductsView.vue'

const route = useRoute()
const legacyCategory = String(route.query.category || '')
if (legacyCategory) {
  const query = { ...route.query }
  delete query.category
  await navigateTo({
    path: `/${String(route.params.locale)}/products/category/${encodeURIComponent(legacyCategory)}`,
    query,
  }, { redirectCode: 301 })
}

const { data, category, query, hot, sort } = await useProductCatalogPage()
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
