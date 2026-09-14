<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { getDeliveryCases, getNews, getProducts, getSolutions } from '../api/catalog'
import ProductCard from '../components/product/ProductCard.vue'
import DeliveryCaseCard from '../components/delivery-case/DeliveryCaseCard.vue'
import NewsCard from '../components/news/NewsCard.vue'
import { useLocalizedContent } from '../data/localizedContent'
import type { DeliveryCaseSummary, NewsArticleSummary, ProductSummary, SolutionSummary } from '../types/catalog'
import { localizePath } from '../utils/localeRouting'

const maxResultCount = 5
const candidatePoolSize = 40

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const { localizeDeliveryCase, localizeNewsArticle, localizeProduct, localizeSolution } = useLocalizedContent()

const query = shallowRef('')
const products = shallowRef<ProductSummary[]>([])
const solutions = shallowRef<SolutionSummary[]>([])
const deliveryCases = shallowRef<DeliveryCaseSummary[]>([])
const newsArticles = shallowRef<NewsArticleSummary[]>([])
const isLoading = shallowRef(false)
const error = shallowRef('')
let loadSequence = 0

const resultSummary = computed(() => {
  const keyword = normalizedQuery.value || t('search.allContent')
  const count = matchedProducts.value.length
    + matchedSolutions.value.length
    + matchedDeliveryCases.value.length
    + matchedNewsArticles.value.length
  return t('search.resultSummary', '', { count: String(count), keyword })
})
const normalizedQuery = computed(() => query.value.trim().toLowerCase())
const matchedProducts = computed(() => {
  return products.value
    .map(product => {
      const localizedProduct = localizeProduct(product)
      return { item: localizedProduct, score: productScore(localizedProduct, product, normalizedQuery.value) }
    })
    .filter(entry => !normalizedQuery.value || entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.sort_order - b.item.sort_order || a.item.id - b.item.id)
})
const rankedProducts = computed(() => {
  return matchedProducts.value
    .slice(0, maxResultCount)
    .map(entry => entry.item)
})
const matchedSolutions = computed(() => {
  return solutions.value
    .map(solution => {
      const localizedSolution = localizeSolution(solution)
      return { item: localizedSolution, score: solutionScore(localizedSolution, solution, normalizedQuery.value) }
    })
    .filter(entry => !normalizedQuery.value || entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.sort_order - b.item.sort_order || a.item.id - b.item.id)
})
const rankedSolutions = computed(() => {
  return matchedSolutions.value
    .slice(0, maxResultCount)
    .map(entry => entry.item)
})
const matchedDeliveryCases = computed(() => {
  return deliveryCases.value
    .map(deliveryCase => {
      const localizedCase = localizeDeliveryCase(deliveryCase)
      return { item: localizedCase, score: deliveryCaseScore(localizedCase, deliveryCase, normalizedQuery.value) }
    })
    .filter(entry => !normalizedQuery.value || entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.sort_order - b.item.sort_order || a.item.id - b.item.id)
})
const rankedDeliveryCases = computed(() => matchedDeliveryCases.value.slice(0, maxResultCount).map(entry => entry.item))
const matchedNewsArticles = computed(() => {
  return newsArticles.value
    .map(article => {
      const localizedArticle = localizeNewsArticle(article)
      return { item: localizedArticle, score: newsScore(localizedArticle, article, normalizedQuery.value) }
    })
    .filter(entry => !normalizedQuery.value || entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.sort_order - b.item.sort_order || a.item.id - b.item.id)
})
const rankedNewsArticles = computed(() => matchedNewsArticles.value.slice(0, maxResultCount).map(entry => entry.item))

