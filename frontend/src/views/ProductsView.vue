<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { Search } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'
import { getCategories, getProducts } from '../api/catalog'
import type { CategoryTree } from '../api/catalog'
import { resolveOptimizedAssetUrl } from '../api/client'
import StatusPanel from '../components/common/StatusPanel.vue'
import PaginationControls from '../components/common/PaginationControls.vue'
import ProductCard from '../components/product/ProductCard.vue'
import { useI18n } from '../composables/useI18n'
import { useWebsiteConfig } from '../composables/useWebsiteConfig'
import { useLocalizedContent } from '../data/localizedContent'
import type { ProductListResponse, ProductSummary } from '../types/catalog'
import { localizePath } from '../utils/localeRouting'

const props = defineProps<{
  initialCategories?: CategoryTree[]
  initialProducts?: ProductListResponse | null
  initialCategory?: string
  initialQuery?: string
  initialHot?: boolean
  initialSort?: 'default' | 'name_asc' | 'name_desc'
}>()

const ALL_CATEGORY = 'all'
const PRODUCT_PAGE_SIZE = 24

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const { localizedCategory } = useLocalizedContent()
const { pageConfig } = useWebsiteConfig()
const productPageConfig = pageConfig('product')
const productHeroHeadline = computed(() => {
  const categoryPathLabel = selectedCategoryPath.value.map(category => localizedCategory(category).name).join(' · ')
  const categoryPrefix = activeCategorySlug.value !== ALL_CATEGORY && categoryPathLabel
    ? `${categoryPathLabel} · `
    : ''
  if (locale.value === 'en') {
    return categoryPrefix + (productPageConfig.value?.headlineTranslations?.en
      || productPageConfig.value?.headline
      || t('products.title'))
  }
  return categoryPrefix + (productPageConfig.value?.headlineTranslations?.[locale.value] || t('products.title'))
})
const productHeroSummary = computed(() => {
  if (locale.value === 'en') {
    return productPageConfig.value?.summaryTranslations?.en
      || productPageConfig.value?.summary
      || t('products.subtitle')
  }
  return productPageConfig.value?.summaryTranslations?.[locale.value] || t('products.subtitle')
})

const activeCategorySlug = shallowRef(props.initialCategory || ALL_CATEGORY)
const query = shallowRef(props.initialQuery || '')
const searchInput = shallowRef(props.initialQuery || '')
const hotOnly = shallowRef(Boolean(props.initialHot))
const sortMode = shallowRef<'default' | 'name_asc' | 'name_desc'>(props.initialSort || 'default')
const categories = ref<CategoryTree[]>(props.initialCategories ?? [])
const flatCategories = computed(() => flattenCategoryTree(categories.value))
const products = ref<ProductSummary[]>(props.initialProducts?.items ?? [])
const totalProducts = shallowRef(props.initialProducts?.total ?? 0)
const isLoading = shallowRef(!props.initialProducts)
const error = shallowRef('')
const selectedProductSlugs = shallowRef<Set<string>>(new Set())
let productRequestId = 0

const rootCategories = computed(() => {
  return categories.value
    .filter(category => category.parent_id == null)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
})
const selectedRootCategory = computed(() => {
  if (activeCategorySlug.value === ALL_CATEGORY) return null
  const selected = flatCategories.value.find(category => category.slug === activeCategorySlug.value)
  if (!selected) return null
  if (selected.parent_id == null) return selected
  return rootCategories.value.find(category => category.id === selected.parent_id) ?? null
})
const selectedCategory = computed(() => {
  if (activeCategorySlug.value === ALL_CATEGORY) return null
  return flatCategories.value.find(category => category.slug === activeCategorySlug.value) ?? null
})
const selectedCategoryPath = computed(() => {
  const root = selectedRootCategory.value
  const selected = selectedCategory.value
  if (!root || !selected) return []
  if (root.slug === selected.slug) return [root]
  return [root, selected]
})
const visibleSubcategories = computed(() => {
  const root = selectedRootCategory.value
  return root ? categoryChildren(root) : []
})
const selectedCategoryLabel = computed(() => {
  if (activeCategorySlug.value === ALL_CATEGORY) return t('products.allCategories')
  const category = flatCategories.value.find(item => item.slug === activeCategorySlug.value)
  return category ? localizedCategory(category).name : t('products.allCategories')
})
const selectedProductCount = computed(() => selectedProductSlugs.value.size)
const canSubmitSelectedInquiry = computed(() => selectedProductCount.value > 0)
const currentPage = computed(() => {
  const value = readQueryValue(route.params.page || route.query.page)
  const page = Number(value || 1)
  return Number.isInteger(page) && page > 0 ? page : 1
})
const productPageSuffix = computed(() => currentPage.value > 1
  ? ({ 'zh-CN': ` · 第 ${currentPage.value} 页`, en: ` · Page ${currentPage.value}`, id: ` · Halaman ${currentPage.value}` })[locale.value]
  : '')
