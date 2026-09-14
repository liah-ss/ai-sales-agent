<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { LocalizedSiteSettings, SiteSettings } from '../../types/siteSettings'
import type { WebsiteLocale } from '../../types/websiteConfig'

const props = defineProps<{
  settings: SiteSettings
  languageSummary: string
  locale: WebsiteLocale
}>()

const emit = defineEmits<{
  setLanguages: [value: string]
}>()

const activeGroup = shallowRef('brand')
const settingGroups = computed(() => [
  { key: 'brand', title: '品牌身份', scope: '品牌名称、标语、支持语言', count: 3 },
  { key: 'contact', title: '联系方式', scope: 'WhatsApp、社交账号、邮箱、电话、地址', count: 6 },
  { key: 'topbar', title: '顶部栏', scope: '官网顶部通用展示文案', count: 5 },
  { key: 'footer', title: '页脚描述', scope: '官网页脚品牌介绍', count: 1 },
])

type LocalizedKey = keyof LocalizedSiteSettings

function localizedValue(field: LocalizedKey) {
  if (props.locale === 'zh-CN') return String(props.settings[field] ?? '')
  return String(props.settings.translations[props.locale]?.[field] ?? '')
}

function updateLocalized(field: LocalizedKey, event: Event) {
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
  if (props.locale === 'zh-CN') {
    ;(props.settings[field] as string) = value
    return
  }
  props.settings.translations[props.locale] = {
    ...(props.settings.translations[props.locale] ?? {}),
    [field]: value,
  }
}
</script>

<template>
  <section class="config-panel settings-panel">
    <div class="settings-module-editor">
      <aside class="home-module-sidebar" aria-label="品牌与联系方式目录">
        <button
          v-for="group in settingGroups"
          :key="group.key"
          class="home-module-tab"
          :class="{ active: activeGroup === group.key }"
          type="button"
          @click="activeGroup = group.key"
        >
          <span>
            <strong>{{ group.title }}</strong>
            <small>{{ group.scope }}</small>
          </span>
          <em>{{ group.count }}</em>
        </button>
      </aside>

      <div class="home-module-workspace">
        <section v-show="activeGroup === 'brand'" class="feature-editor-card">
          <div class="field-grid two">
            <label v-if="locale === 'zh-CN'">
              品牌名称
              <input v-model="settings.brand_name" />
            </label>
            <label>
              品牌标语
              <input :value="localizedValue('tagline')" @input="updateLocalized('tagline', $event)" />
            </label>
            <label v-if="locale === 'zh-CN'">
              支持语言
              <input :value="languageSummary" @input="emit('setLanguages', ($event.target as HTMLInputElement).value)" />
            </label>
          </div>
        </section>

        <section v-show="activeGroup === 'contact'" class="feature-editor-card">
          <div class="field-grid two">
            <label>
              WhatsApp 号码
              <input v-model="settings.whatsapp_number" />
            </label>
            <label>
              Facebook 链接
              <input v-model="settings.facebook_url" type="url" placeholder="https://www.facebook.com/examplecorp" />
            </label>
            <label>
              LinkedIn 链接
              <input v-model="settings.linkedin_url" type="url" placeholder="https://www.linkedin.com/in/..." />
            </label>
            <label>
              销售邮箱
              <input v-model="settings.sales_email" />
            </label>
            <label>
              电话
              <input v-model="settings.phone" />
            </label>
            <label>
              公司地址
              <input :value="localizedValue('company_address')" @input="updateLocalized('company_address', $event)" />
            </label>
          </div>
        </section>

        <section v-show="activeGroup === 'topbar'" class="feature-editor-card">
          <div class="panel-subsection">
            <span class="system-label">顶部栏（通用配置）</span>
            <p>仅替换顶部栏展示文案；登录 / 注册为三期代理商模块预留入口，当前只置灰展示。</p>
          </div>
          <div class="field-grid two">
            <label>
              左侧宣传文案
              <input :value="localizedValue('topbar_slogan_text')" @input="updateLocalized('topbar_slogan_text', $event)" />
            </label>
            <label>
              电话展示文案
              <input :value="localizedValue('topbar_phone_text')" @input="updateLocalized('topbar_phone_text', $event)" />
            </label>
            <label>
              WhatsApp 按钮文案
              <input :value="localizedValue('topbar_whatsapp_text')" @input="updateLocalized('topbar_whatsapp_text', $event)" />
            </label>
            <label>
              登录文案
              <input :value="localizedValue('topbar_login_text')" @input="updateLocalized('topbar_login_text', $event)" />
            </label>
            <label>
              注册文案
              <input :value="localizedValue('topbar_register_text')" @input="updateLocalized('topbar_register_text', $event)" />
            </label>
          </div>
        </section>

        <section v-show="activeGroup === 'footer'" class="feature-editor-card">
          <label>
            页脚描述
            <textarea :value="localizedValue('footer_description')" rows="4" @input="updateLocalized('footer_description', $event)"></textarea>
          </label>
        </section>
      </div>
    </div>
  </section>
</template>
