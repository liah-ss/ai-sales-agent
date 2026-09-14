<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import {
  BadgeDollarSign,
  ChevronDown,
  CircleHelp,
  CloudSun,
  ListChecks,
  Search,
  ShieldCheck,
  Truck,
  Wrench,
  X,
} from '@lucide/vue'
import type { Component } from 'vue'
import type { FaqPageConfig, WebsiteLocale } from '../../types/websiteConfig'
import { faqCategoryTitle, faqItemAnswer, faqItemQuestion, faqPageText } from '../../utils/faq'

const props = defineProps<{
  faq: FaqPageConfig
  locale: WebsiteLocale
}>()

const query = shallowRef('')
const activeCategory = shallowRef('all')
const openItemId = shallowRef('')

const categoryIcons: Record<string, Component> = {
  list: ListChecks,
  shield: ShieldCheck,
  price: BadgeDollarSign,
  truck: Truck,
  service: Wrench,
  environment: CloudSun,
}

const copy = computed(() => ({
  allLabel: faqPageText(props.faq, 'allLabel', props.locale),
  popularLabel: faqPageText(props.faq, 'popularLabel', props.locale),
  questionUnit: faqPageText(props.faq, 'questionUnit', props.locale),
  searchPlaceholder: faqPageText(props.faq, 'searchPlaceholder', props.locale),
  searchHint: faqPageText(props.faq, 'searchHint', props.locale),
  emptyTitle: faqPageText(props.faq, 'emptyTitle', props.locale),
  emptyMessage: faqPageText(props.faq, 'emptyMessage', props.locale),
  emptyAction: faqPageText(props.faq, 'emptyAction', props.locale),
  quickJumpLabel: faqPageText(props.faq, 'quickJumpLabel', props.locale),
  clearSearch: {
    'zh-CN': '清除搜索',
    en: 'Clear search',
    id: 'Hapus pencarian',
  }[props.locale],
}))

const localizedCategories = computed(() => props.faq.categories
  .filter(category => category.enabled)
  .map(category => ({
    ...category,
    localizedTitle: faqCategoryTitle(category, props.locale),
    localizedItems: category.items
      .filter(item => item.enabled)
      .map(item => ({
        ...item,
        localizedQuestion: faqItemQuestion(item, props.locale),
        localizedAnswer: faqItemAnswer(item, props.locale),
      })),
  })))

const totalQuestions = computed(() => localizedCategories.value.reduce((total, category) => total + category.localizedItems.length, 0))
const normalizedQuery = computed(() => query.value.trim().toLocaleLowerCase(props.locale))
const visibleCategories = computed(() => localizedCategories.value
  .filter(category => activeCategory.value === 'all' || category.id === activeCategory.value)
  .map(category => ({
    ...category,
    localizedItems: normalizedQuery.value
      ? category.localizedItems.filter(item => `${item.localizedQuestion} ${item.localizedAnswer}`.toLocaleLowerCase(props.locale).includes(normalizedQuery.value))
      : category.localizedItems,
  }))
  .filter(category => category.localizedItems.length > 0))
const visibleQuestionCount = computed(() => visibleCategories.value.reduce((total, category) => total + category.localizedItems.length, 0))

watch(localizedCategories, (categories) => {
  if (activeCategory.value !== 'all' && !categories.some(category => category.id === activeCategory.value)) {
    activeCategory.value = 'all'
  }
})

function toggleItem(itemId: string) {
  openItemId.value = openItemId.value === itemId ? '' : itemId
}

function setCategory(categoryId: string) {
  activeCategory.value = categoryId
  openItemId.value = ''
}