const totalPages = computed(() => Math.max(1, Math.ceil(totalProducts.value / PRODUCT_PAGE_SIZE)))
const productHeroStyle = computed(() => {
  const heroImage = resolveOptimizedAssetUrl(productPageConfig.value?.heroImageUrl, { width: 1600 })
  if (!heroImage) return undefined
  return {
    backgroundImage: `linear-gradient(90deg, rgba(248, 250, 252, 0.78), rgba(248, 250, 252, 0.34)), url('${heroImage}')`,
    backgroundPosition: 'center, center',
    backgroundRepeat: 'no-repeat, no-repeat',
    backgroundSize: 'cover, cover',
  }
})

async function loadProducts() {
  const requestId = ++productRequestId
  isLoading.value = true
  products.value = []
  error.value = ''
  try {
    const response = await getProducts({
      category: activeCategorySlug.value === ALL_CATEGORY ? undefined : activeCategorySlug.value,
      q: query.value.trim() || undefined,
      hot: hotOnly.value || undefined,
      sort: sortMode.value,
      page: currentPage.value,
      pageSize: PRODUCT_PAGE_SIZE,
    })
    if (requestId !== productRequestId) return
    products.value = response.items
    totalProducts.value = response.total
    const lastPage = Math.max(1, Math.ceil(response.total / PRODUCT_PAGE_SIZE))
    if (currentPage.value > lastPage) {
      const basePath = route.path.replace(/\/page\/\d+\/?$/, '')
      await router.replace(lastPage === 1 ? basePath : `${basePath}/page/${lastPage}`)
    }
  } catch {
    if (requestId === productRequestId) error.value = t('products.error')
  } finally {
    if (requestId === productRequestId) isLoading.value = false
  }
}

async function loadCatalog() {
  isLoading.value = true
  error.value = ''
  try {
    categories.value = await getCategories()
    await applyRouteFilters()
    await loadProducts()
  } catch {
    error.value = t('products.catalogError')
    isLoading.value = false
  }
}

function readQueryValue(value: unknown) {
  if (Array.isArray(value)) return value[0] ?? ''
  return typeof value === 'string' ? value : ''
}

function flattenCategoryTree(items: CategoryTree[]): CategoryTree[] {
  const result: CategoryTree[] = []
  const stack = [...items]
  while (stack.length) {
    const item = stack.shift()!
    result.push(item)
    if (item.children?.length) stack.unshift(...item.children)
  }
  return result
}

function normalizeCategorySlug(slug: string) {
  if (!slug || slug === ALL_CATEGORY) return ALL_CATEGORY
  return flatCategories.value.some((category) => category.slug === slug) ? slug : ALL_CATEGORY
}

async function replaceFilters(next: { category?: string; q?: string; hot?: boolean; sort?: typeof sortMode.value }) {
  const nextCategory = next.category ?? activeCategorySlug.value
  const nextQueryText = next.q ?? query.value
  const nextHotOnly = next.hot ?? hotOnly.value
  const nextSortMode = next.sort ?? sortMode.value
  const nextQuery = { ...route.query }

  delete nextQuery.category
  delete nextQuery.q
  delete nextQuery.hot
  delete nextQuery.sort
  delete nextQuery.page

  if (nextQueryText.trim()) nextQuery.q = nextQueryText.trim()
  if (nextHotOnly) nextQuery.hot = '1'
  if (nextSortMode !== 'default') nextQuery.sort = nextSortMode

  await router.replace({
    path: localizePath(categoryPath(nextCategory), locale.value),
    query: nextQuery,
  })
}

async function applyRouteFilters() {
  const routeCategory = readQueryValue(route.params.categorySlug) || readQueryValue(route.query.category)
  const normalizedCategory = normalizeCategorySlug(routeCategory)
  const routeQuery = readQueryValue(route.query.q).trim()
  const routeHot = readQueryValue(route.query.hot)
  const routeSort = readQueryValue(route.query.sort)
  const normalizedSort = routeSort === 'name_asc' || routeSort === 'name_desc' ? routeSort : 'default'
  const normalizedHot = routeHot === '1' || routeHot === 'true'

  if (routeCategory && routeCategory !== normalizedCategory) {
    await replaceFilters({ category: normalizedCategory, q: routeQuery })
    return false
  }

  activeCategorySlug.value = normalizedCategory
  query.value = routeQuery
  searchInput.value = routeQuery
  hotOnly.value = normalizedHot
  sortMode.value = normalizedSort
  return true
}

