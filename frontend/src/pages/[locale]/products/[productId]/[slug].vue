<script setup lang="ts">
import type { Product } from '../../../../types/catalog'
import { useI18n } from '../../../../composables/useI18n'
import { localizePath } from '../../../../utils/localeRouting'
import { publicProductPath } from '../../../../utils/productUrl'

const route = useRoute()
const productId = String(route.params.productId)
const { locale, t } = useI18n()
const apiHeaders = useApiRequestHeaders()

if (!/^\d+$/.test(productId)) {
  throw createError({ statusCode: 404, statusMessage: t('detail.notFound') })
}

const { data: product, error } = await useFetch<Product>(`/api/products/p-id-${productId}`, {
  key: `legacy-product-${productId}`,
  headers: apiHeaders,
})

if (error.value || !product.value) {
  throw createError({ statusCode: 404, statusMessage: t('detail.notFound') })
}

await navigateTo(localizePath(publicProductPath(product.value), locale.value), {
  redirectCode: 301,
  replace: true,
})
</script>

<template>
  <div />
</template>
