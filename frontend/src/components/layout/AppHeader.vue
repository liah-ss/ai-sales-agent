<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, X, Languages, MessageCircle, ChevronDown, Search } from '@lucide/vue'
import type { LocalizedSiteSettings, SiteSettings } from '../../types/site'
import { useI18n } from '../../composables/useI18n'
import { useWebsiteConfig } from '../../composables/useWebsiteConfig'
import { useLocalizedContent } from '../../data/localizedContent'
import { buildWhatsAppLink } from '../../utils/whatsapp'
import LanguageSwitcher from '../common/LanguageSwitcher.vue'
import MobileMenu from './MobileMenu.vue'
import SocialMediaLinks from './SocialMediaLinks.vue'
import { resolveOptimizedAssetUrl } from '../../api/client'
import { localizePath } from '../../utils/localeRouting'

const props = defineProps<{
  siteSettings: SiteSettings | null
}>()

const menuOpen = ref(false)
const searchTerm = shallowRef('')
const navHidden = shallowRef(false)
let previousScrollY = 0
let navTransitionLocked = false
let navTransitionTimer: number | undefined
const router = useRouter()
const { locale, localeLabel, t } = useI18n()
const { config: websiteConfig } = useWebsiteConfig()
const { text, list } = useLocalizedContent()

const whatsappLink = computed(() => {
  return buildWhatsAppLink(props.siteSettings?.whatsapp_number, { sourcePage: 'Header' })
})
const facebookUrl = computed(() => props.siteSettings?.facebook_url?.trim() ?? '')
const linkedinUrl = computed(() => props.siteSettings?.linkedin_url?.trim() ?? '')
const brandName = computed(() => {
  return !props.siteSettings?.brand_name || props.siteSettings.brand_name === 'ExampleCorp'
    ? 'ExampleCorp'
    : props.siteSettings.brand_name
})
const logoUrl = computed(() => resolveOptimizedAssetUrl('/logo-site.png', { width: 440, quality: 86 }))
// The Docker/Nuxt deployment does not mount the static /media directory.
// Use the configured public asset origin in every build mode instead.
const productionLogoUrl = computed(() => logoUrl.value)
function siteText(field: keyof LocalizedSiteSettings, fallback: string) {
  if (locale.value === 'zh-CN') return fallback
  return props.siteSettings?.translations?.[locale.value]?.[field] ?? fallback
}
const hotScenes = computed(() => {
  return list('header.hotScenes', [
    'PV station package',
    'Factory distribution upgrade',
    'Data center power',
    'EV charging site',
    'Smart grid retrofit',
  ])
})
const topbarSloganText = computed(() => {
  const managed = locale.value === 'zh-CN'
    ? props.siteSettings?.topbar_slogan_text
    : props.siteSettings?.translations?.[locale.value]?.topbar_slogan_text
  return managed || text('header.promise', 'Global power equipment direct sourcing · scenario procurement · one-stop delivery')
})
const topbarPhoneText = computed(() => {
  const phone = String(props.siteSettings?.phone ?? '').trim()
  return phone ? `📞 ${phone}` : ''
})
const topbarWhatsappText = computed(() => {
  return siteText('topbar_whatsapp_text', props.siteSettings?.topbar_whatsapp_text || t('common.whatsapp'))
})
const topbarAuthText = computed(() => {
  const login = siteText('topbar_login_text', locale.value === 'zh-CN' ? props.siteSettings?.topbar_login_text || '登录' : text('header.login', 'Login'))
  const register = siteText('topbar_register_text', locale.value === 'zh-CN' ? props.siteSettings?.topbar_register_text || '注册' : text('header.register', 'Register'))
  return `${login} / ${register}`
})
const searchPlaceholder = computed(() => {
  const settings = websiteConfig.value?.searchSettings
  const managed = locale.value === 'zh-CN'
    ? settings?.placeholder
    : settings?.placeholderTranslations?.[locale.value]
  return managed?.trim() || text('header.searchPlaceholder', 'Search application scenario, equipment demand or technical parameters...')
})

function closeMenu() {
  menuOpen.value = false
}

function submitSearch() {
  const query = searchTerm.value.trim()
  void router.push({
    path: localizePath('/search', locale.value),
    query: query ? { q: query } : {},
  })
}

function updateNavVisibility() {
  const currentScrollY = Math.max(window.scrollY, 0)

  if (currentScrollY <= 80) {
    setNavHidden(false)
    previousScrollY = currentScrollY
    return
  }

  if (navTransitionLocked) {
    previousScrollY = currentScrollY
    return
  }

  if (currentScrollY > previousScrollY) {
    setNavHidden(true)
  }
  else if (currentScrollY < previousScrollY) {
    setNavHidden(false)
  }

  previousScrollY = currentScrollY
}

