<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { ChevronLeft, ChevronRight, ImageIcon } from '@lucide/vue'
import { resolveAssetUrl, resolveResponsiveAsset } from '../api/client'
import RichContent from '../components/common/RichContent.vue'
import SolutionDocumentSections from '../components/common/SolutionDocumentSections.vue'
import SeoGeoEvidence from '../components/common/SeoGeoEvidence.vue'
import { useI18n } from '../composables/useI18n'
import { useLocalizedContent } from '../data/localizedContent'
import type { Solution, SolutionSummary } from '../types/catalog'

const props = defineProps<{
  initialSolution?: Solution | null
  initialSolutions?: SolutionSummary[]
}>()

const { t } = useI18n()
const { localizeSolution } = useLocalizedContent()

const solution = computed(() => props.initialSolution)
const solutions = computed(() => props.initialSolutions ?? [])
const activeImageIndex = shallowRef(0)

const localizedSolution = computed(() => solution.value ? localizeSolution(solution.value) : null)
const localizedSolutions = computed(() => solutions.value.map(localizeSolution))
const solutionImages = computed(() => {
  if (!solution.value) return []
  const configured = solution.value.images?.length
    ? solution.value.images
    : solution.value.content.startsWith('/')
      ? [solution.value.content]
      : []
  return configured.slice(0, 2).map(image => resolveAssetUrl(image)).filter(Boolean)
})
const activeImage = computed(() => solutionImages.value[activeImageIndex.value] ?? '')
const activeImageSources = computed(() => resolveResponsiveAsset(activeImage.value, { widths: [640, 960, 1400] }))

function selectImage(index: number) {
  activeImageIndex.value = index
}

function moveImage(direction: -1 | 1) {
  if (!solutionImages.value.length) return
  activeImageIndex.value = (activeImageIndex.value + direction + solutionImages.value.length) % solutionImages.value.length
}

</script>

<template>
  <section class="detail-page solution-detail-page">
    <p class="breadcrumb">
      <LocalizedLink to="/">{{ t('nav.home') }}</LocalizedLink> ›
      <LocalizedLink to="/solutions/ev-charging-station">{{ t('nav.solutions') }}</LocalizedLink> ›
      <span>{{ localizedSolution?.title ?? t('solutions.title') }}</span>
    </p>

    <article v-if="localizedSolution" class="scenario-detail-shell">
      <aside class="scenario-directory" :aria-label="t('solutions.directory')">
        <div class="scenario-directory-heading">
          <strong>{{ t('solutions.directory') }}</strong>
          <small aria-hidden="true">{{ String(localizedSolutions.length).padStart(2, '0') }}</small>
        </div>
        <div class="scenario-directory-list">
          <LocalizedLink
            v-for="(item, index) in localizedSolutions"
            :key="item.slug"
            :aria-current="item.slug === localizedSolution.slug ? 'page' : undefined"
            :class="{ active: item.slug === localizedSolution.slug }"
            :to="`/solutions/${item.slug}`"
          >
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <em>{{ item.title }}</em>
          </LocalizedLink>
        </div>
      </aside>

      <div class="scenario-detail-main">
        <section class="scenario-hero-card">
          <div class="scenario-hero-copy">
            <h1>{{ localizedSolution.title }}</h1>
            <p>{{ localizedSolution.summary }}</p>
          </div>

          <div class="scenario-carousel">
            <img v-if="activeImageSources.src" :src="activeImageSources.src" :srcset="activeImageSources.srcset || undefined" sizes="(max-width: 900px) 100vw, 50vw" :alt="localizedSolution.title" width="1400" height="788" fetchpriority="high" decoding="async" />
            <div v-else class="scenario-empty-image">
              <ImageIcon />
              <span>{{ t('solutions.scenarioImage') }}</span>
            </div>
            <div v-if="solutionImages.length > 1" class="scenario-carousel-controls">
              <button type="button" :aria-label="t('solutions.previousImage')" @click="moveImage(-1)">
                <ChevronLeft />
              </button>
              <button type="button" :aria-label="t('solutions.nextImage')" @click="moveImage(1)">
                <ChevronRight />
              </button>
            </div>
            <div v-if="solutionImages.length > 1" class="scenario-carousel-dots">
              <button
                v-for="(_image, index) in solutionImages"
                :key="index"
                :class="{ active: activeImageIndex === index }"
                type="button"
                :aria-label="t('solutions.imageIndex', '', { index: String(index + 1) })"
                @click="selectImage(index)"
              ></button>
            </div>
          </div>
        </section>

        <SolutionDocumentSections
          v-if="localizedSolution.document_sections.length"
          :sections="localizedSolution.document_sections"
        />
        <RichContent v-else-if="localizedSolution.content" :html="localizedSolution.content" />

        <SeoGeoEvidence :record="localizedSolution" />

        <section class="cta-band solution-detail-cta">
          <h2>{{ t('solutions.ctaTitle') }}</h2>
          <p>{{ t('solutions.ctaCopy') }}</p>
          <div class="hero-actions">
            <LocalizedLink class="button primary" :to="`/contact?solution=${localizedSolution.slug}`">{{ t('solutions.startProject') }}</LocalizedLink>
            <LocalizedLink class="button secondary ghost" to="/solutions/ev-charging-station">{{ t('nav.solutions') }}</LocalizedLink>
          </div>
        </section>
      </div>
    </article>
  </section>
</template>