function syncQueryFromRoute() {
  const value = route.query.q
  query.value = Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function relevanceScore(fields: Array<string | null | undefined>, keyword: string) {
  if (!keyword) return 1
  const terms = normalizeSearchText(keyword).split(/\s+/).filter(Boolean)
  const normalizedFields = fields.filter(Boolean).map(field => normalizeSearchText(field ?? ''))
  let score = 0

  for (const term of terms) {
    const compactTerm = compactSearchText(term)
    const matchingFields = normalizedFields.filter(field => (
      field.includes(term) || compactSearchText(field).includes(compactTerm)
    ))
    if (!matchingFields.length) return 0
    score += 4
    if (matchingFields.some(field => field === term)) score += 12
    if (matchingFields.some(field => field.startsWith(term))) score += 8
  }
  return score
}

function normalizeSearchText(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase().trim()
}

function compactSearchText(value: string) {
  return value.replace(/[^\p{L}\p{N}]+/gu, '')
}

function productScore(localizedProduct: ProductSummary, sourceProduct: ProductSummary, keyword: string) {
  const compactKeyword = compactSearchText(normalizeSearchText(keyword))
  if (/^p\d+$/u.test(compactKeyword)) {
    return compactSearchText(normalizeSearchText(sourceProduct.product_code)) === compactKeyword ? 100 : 0
  }
  return relevanceScore([
    localizedProduct.name,
    localizedProduct.product_code,
    localizedProduct.slug,
    localizedProduct.model,
    localizedProduct.summary,
    localizedProduct.category.name,
    localizedProduct.category.slug,
    localizedProduct.tag,
    sourceProduct.name,
    sourceProduct.product_code,
    sourceProduct.slug,
    sourceProduct.model,
    sourceProduct.summary,
    sourceProduct.category.name,
    sourceProduct.category.slug,
    sourceProduct.tag,
    JSON.stringify(sourceProduct.translations),
    JSON.stringify(sourceProduct.category.translations),
  ], keyword)
}

function solutionScore(localizedSolution: SolutionSummary, sourceSolution: SolutionSummary, keyword: string) {
  return relevanceScore([
    localizedSolution.title,
    localizedSolution.summary,
    localizedSolution.icon,
    sourceSolution.title,
    sourceSolution.summary,
    sourceSolution.icon,
    ...localizedSolution.scenarios,
    ...sourceSolution.scenarios,
    JSON.stringify(sourceSolution.translations),
  ], keyword)
}

function deliveryCaseScore(localizedCase: DeliveryCaseSummary, sourceCase: DeliveryCaseSummary, keyword: string) {
  return relevanceScore([
    localizedCase.title,
    localizedCase.summary,
    localizedCase.client_name,
    localizedCase.industry,
    localizedCase.location,
    sourceCase.title,
    sourceCase.summary,
    sourceCase.client_name,
    sourceCase.industry,
    sourceCase.location,
    JSON.stringify(sourceCase.translations),
  ], keyword)
}

function newsScore(localizedArticle: NewsArticleSummary, sourceArticle: NewsArticleSummary, keyword: string) {
  return relevanceScore([
    localizedArticle.title,
    localizedArticle.summary,
    localizedArticle.source,
    sourceArticle.title,
    sourceArticle.summary,
    sourceArticle.source,
    JSON.stringify(sourceArticle.translations),
  ], keyword)
}

function openSolution(solution: SolutionSummary) {
  void router.push(localizePath(`/solutions/${solution.slug}`, locale.value))
}

function solutionIcon(solution: SolutionSummary) {
  return solution.icon || '⚡'
}

async function loadResults() {
  const currentSequence = ++loadSequence
  isLoading.value = true
  error.value = ''
  try {
    const searchQuery = query.value.trim() || undefined
    const [productResponse, solutionResponse, deliveryCaseResponse, newsResponse] = await Promise.all([
      getProducts({ q: searchQuery, pageSize: candidatePoolSize }),
      getSolutions({ q: searchQuery }),
      getDeliveryCases({ q: searchQuery, pageSize: candidatePoolSize }),
      getNews({ q: searchQuery, pageSize: candidatePoolSize }),
    ])
    if (currentSequence !== loadSequence) return
    products.value = productResponse.items
    solutions.value = solutionResponse
    deliveryCases.value = deliveryCaseResponse.items
    newsArticles.value = newsResponse.items
  } catch {
    if (currentSequence !== loadSequence) return
    error.value = t('search.error')
  } finally {
    if (currentSequence === loadSequence) isLoading.value = false
  }
}

watch(() => route.query.q, () => {
  syncQueryFromRoute()
  void loadResults()
}, { immediate: true })
</script>

<template>
  <section class="search-results-page">
    <div class="search-results-inner">
      <header class="search-results-hero">
        <p>{{ resultSummary }}</p>
      </header>

      <p v-if="error" class="search-results-alert">{{ error }}</p>
      <p v-else-if="isLoading" class="search-results-alert">{{ t('search.loading') }}</p>

      <section class="search-result-section">
        <div class="procurement-heading compact">
          <h2>{{ t('search.relatedProducts') }}</h2>
          <LocalizedLink to="/products">{{ t('search.viewMore') }}</LocalizedLink>
        </div>
        <div v-if="rankedProducts.length" class="product-grid search-card-grid">
          <ProductCard v-for="product in rankedProducts" :key="product.slug" :product="product" />
        </div>
        <div v-else class="search-results-state">
          <strong>{{ t('search.emptyProducts') }}</strong>
        </div>
      </section>

      <section class="search-result-section">
        <div class="procurement-heading compact">
          <h2>{{ t('search.relatedSolutions') }}</h2>
          <LocalizedLink to="/solutions/ev-charging-station">{{ t('search.viewMore') }}</LocalizedLink>
        </div>
        <div v-if="rankedSolutions.length" class="scenario-grid search-card-grid">
          <button
            v-for="solution in rankedSolutions"
            :key="solution.slug"
            class="scenario-card search-solution-card"
            type="button"
            @click="openSolution(solution)"
          >
            <span class="scenario-icon">{{ solutionIcon(solution) }}</span>
            <strong>{{ solution.title }}</strong>
            <small>{{ solution.summary }}</small>
          </button>
        </div>
        <div v-else class="search-results-state">
          <strong>{{ t('search.emptySolutions') }}</strong>
        </div>
      </section>

      <section class="search-result-section">
        <div class="procurement-heading compact">
          <h2>{{ t('search.relatedDeliveryCases') }}</h2>
          <LocalizedLink to="/delivery-cases">{{ t('search.viewMore') }}</LocalizedLink>
        </div>
        <div v-if="rankedDeliveryCases.length" class="news-card-grid search-news-grid">
          <DeliveryCaseCard
            v-for="deliveryCase in rankedDeliveryCases"
            :key="deliveryCase.slug"
            :delivery-case="deliveryCase"
          />
        </div>
        <div v-else class="search-results-state">
          <strong>{{ t('search.emptyDeliveryCases') }}</strong>
        </div>
      </section>

      <section class="search-result-section">
        <div class="procurement-heading compact">
          <h2>{{ t('search.relatedNews') }}</h2>
          <LocalizedLink to="/news">{{ t('search.viewMore') }}</LocalizedLink>
        </div>
        <div v-if="rankedNewsArticles.length" class="news-card-grid search-news-grid">
          <NewsCard v-for="article in rankedNewsArticles" :key="article.slug" :article="article" />
        </div>
        <div v-else class="search-results-state">
          <strong>{{ t('search.emptyNews') }}</strong>
        </div>
      </section>

      <nav class="search-results-actions" :aria-label="t('search.actionsLabel')">
        <LocalizedLink class="mode-action filled search-action-button" to="/products">{{ t('search.productsCenter') }}</LocalizedLink>
        <LocalizedLink class="mode-action outline search-action-button" to="/solutions/ev-charging-station">{{ t('search.solutionsCenter') }}</LocalizedLink>
        <LocalizedLink class="mode-action outline search-action-button" to="/delivery-cases">{{ t('search.deliveryCasesCenter') }}</LocalizedLink>
        <LocalizedLink class="mode-action outline search-action-button" to="/news">{{ t('search.newsCenter') }}</LocalizedLink>
      </nav>
    </div>
  </section>
</template>
