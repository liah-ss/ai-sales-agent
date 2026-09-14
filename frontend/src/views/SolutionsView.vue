<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import { ImageIcon } from '@lucide/vue'
import { useRoute } from 'vue-router'
import { resolveOptimizedAssetUrl } from '../api/client'
import ManagedContentBlocks from '../components/common/ManagedContentBlocks.vue'
import { useI18n } from '../composables/useI18n'
import { useWebsiteConfig } from '../composables/useWebsiteConfig'
import { useLocalizedContent } from '../data/localizedContent'
import type { SolutionSummary } from '../types/catalog'

const props = defineProps<{
  initialSolutions: SolutionSummary[]
}>()

const route = useRoute()
const { locale, t } = useI18n()
const { text, localizeSolution } = useLocalizedContent()

const solutions = computed(() => props.initialSolutions)
const activeSlug = shallowRef(props.initialSolutions[0]?.slug ?? '')
const { pageConfig } = useWebsiteConfig()
const solutionPageConfig = pageConfig('solution')
const activeSolution = computed(() => solutions.value.find((solution) => solution.slug === activeSlug.value) ?? solutions.value[0])
const localizedSolutions = computed(() => solutions.value.map(localizeSolution))
const localizedActiveSolution = computed(() => activeSolution.value ? localizeSolution(activeSolution.value) : undefined)
const hiddenManagedBlockIds = new Set(['solution-context', 'solution-architecture', 'solution-outcome'])
const visibleManagedBlocks = computed(() =>
  solutionPageConfig.value?.blocks.filter(block => !hiddenManagedBlockIds.has(block.id)) ?? [],
)
const solutionHeroStyle = computed(() => {
  const heroImage = resolveOptimizedAssetUrl(solutionPageConfig.value?.heroImageUrl, { width: 1600 })
  if (!heroImage) return undefined
  return {
    backgroundImage: `linear-gradient(90deg, rgba(248, 250, 252, 0.78), rgba(248, 250, 252, 0.34)), url('${heroImage}')`,
    backgroundPosition: 'center, center',
    backgroundRepeat: 'no-repeat, no-repeat',
    backgroundSize: 'cover, cover',
  }
})
const activeSolutionImage = computed(() => activeSolution.value ? solutionImage(activeSolution.value) : '')

function solutionImage(_solution: SolutionSummary) {
  return ''
}

function readQueryValue(value: unknown) {
  if (Array.isArray(value)) return value[0] ?? ''
  return typeof value === 'string' ? value : ''
}

function normalizeSolutionSlug(slug: string) {
  if (!slug) return solutions.value[0]?.slug ?? ''
  return solutions.value.some((solution) => solution.slug === slug) ? slug : solutions.value[0]?.slug ?? ''
}

function applyRouteSolution() {
  activeSlug.value = normalizeSolutionSlug(readQueryValue(route.query.solution))
}

onMounted(() => {
  applyRouteSolution()
})

watch(() => route.query.solution, () => {
  if (solutions.value.length) applyRouteSolution()
})
</script>

<template>
  <div class="solutions-page">
    <section
      class="page-hero managed-page-hero"
      :style="solutionHeroStyle"
    >
      <p class="breadcrumb">{{ t('solutions.breadcrumb') }}</p>
      <h1>{{ solutionPageConfig?.headline ?? text('pages.solution.headline', t('solutions.title')) }}</h1>
      <p>{{ solutionPageConfig?.summary ?? text('pages.solution.summary', t('solutions.subtitle')) }}</p>
    </section>

    <section v-if="localizedActiveSolution" class="scenario-detail-shell solution-scenario-module">
      <aside class="scenario-directory" :aria-label="t('solutions.directory')">
        <div class="scenario-directory-heading">
          <strong>{{ t('solutions.directory') }}</strong>
          <small aria-hidden="true">{{ String(localizedSolutions.length).padStart(2, '0') }}</small>
        </div>
        <div class="scenario-directory-list">
          <LocalizedLink
            v-for="(solution, index) in localizedSolutions"
            :key="solution.slug"
            :aria-current="activeSlug === solution.slug ? 'page' : undefined"
            :class="{ active: activeSlug === solution.slug }"
            :to="`/solutions/${solution.slug}`"
          >
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <em>{{ solution.title }}</em>
          </LocalizedLink>
        </div>
      </aside>

      <div class="scenario-detail-main">
        <section class="scenario-hero-card">
          <div class="scenario-hero-copy">
            <h2>{{ localizedActiveSolution.title }}</h2>
            <p>{{ localizedActiveSolution.summary }}</p>
            <div class="solution-hero-actions">
              <LocalizedLink class="button primary" :to="`/solutions/${localizedActiveSolution.slug}`">{{ t('solutions.viewFullSolution') }}</LocalizedLink>
              <LocalizedLink class="button secondary" :to="`/contact?solution=${localizedActiveSolution.slug}`">{{ t('solutions.startProject') }}</LocalizedLink>
            </div>
          </div>
          <div class="solution-main-media">
            <img
              v-if="activeSolutionImage"
              class="solution-main-image"
              :src="activeSolutionImage"
              :alt="localizedActiveSolution.title"
            />
            <div v-else class="scenario-empty-image">
              <ImageIcon />
              <span>{{ t('solutions.scenarioImage') }}</span>
            </div>
            <span>{{ t('solutions.sceneSolution') }}</span>
          </div>
        </section>


      </div>
    </section>

    <ManagedContentBlocks :blocks="visibleManagedBlocks" />

    <section v-if="localizedActiveSolution" class="cta-band">
      <h2>{{ t('solutions.ctaTitle') }}</h2>
      <p>{{ t('solutions.ctaCopy') }}</p>
      <div class="hero-actions">
        <LocalizedLink class="button primary" :to="`/contact?solution=${localizedActiveSolution.slug}`">{{ t('solutions.startProject') }}</LocalizedLink>
        <LocalizedLink class="button secondary ghost" to="/contact">{{ t('common.contactSales') }}</LocalizedLink>
      </div>
    </section>
  </div>
</template>