function jumpToCategory(categoryId: string) {
  setCategory('all')
  requestAnimationFrame(() => {
    document.getElementById(`faq-${categoryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
</script>

<template>
  <div class="faq-explorer">
    <div class="faq-search-block">
      <div class="faq-search-control">
        <Search aria-hidden="true" />
        <input v-model="query" type="search" :placeholder="copy.searchPlaceholder" autocomplete="off" />
        <button v-if="query" type="button" :aria-label="copy.clearSearch" :title="copy.clearSearch" @click="query = ''">
          <X />
        </button>
      </div>
      <p v-if="copy.searchHint">{{ copy.searchHint }}</p>
    </div>

    <div class="faq-filter-row" role="tablist" :aria-label="copy.quickJumpLabel">
      <button
        type="button"
        role="tab"
        :aria-selected="activeCategory === 'all'"
        :class="{ active: activeCategory === 'all' }"
        @click="setCategory('all')"
      >
        {{ copy.allLabel }}
        <span>{{ totalQuestions }}</span>
      </button>
      <button
        v-for="category in localizedCategories"
        :key="category.id"
        type="button"
        role="tab"
        :aria-selected="activeCategory === category.id"
        :class="{ active: activeCategory === category.id }"
        @click="setCategory(category.id)"
      >
        {{ category.localizedTitle }}
        <span>{{ category.localizedItems.length }}</span>
      </button>
    </div>

    <div class="faq-content-layout">
      <main class="faq-main-column">
        <div v-if="visibleQuestionCount === 0" class="faq-empty-state">
          <CircleHelp />
          <h2>{{ copy.emptyTitle }}</h2>
          <p>{{ copy.emptyMessage }}</p>
          <LocalizedLink class="faq-primary-action" :to="faq.primaryPath">{{ copy.emptyAction }}</LocalizedLink>
        </div>

        <template v-else>
          <section
            v-for="category in visibleCategories"
            :id="`faq-${category.id}`"
            :key="category.id"
            class="faq-category-group"
          >
            <header class="faq-category-heading">
              <span class="faq-category-icon">
                <component :is="categoryIcons[category.icon] ?? CircleHelp" />
              </span>
              <div>
                <h2>{{ category.localizedTitle }}</h2>
                <p>{{ category.localizedItems.length }} {{ copy.questionUnit }}</p>
              </div>
            </header>

            <div class="faq-accordion">
              <article v-for="item in category.localizedItems" :key="item.id" class="faq-item" :class="{ open: openItemId === item.id }">
                <button
                  type="button"
                  class="faq-question"
                  :aria-expanded="openItemId === item.id"
                  :aria-controls="`answer-${item.id}`"
                  @click="toggleItem(item.id)"
                >
                  <span>{{ item.localizedQuestion }}</span>
                  <small v-if="item.popular">{{ copy.popularLabel }}</small>
                  <span class="faq-chevron"><ChevronDown /></span>
                </button>
                <div v-show="openItemId === item.id" :id="`answer-${item.id}`" class="faq-answer">
                  <p>{{ item.localizedAnswer }}</p>
                </div>
              </article>
            </div>
          </section>
        </template>
      </main>

      <aside class="faq-quick-nav" :aria-label="copy.quickJumpLabel">
        <strong>{{ copy.quickJumpLabel }}</strong>
        <button v-for="category in localizedCategories" :key="category.id" type="button" @click="jumpToCategory(category.id)">
          <span></span>
          {{ category.localizedTitle }}
        </button>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.faq-explorer {
  display: grid;
  gap: 24px;
}

.faq-search-block {
  width: min(720px, 100%);
}

.faq-search-control {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) 34px;
  min-height: 56px;
  align-items: center;
  gap: 12px;
  border: 1px solid #ced8e3;
  border-radius: 6px;
  background: #ffffff;
  padding: 0 10px 0 18px;
  box-shadow: 0 12px 28px rgba(15, 35, 56, 0.08);
}

.faq-search-control:focus-within {
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12), 0 12px 28px rgba(15, 35, 56, 0.08);
}

.faq-search-control > svg {
  width: 21px;
  color: #66788b;
}

.faq-search-control input {
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #14263a;
  font: inherit;
}

.faq-search-control button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: #eef3f6;
  color: #536577;
  cursor: pointer;
}

.faq-search-control button svg {
  width: 17px;
}

.faq-search-block > p {
  margin: 9px 0 0;
  color: #6a7887;
  font-size: 12px;
}

.faq-filter-row {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.faq-filter-row button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  border: 1px solid #d4dde6;
  border-radius: 6px;
  background: #ffffff;
  padding: 0 13px;
  color: #46596c;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 650;
}

.faq-filter-row button span {
  color: #82909e;
  font-size: 11px;
}

.faq-filter-row button:hover,
.faq-filter-row button.active {
  border-color: #0f766e;
  background: #0f766e;
  color: #ffffff;
}

.faq-filter-row button.active span,
.faq-filter-row button:hover span {
  color: #c9ece7;
}

.faq-content-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 210px;
  align-items: start;
  gap: 46px;
}

.faq-main-column {
  display: grid;
  gap: 34px;
  min-width: 0;
}

.faq-category-group {
  scroll-margin-top: 126px;
}

.faq-category-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.faq-category-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border: 1px solid #b7ddd7;
  border-radius: 6px;
  background: #e8f5f2;
  color: #0f766e;
}

.faq-category-icon svg {
  width: 19px;
}

.faq-category-heading h2,
.faq-category-heading p {
  margin: 0;
}

.faq-category-heading h2 {
  color: #14263a;
  font-size: 20px;
}

.faq-category-heading p {
  margin-top: 2px;
  color: #758394;
  font-size: 12px;
}

.faq-accordion {
  display: grid;
  gap: 9px;
}

.faq-item {
  overflow: hidden;
  border: 1px solid #dbe2e9;
  border-left: 3px solid transparent;
  border-radius: 6px;
  background: #ffffff;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.faq-item:hover,
.faq-item.open {
  border-color: #b9cbc9;
  border-left-color: #f59e0b;
  box-shadow: 0 10px 24px rgba(20, 38, 58, 0.07);
}

.faq-question {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr) auto 32px;
  align-items: center;
  gap: 12px;
  border: 0;
  background: transparent;
  padding: 16px 16px 16px 18px;
  color: #172b40;
  cursor: pointer;
  text-align: left;
  font: inherit;
  font-size: 15px;
  font-weight: 680;
}

.faq-question small {
  border: 1px solid #f2c66d;
  border-radius: 4px;
  background: #fff6df;
  padding: 3px 7px;
  color: #a35d00;
  font-size: 10px;
}

.faq-chevron {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 4px;
  background: #eef3f6;
  color: #637385;
  transition: transform 180ms ease, background 180ms ease;
}

.faq-chevron svg {
  width: 17px;
}

.faq-item.open .faq-chevron {
  transform: rotate(180deg);
  background: #fff1d5;
  color: #a85f00;
}

.faq-answer {
  border-top: 1px solid #e6ebef;
  padding: 16px 18px 19px;
  background: #f9fbfc;
}

.faq-answer p {
  margin: 0;
  color: #4e6072;
  font-size: 14px;
  line-height: 1.85;
  white-space: pre-line;
}

.faq-quick-nav {
  position: sticky;
  top: 116px;
  display: grid;
  gap: 2px;
  border-left: 1px solid #d7e0e8;
  padding-left: 16px;
}

.faq-quick-nav strong {
  margin-bottom: 8px;
  color: #84909d;
  font-size: 11px;
  text-transform: uppercase;
}

.faq-quick-nav button {
  display: flex;
  align-items: center;
  gap: 9px;
  border: 0;
  background: transparent;
  padding: 8px 4px;
  color: #596a7b;
  cursor: pointer;
  text-align: left;
  font: inherit;
  font-size: 13px;
}

.faq-quick-nav button span {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: #0f766e;
}

.faq-quick-nav button:hover {
  color: #0f766e;
}

.faq-empty-state {
  display: grid;
  justify-items: center;
  border: 1px dashed #cbd5df;
  border-radius: 6px;
  padding: 44px 20px;
  text-align: center;
}

.faq-empty-state > svg {
  width: 34px;
  color: #0f766e;
}

.faq-empty-state h2 {
  margin: 14px 0 6px;
  color: #172b40;
  font-size: 18px;
}

.faq-empty-state p {
  margin: 0 0 18px;
  color: #667789;
}

.faq-primary-action {
  border-radius: 5px;
  background: #f59e0b;
  padding: 10px 16px;
  color: #291800;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 900px) {
  .faq-content-layout {
    grid-template-columns: 1fr;
  }

  .faq-quick-nav {
    display: none;
  }
}

@media (max-width: 600px) {
  .faq-question {
    grid-template-columns: minmax(0, 1fr) 32px;
  }

  .faq-question small {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .faq-item,
  .faq-chevron {
    transition: none;
  }
}
</style>
