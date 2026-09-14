<script setup lang="ts">
import { nextTick, onBeforeUnmount, useTemplateRef, watch } from 'vue'
import { X, MessageCircle } from '@lucide/vue'
import { useI18n } from '../../composables/useI18n'
import { useLocalizedContent } from '../../data/localizedContent'
import LanguageSwitcher from '../common/LanguageSwitcher.vue'
import SocialMediaLinks from './SocialMediaLinks.vue'

const props = defineProps<{
  open: boolean
  whatsappLink: string
  facebookUrl: string
  linkedinUrl: string
  languages: string[]
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const { text } = useLocalizedContent()
const menu = useTemplateRef<HTMLElement>('menu')
let previouslyFocused: HTMLElement | null = null

function focusableElements() {
  if (!menu.value) return []
  return Array.from(menu.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter(element => !element.hasAttribute('hidden'))
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key !== 'Tab') return

  const elements = focusableElements()
  const first = elements[0]
  const last = elements.at(-1)
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(() => props.open, async (open) => {
  if (open) {
    previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    await nextTick()
    focusableElements()[0]?.focus()
    document.addEventListener('keydown', handleKeydown)
    return
  }

  document.removeEventListener('keydown', handleKeydown)
  previouslyFocused?.focus()
  previouslyFocused = null
})

onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <transition name="mobile-sheet">
    <div
      v-if="open"
      id="mobile-navigation"
      ref="menu"
      class="mobile-menu"
      role="dialog"
      aria-modal="true"
      :aria-label="t('nav.mobileNavigation')"
    >
      <div class="mobile-menu-header">
        <span>{{ t('nav.navigation') }}</span>
        <button class="icon-button" type="button" :aria-label="t('nav.close')" @click="$emit('close')">
          <X class="icon" />
        </button>
      </div>

      <nav class="mobile-nav" :aria-label="t('nav.mobileNavigation')">
        <LocalizedLink to="/" @click="$emit('close')">{{ t('nav.home') }}</LocalizedLink>
        <LocalizedLink to="/products" prefetch @click="$emit('close')">{{ t('nav.products') }}</LocalizedLink>
        <LocalizedLink to="/solutions/ev-charging-station" prefetch @click="$emit('close')">{{ t('nav.solutions') }}</LocalizedLink>
        <LocalizedLink to="/delivery-cases" prefetch @click="$emit('close')">{{ t('deliveryCases.title') }}</LocalizedLink>
        <LocalizedLink to="/about" prefetch @click="$emit('close')">{{ t('nav.about') }}</LocalizedLink>
        <LocalizedLink to="/contact" prefetch @click="$emit('close')">{{ t('nav.contact') }}</LocalizedLink>
        <LocalizedLink to="/faq" prefetch @click="$emit('close')">{{ text('nav.helpCenter', 'Help Center') }}</LocalizedLink>
      </nav>

      <div class="mobile-menu-footer">
        <LanguageSwitcher :languages="languages" />
        <a v-if="whatsappLink" class="whatsapp mobile" :href="whatsappLink" target="_blank" rel="noreferrer">
          <MessageCircle class="icon" />
          <span>{{ t('common.whatsapp') }}</span>
        </a>
        <SocialMediaLinks :facebook-url="facebookUrl" :linkedin-url="linkedinUrl" mobile />
      </div>
    </div>
  </transition>
</template>