function categoryPath(slug: string) {
  return slug === ALL_CATEGORY ? '/products' : `/products/category/${slug}`
}

function parentCategorySlug(slug: string) {
  const category = flatCategories.value.find(item => item.slug === slug)
  if (category?.parent_id == null) return ALL_CATEGORY
  return flatCategories.value.find(item => item.id === category.parent_id)?.slug ?? ALL_CATEGORY
}

async function refreshFromRoute() {
  if (!categories.value.length) return
  const applied = await applyRouteFilters()
  if (applied) await loadProducts()
}

function categoryChildren(category: CategoryTree) {
  return category.children?.length
    ? category.children
    : categories.value.filter(item => item.parent_id === category.id)
}

function submitSearch() {
  void replaceFilters({ q: searchInput.value })
}

function clearFilters() {
  query.value = ''
  searchInput.value = ''
  hotOnly.value = false
  sortMode.value = 'default'
  void replaceFilters({ category: ALL_CATEGORY, q: '', hot: false, sort: 'default' })
}

function toggleHotOnly() {
  hotOnly.value = !hotOnly.value
  void replaceFilters({ q: query.value, hot: hotOnly.value })
}

function setSortMode(mode: 'default' | 'name_asc' | 'name_desc') {
  sortMode.value = mode
  void replaceFilters({ q: query.value, sort: mode })
}

function handleSortChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'name_asc' || value === 'name_desc') {
    setSortMode(value)
    return
  }
  setSortMode('default')
}

function isProductSelected(slug: string) {
  return selectedProductSlugs.value.has(slug)
}

function toggleProductSelection(slug: string) {
  const next = new Set(selectedProductSlugs.value)
  if (next.has(slug)) next.delete(slug)
  else next.add(slug)
  selectedProductSlugs.value = next
}

function clearSelectedProducts() {
  selectedProductSlugs.value = new Set()
}

function submitSelectedInquiry() {
  if (!selectedProductSlugs.value.size) return
  void router.push({
    path: localizePath('/contact', locale.value),
    query: {
      products: Array.from(selectedProductSlugs.value).join(','),
    },
  })
}

onMounted(() => {
  if (!props.initialProducts) void loadCatalog()
})

watch(() => [route.params.categorySlug, route.params.page, route.query.category, route.query.q, route.query.hot, route.query.sort], () => {
  void refreshFromRoute()
})
</script>

