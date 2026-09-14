<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue'
import { computed, shallowRef } from 'vue'
import type { HomeMetricSetting, LocalizedSiteSettings, SiteSettings } from '../../types/siteSettings'
import type { WebsiteLocale } from '../../types/websiteConfig'

const props = defineProps<{
  settings: SiteSettings
  locale: WebsiteLocale
}>()

const emit = defineEmits<{
  addMetric: []
  removeMetric: [index: number]
  updateMetric: [index: number, patch: Partial<HomeMetricSetting>]
}>()

const activeGroup = shallowRef('hero')
const contentGroups = computed(() => [
  { key: 'hero', title: '首页主视觉', scope: '标签、标题、副标题', count: 3 },
  { key: 'actions', title: '首页按钮', scope: '主按钮和次按钮', count: 4 },
  { key: 'contact', title: '联系板块', scope: '标题和副标题', count: 2 },
  { key: 'metrics', title: '首页指标', scope: '经验、项目、国家等数字', count: 4 },
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

function metricText(metric: HomeMetricSetting, field: 'label' | 'description') {
  if (props.locale === 'zh-CN') return metric[field] ?? ''
  const translations = field === 'label' ? metric.labelTranslations : metric.descriptionTranslations
  return translations?.[props.locale] ?? ''
}

function updateMetricText(metric: HomeMetricSetting, index: number, field: 'label' | 'description', event: Event) {
  const value = (event.target as HTMLInputElement).value
  const translationField = field === 'label' ? 'labelTranslations' : 'descriptionTranslations'
  emit('updateMetric', index, {
    ...(props.locale === 'zh-CN' ? { [field]: value } : {}),
    [translationField]: { ...(metric[translationField] ?? {}), [props.locale]: value },
  })
}
</script>

<template>
  <section class="config-panel settings-panel">
    <div class="panel-header split">
      <h2>首页默认内容</h2>
      <button class="primary-button compact" type="button" @click="emit('addMetric')">
        <Plus class="button-icon" />
        <span>新增</span>
      </button>
    </div>

    <div class="settings-module-editor">
      <aside class="home-module-sidebar" aria-label="首页默认内容目录">
        <button
          v-for="group in contentGroups"
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
        <section v-show="activeGroup === 'hero'" class="feature-editor-card">
          <label>
            主视觉标签
            <input :value="localizedValue('home_hero_badge')" @input="updateLocalized('home_hero_badge', $event)" />
          </label>
          <label>
            主视觉标题
            <input :value="localizedValue('home_hero_title')" @input="updateLocalized('home_hero_title', $event)" />
          </label>
          <label>
            主视觉副标题
            <textarea :value="localizedValue('home_hero_subtitle')" rows="4" @input="updateLocalized('home_hero_subtitle', $event)"></textarea>
          </label>
        </section>

        <section v-show="activeGroup === 'actions'" class="feature-editor-card">
          <div class="field-grid two">
            <label>
              主按钮文字
              <input :value="localizedValue('home_primary_cta_text')" @input="updateLocalized('home_primary_cta_text', $event)" />
            </label>
            <label v-if="locale === 'zh-CN'">
              主按钮链接
              <input v-model="settings.home_primary_cta_url" />
            </label>
            <label>
              次按钮文字
              <input :value="localizedValue('home_secondary_cta_text')" @input="updateLocalized('home_secondary_cta_text', $event)" />
            </label>
            <label v-if="locale === 'zh-CN'">
              次按钮链接
              <input v-model="settings.home_secondary_cta_url" />
            </label>
          </div>
        </section>

        <section v-show="activeGroup === 'contact'" class="feature-editor-card">
          <div class="field-grid two">
            <label>
              联系板块标题
              <input :value="localizedValue('home_contact_title')" @input="updateLocalized('home_contact_title', $event)" />
            </label>
            <label>
              联系板块副标题
              <input :value="localizedValue('home_contact_subtitle')" @input="updateLocalized('home_contact_subtitle', $event)" />
            </label>
          </div>
        </section>

        <section v-show="activeGroup === 'metrics'" class="metric-editor-list">
          <article v-for="(metric, index) in settings.home_metrics" :key="`${metric.label}-${index}`" class="metric-editor-row">
            <div class="field-grid two">
          <label v-if="locale === 'zh-CN'">
            数值
            <input :value="metric.value" @input="emit('updateMetric', index, { value: ($event.target as HTMLInputElement).value })" />
          </label>
          <label>
            标签
            <input :value="metricText(metric, 'label')" @input="updateMetricText(metric, index, 'label', $event)" />
          </label>
        </div>
        <label>
          描述
          <input
            :value="metricText(metric, 'description')"
            @input="updateMetricText(metric, index, 'description', $event)"
          />
        </label>
        <button class="ghost-button compact-danger" type="button" @click="emit('removeMetric', index)">
          <Trash2 class="button-icon" />
          <span>删除指标</span>
        </button>
      </article>
        </section>
      </div>
    </div>
  </section>
</template>