function setNavHidden(hidden: boolean) {
  if (navHidden.value === hidden) return

  navHidden.value = hidden
  navTransitionLocked = true
  if (navTransitionTimer !== undefined) window.clearTimeout(navTransitionTimer)
  navTransitionTimer = window.setTimeout(() => {
    previousScrollY = Math.max(window.scrollY, 0)
    navTransitionLocked = false
    navTransitionTimer = undefined
  }, 220)
}

onMounted(() => {
  previousScrollY = Math.max(window.scrollY, 0)
  window.addEventListener('scroll', updateNavVisibility, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateNavVisibility)
  if (navTransitionTimer !== undefined) window.clearTimeout(navTransitionTimer)
})

</script>

<template>
  <header class="site-header" :class="{ 'nav-hidden': navHidden }">
    <div class="header-top">
      <div class="site-header-inner header-top-inner">
        <span>{{ topbarSloganText }}</span>
        <span>{{ topbarPhoneText }}</span>
        <div class="site-actions">
          <span class="topbar-auth-link" aria-disabled="true">{{ topbarAuthText }}</span>
          <div class="language-menu">
            <button class="icon-button" type="button" aria-haspopup="true">
              <Languages class="icon" />
              <span>{{ localeLabel }}</span>
              <ChevronDown class="icon chevron" />
            </button>
            <LanguageSwitcher
              :languages="siteSettings?.supported_languages ?? ['en', 'zh-CN', 'id']"
              compact
            />
          </div>

          <a v-if="whatsappLink" class="whatsapp" :href="whatsappLink" target="_blank" rel="noreferrer">
            <MessageCircle class="icon" />
            <span>{{ topbarWhatsappText }}</span>
          </a>
          <SocialMediaLinks :facebook-url="facebookUrl" :linkedin-url="linkedinUrl" />
        </div>
      </div>
    </div>

    <div class="header-main">
      <div class="site-header-inner header-main-inner">
        <LocalizedLink class="brand" to="/">
          <img class="brand-logo" :src="productionLogoUrl" :alt="brandName" width="220" height="50" decoding="async" />
        </LocalizedLink>

        <div class="header-search-group">
          <form class="header-search" @submit.prevent="submitSearch">
            <input v-model="searchTerm" :placeholder="searchPlaceholder" />
            <button type="submit">
              <Search class="icon" />
              <span>{{ text('header.searchAction', 'Smart Match') }}</span>
            </button>
          </form>
          <div class="hot-scene-row">
            <span>{{ text('header.hotScenesLabel', 'Hot scenarios:') }}</span>
            <LocalizedLink v-for="scene in hotScenes" :key="scene" to="/solutions/ev-charging-station">
              {{ scene }}
            </LocalizedLink>
          </div>
        </div>

        <button
          class="menu-toggle"
          type="button"
          aria-controls="mobile-navigation"
          :aria-expanded="menuOpen"
          :aria-label="menuOpen ? t('nav.close') : t('nav.menu')"
          @click="menuOpen = !menuOpen"
        >
          <component :is="menuOpen ? X : Menu" class="menu-icon" />
          <span>{{ menuOpen ? t('nav.close') : t('nav.menu') }}</span>
        </button>
      </div>
    </div>

    <nav class="site-nav" :aria-label="t('nav.primaryNavigation')">
      <div class="site-header-inner site-nav-inner">
        <LocalizedLink class="category-tab" to="/products" prefetch><Menu class="icon" />{{ text('header.allCategories', 'All product categories') }}</LocalizedLink>
        <LocalizedLink to="/">{{ t('nav.home') }}</LocalizedLink>
        <LocalizedLink to="/solutions/ev-charging-station" prefetch>{{ t('nav.solutions') }}</LocalizedLink>
        <LocalizedLink to="/products" prefetch>{{ t('nav.products') }}</LocalizedLink>
        <LocalizedLink to="/delivery-cases" prefetch>{{ text('nav.deliveryCases', t('deliveryCases.title')) }}</LocalizedLink>
        <LocalizedLink to="/about" prefetch>{{ t('nav.about') }}</LocalizedLink>
        <LocalizedLink to="/contact" prefetch>{{ t('nav.contact') }}</LocalizedLink>
        <LocalizedLink to="/faq" prefetch>{{ text('nav.helpCenter', 'Help Center') }}</LocalizedLink>
        <LocalizedLink to="/news" prefetch>{{ text('nav.industryNews', t('news.title')) }}</LocalizedLink>
      </div>
    </nav>

    <MobileMenu
      :open="menuOpen"
      :whatsapp-link="whatsappLink"
      :facebook-url="facebookUrl"
      :linkedin-url="linkedinUrl"
      :languages="siteSettings?.supported_languages ?? ['en', 'zh-CN', 'id']"
      @close="closeMenu"
    />
  </header>
</template>