<template>
  <div class="products-page">
    <section class="page-hero managed-page-hero managed-hero-image" :style="productHeroStyle">
      <div class="page-hero-inner">
        <p class="breadcrumb">{{ t('products.breadcrumb') }}</p>
        <h1>{{ productHeroHeadline }}{{ productPageSuffix }}</h1>
        <p>{{ productHeroSummary }}</p>
      </div>
    </section>

    <section class="catalog-panel">
      <div class="catalog-category-directory">
        <div class="catalog-path-row">
          <LocalizedLink class="catalog-path-home" to="/products">
            {{ t('products.allCategories') }}
          </LocalizedLink>
          <template v-for="category in selectedCategoryPath" :key="category.slug">
            <span class="catalog-path-separator">›</span>
            <div class="catalog-path-chip">
              <LocalizedLink class="catalog-path-chip-label" :to="categoryPath(category.slug)">
                {{ localizedCategory(category).name }}
              </LocalizedLink>
              <LocalizedLink
                class="catalog-path-chip-remove"
                :to="categoryPath(parentCategorySlug(category.slug))"
                :aria-label="t('products.removeCategoryFilter')"
              >×</LocalizedLink>
            </div>
          </template>
        </div>

        <div class="catalog-filter-table">
          <div class="catalog-filter-row">
            <strong>{{ t('products.category') }}</strong>
            <div class="catalog-filter-options">
              <LocalizedLink
                class="catalog-category-option"
                :class="{ active: activeCategorySlug === ALL_CATEGORY }"
                :aria-current="activeCategorySlug === ALL_CATEGORY ? 'page' : undefined"
                to="/products"
              >
                {{ t('products.allCategories') }}
              </LocalizedLink>
              <LocalizedLink
                v-for="category in rootCategories"
                :key="category.slug"
                class="catalog-category-option"
                :class="{ active: selectedRootCategory?.slug === category.slug }"
                :aria-current="selectedRootCategory?.slug === category.slug ? 'page' : undefined"
                :to="categoryPath(category.slug)"
              >
                {{ localizedCategory(category).name }}
              </LocalizedLink>
            </div>
          </div>

          <div v-if="visibleSubcategories.length" class="catalog-filter-row">
            <strong>{{ selectedRootCategory ? localizedCategory(selectedRootCategory).name : t('products.category') }}</strong>
            <div class="catalog-filter-options">
              <LocalizedLink
                v-for="child in visibleSubcategories"
                :key="child.slug"
                class="catalog-category-option"
                :class="{ active: activeCategorySlug === child.slug }"
                :aria-current="activeCategorySlug === child.slug ? 'page' : undefined"
                :to="categoryPath(child.slug)"
              >
                {{ localizedCategory(child).name }}
              </LocalizedLink>
            </div>
          </div>
        </div>
      </div>

      <div class="catalog-toolbar">
        <div class="catalog-filters">
          <div class="catalog-search" role="search">
            <input
              v-model="searchInput"
              class="search-input"
              :placeholder="t('products.searchPlaceholder')"
            />
            <button class="catalog-search-button" type="button" @click="submitSearch">
              <Search aria-hidden="true" />
              <span>{{ t('products.search') }}</span>
            </button>
          </div>
          <button :class="{ active: hotOnly }" class="filter-chip" type="button" @click="toggleHotOnly">
            {{ t('products.hotOnly') }}
          </button>
          <button class="filter-chip secondary" type="button" @click="clearFilters">
            {{ t('products.clearAll') }}
          </button>
        </div>

        <div class="catalog-toolbar-meta">
          <div class="catalog-stats">
            <span>
              {{ isLoading ? t('products.loadingProducts') : t('products.totalProducts', '', { count: String(totalProducts) }) }}
            </span>
          </div>
          <label class="catalog-sort">
            <span>{{ t('products.sort') }}</span>
            <select :value="sortMode" @change="handleSortChange">
              <option value="default">{{ t('products.default') }}</option>
              <option value="name_asc">{{ t('products.nameAsc') }}</option>
              <option value="name_desc">{{ t('products.nameDesc') }}</option>
            </select>
          </label>
        </div>
      </div>

      <div class="filter-summary">
        <span v-if="activeCategorySlug !== ALL_CATEGORY">
          {{ t('products.category') }}:
          {{ selectedCategoryLabel }}
        </span>
        <span v-if="query">{{ t('products.search') }}: "{{ query }}"</span>
        <span v-if="hotOnly">{{ t('products.hotProductsOnly') }}</span>
      </div>
    </section>

    <section class="content-section compact product-results-panel">
      <StatusPanel
        v-if="isLoading"
        variant="loading"
        :title="t('products.loadingTitle')"
        :message="t('products.loadingMessage')"
      />
      <StatusPanel
        v-else-if="error"
        variant="error"
        :title="error"
        :message="t('products.errorMessage')"
        :action-label="t('common.retry')"
        @action="loadCatalog"
      />
      <template v-else-if="products.length">
        <div class="product-grid">
          <ProductCard
            v-for="product in products"
            :key="product.slug"
            :product="product"
            selectable
            :selected="isProductSelected(product.slug)"
            @toggle-select="toggleProductSelection"
          />
        </div>
        <PaginationControls
          v-if="totalPages > 1"
          :current-page="currentPage"
          :total-pages="totalPages"
          :label="t('products.pagination')"
          :previous-label="t('products.previousPage')"
          :next-label="t('products.nextPage')"
          :page-label="t('products.pageNumber', '', { page: '{page}' })"
        />
      </template>
      <StatusPanel
        v-else
        variant="empty"
        :title="t('products.emptyTitle')"
        :message="t('products.emptyMessage')"
        :action-label="t('products.clearFilters')"
        @action="clearFilters"
      />
    </section>

    <section class="selected-inquiry-bar" :aria-label="t('products.selectedInquiryLabel')">
      <div>
        <strong>{{ t('products.selectedCount', '', { count: String(selectedProductCount) }) }}</strong>
        <span>{{ t('products.selectedHint') }}</span>
      </div>
      <button class="filter-chip secondary" type="button" :disabled="!selectedProductCount" @click="clearSelectedProducts">
        {{ t('products.clearSelected') }}
      </button>
      <button class="button primary" type="button" :disabled="!canSubmitSelectedInquiry" @click="submitSelectedInquiry">
        {{ t('products.inquireSelected') }}
      </button>
    </section>
  </div>
</template>
