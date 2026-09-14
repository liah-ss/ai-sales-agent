<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { Save } from '@lucide/vue'
import { useRoute } from 'vue-router'
import BannerEditor from '../components/website/BannerEditor.vue'
import ContentEditorPanel from '../components/website/ContentEditorPanel.vue'
import FaqEditorPanel from '../components/website/FaqEditorPanel.vue'
import HomeSectionSorter from '../components/website/HomeSectionSorter.vue'
import WebsiteLocaleTabs from '../components/website/WebsiteLocaleTabs.vue'
import HomeContentPanel from '../components/settings/HomeContentPanel.vue'
import SiteIdentityPanel from '../components/settings/SiteIdentityPanel.vue'
import { useAuthStore } from '../stores/auth'
import { useWebsiteConfigStore } from '../stores/websiteConfig'
import { useSiteSettingsManagementStore } from '../stores/siteSettingsManagement'
import type { PageContentConfig, WebsiteLocale } from '../types/websiteConfig'
import { websiteContentSections, type WebsiteContentSectionKey } from '../config/websiteContentNavigation'

const route = useRoute()
const store = useWebsiteConfigStore()
const siteStore = useSiteSettingsManagementStore()
const authStore = useAuthStore()
const {
  homeSections,
  banners,
  bannerCarousel,
  searchSettings,
  homeText,
  platformSellingPoints,
  homeWhyChoose,
  homeProcurementModes,
  homeScenarios,
  homeSuppliers,
  homeCategoryFallback,
  homeProductFallback,
  faq,
  pages,
  isLoading,
  isSaving,
  error,
} = storeToRefs(store)
const { settings, languageSummary } = storeToRefs(siteStore)
const activeTab = computed<WebsiteContentSectionKey>(() => (
  websiteContentSections.find(section => section.routeName === route.name)?.key ?? 'home'
))
const activeLocale = shallowRef<WebsiteLocale>('zh-CN')

const activePage = computed(() => pages.value.find(page => page.key === activeTab.value))
const activeTabInfo = computed(() => websiteContentSections.find(tab => tab.key === activeTab.value) ?? websiteContentSections[0])
const activeSavePending = computed(() => activeTab.value === 'site' ? siteStore.isSaving : isSaving.value)

function requireToken() {
  if (!authStore.token) throw new Error('Missing management token')
  return authStore.token
}

async function saveDraft() {
  await store.save(requireToken())
}

async function saveSiteSettings() {
  await siteStore.save(requireToken())
}

async function saveActiveTab() {
  if (activeTab.value === 'site') return saveSiteSettings()
  return saveDraft()
}

async function uploadBannerImage(id: string, file: File) {
  await store.uploadBannerImage(id, file, requireToken())
  await store.save(requireToken())
}

async function uploadHeroImage(key: PageContentConfig['key'], file: File) {
  const token = requireToken()
  await store.uploadHeroImage(key, file, token)
  await store.save(token)
}

async function uploadBlockImage(key: PageContentConfig['key'], blockId: string, file: File) {
  await store.uploadBlockImage(key, blockId, file, requireToken())
}

async function addImportFiles(key: PageContentConfig['key'], files: File[]) {
  await store.addImportFiles(key, files, requireToken())
}

onMounted(() => {
  void store.load(requireToken())
  void siteStore.load(requireToken())
})
</script>

<template>
  <p v-if="error" class="form-alert error config-alert">{{ error }}</p>
  <p v-if="isLoading" class="form-alert config-alert">正在加载网站配置...</p>

  <section class="config-detail website-config-detail">
    <header v-if="activeTab === 'about'" class="config-detail-toolbar">
      <div>
        <span class="system-label">网站内容 / {{ activeTabInfo.label }}</span>
        <h1>{{ activeTabInfo.label }}</h1>
        <p>{{ activeTabInfo.hint }}</p>
      </div>
      <button class="primary-button compact" type="button" :disabled="activeSavePending" @click="saveActiveTab">
        <Save class="button-icon" />
        <span>{{ activeSavePending ? '保存中...' : '保存' }}</span>
      </button>
    </header>
    <header v-else-if="activeTab !== 'banner'" class="website-section-heading">
      <h1>{{ activeTabInfo.label }}</h1>
      <button class="primary-button compact" type="button" :disabled="activeSavePending" @click="saveActiveTab">
        <Save class="button-icon" />
        <span>{{ activeSavePending ? '保存中...' : '保存' }}</span>
      </button>
    </header>
    <WebsiteLocaleTabs v-model="activeLocale" class="website-language-switcher" />
    <section v-if="activeTab === 'home'" class="config-stack">
      <HomeSectionSorter
        :locale="activeLocale"
        :sections="homeSections"
        :search-settings="searchSettings"
        :home-text="homeText"
        :platform-selling-points="platformSellingPoints"
        :home-why-choose="homeWhyChoose"
        :home-procurement-modes="homeProcurementModes"
        :home-scenarios="homeScenarios"
        :home-suppliers="homeSuppliers"
        :home-category-fallback="homeCategoryFallback"
        :home-product-fallback="homeProductFallback"
        @move="store.moveSection"
        @reorder="store.reorderSection"
        @toggle="store.toggleSection"
        @update-search-settings="store.updateSearchSettings"
        @update-home-text="store.updateHomeText"
        @update-platform-selling-point="store.updatePlatformSellingPoint"
        @move-platform-selling-point="store.movePlatformSellingPoint"
        @update-home-why-choose="store.updateHomeWhyChoose"
        @update-home-why-choose-reason="store.updateHomeWhyChooseReason"
        @update-home-procurement-mode="store.updateHomeProcurementMode"
        @update-home-scenario="store.updateHomeScenario"
        @update-home-supplier="store.updateHomeSupplier"
        @update-home-category-fallback="store.updateHomeCategoryFallback"
        @update-home-product-fallback="store.updateHomeProductFallback"
      />
      <HomeContentPanel
        :locale="activeLocale"
        :settings="settings"
        @add-metric="siteStore.addMetric"
        @remove-metric="siteStore.removeMetric"
        @update-metric="siteStore.updateMetric"
      />
    </section>

    <BannerEditor
      v-else-if="activeTab === 'banner'"
      :banners="banners"
      :carousel="bannerCarousel"
      :is-saving="isSaving"
      :locale="activeLocale"
      @add="store.addBanner"
      @remove="store.removeBanner"
      @save="saveDraft"
      @update="store.updateBanner"
      @update-carousel="store.updateBannerCarousel"
      @upload="uploadBannerImage"
    />

    <SiteIdentityPanel
      v-else-if="activeTab === 'site'"
      :settings="settings"
      :language-summary="languageSummary"
      :locale="activeLocale"
      @set-languages="siteStore.setLanguages"
    />

    <FaqEditorPanel
      v-else-if="activeTab === 'faq'"
      :faq="faq"
      :locale="activeLocale"
      @add-item="store.addFaqItem"
      @remove-item="store.removeFaqItem"
      @update-category="store.updateFaqCategory"
      @update-item="store.updateFaqItem"
      @update-page="store.updateFaq"
    />

    <ContentEditorPanel
      v-else-if="activePage"
      :page="activePage as PageContentConfig"
      :locale="activeLocale"
      @add-block="store.addBlock"
      @add-import-files="addImportFiles"
      @remove-block="store.removeBlock"
      @update-block="store.updateBlock"
      @update-page="store.updatePage"
      @upload-block-image="uploadBlockImage"
      @upload-hero="uploadHeroImage"
    />
  </section>
</template>

<style scoped>
.website-section-heading {
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.website-section-heading h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
}

.website-language-switcher {
  margin-bottom: 18px;
}

@media (max-width: 640px) {
  .website-section-heading {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
