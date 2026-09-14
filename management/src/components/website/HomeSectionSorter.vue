<script setup lang="ts">
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical } from '@lucide/vue'
import { computed, shallowRef } from 'vue'
import type { HomeCategoryFallback, HomeProcurementMode, HomeProductFallback, HomeScenario, HomeSection, HomeSupplier, HomeText, HomeWhyChoose, HomeWhyChooseReason, PlatformSellingPoint, SearchSettings, WebsiteLocale, WebsiteTranslations } from '../../types/websiteConfig'

const props = defineProps<{
  sections: HomeSection[]
  searchSettings: SearchSettings
  homeText: HomeText[]
  platformSellingPoints: PlatformSellingPoint[]
  homeWhyChoose: HomeWhyChoose
  homeProcurementModes: HomeProcurementMode[]
  homeScenarios: HomeScenario[]
  homeSuppliers: HomeSupplier[]
  homeCategoryFallback: HomeCategoryFallback[]
  homeProductFallback: HomeProductFallback[]
  locale: WebsiteLocale
}>()

const emit = defineEmits<{
  move: [id: string, direction: -1 | 1]
  reorder: [fromIndex: number, toIndex: number]
  toggle: [id: string]
  updateSearchSettings: [patch: Partial<SearchSettings>]
  updateHomeText: [key: string, patch: Partial<HomeText>]
  updatePlatformSellingPoint: [id: string, patch: Partial<PlatformSellingPoint>]
  movePlatformSellingPoint: [id: string, direction: -1 | 1]
  updateHomeWhyChoose: [patch: Partial<HomeWhyChoose>]
  updateHomeWhyChooseReason: [id: string, patch: Partial<HomeWhyChooseReason>]
  updateHomeProcurementMode: [id: string, patch: Partial<HomeProcurementMode>]
  updateHomeScenario: [id: string, patch: Partial<HomeScenario>]
  updateHomeSupplier: [id: string, patch: Partial<HomeSupplier>]
  updateHomeCategoryFallback: [slug: string, patch: Partial<HomeCategoryFallback>]
  updateHomeProductFallback: [slug: string, patch: Partial<HomeProductFallback>]
}>()

const draggingIndex = shallowRef<number | null>(null)
const activeGroup = shallowRef('order')
const localeName = computed(() => ({ 'zh-CN': '中文', id: '东南亚语', en: '英文' })[props.locale])
const editingGroups = computed(() => [
  {
    key: 'order',
    title: '首页板块顺序',
    scope: '显示/隐藏、拖拽排序',
    count: props.sections.length,
  },
  {
    key: 'search',
    title: '搜索框',
    scope: '首页首屏搜索占位文案',
    count: 1,
  },
  {
    key: 'common',
    title: '通用文案',
    scope: '按钮、表单、模块标题',
    count: props.homeText.length,
  },
  {
    key: 'procurement',
    title: '采购模式',
    scope: '模式 A / 模式 B 卡片',
    count: props.homeProcurementModes.length,
  },
  {
    key: 'platform',
    title: '平台卖点',
    scope: 'Banner 右侧信任卡片',
    count: props.platformSellingPoints.length,
  },
  {
    key: 'why',
    title: '为什么选择',
    scope: '模块标题和原因卡片',
    count: props.homeWhyChoose.reasons.length,
  },
  {
    key: 'scenarios',
    title: '应用场景',
    scope: '场景卡片和询盘预填文案',
    count: props.homeScenarios.length,
  },
  {
    key: 'suppliers',
    title: '供应商',
    scope: '战略合作供应商卡片',
    count: props.homeSuppliers.length,
  },
  {
    key: 'fallback',
    title: '兜底内容',
    scope: '分类与热品兜底数据',
    count: props.homeCategoryFallback.length + props.homeProductFallback.length,
  },
])

function startDrag(index: number) {
  draggingIndex.value = index
}

function dropOn(index: number) {
  if (draggingIndex.value === null) return
  emit('reorder', draggingIndex.value, index)
  draggingIndex.value = null
}

function setActiveGroup(key: string) {
  activeGroup.value = key
}

function updatePlatformText(id: string, field: 'title' | 'content' | 'icon', event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  emit('updatePlatformSellingPoint', id, { [field]: target.value })
}

function localized(translations: WebsiteTranslations | undefined, fallback: string) {
  return translations?.[props.locale] ?? (props.locale === 'zh-CN' ? fallback : '')
}

function localizedList(translations: Partial<Record<WebsiteLocale, string[]>> | undefined, fallback: string[]) {
  return translations?.[props.locale] ?? (props.locale === 'zh-CN' ? fallback : [])
}

function updatePlatformTranslation(
  point: PlatformSellingPoint,
  group: 'titleTranslations' | 'contentTranslations',
  event: Event,
) {
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
  const canonicalField = group === 'titleTranslations' ? 'title' : 'content'
  emit('updatePlatformSellingPoint', point.id, {
    ...(props.locale === 'zh-CN' ? { [canonicalField]: value } : {}),
    [group]: { ...(point[group] ?? {}), [props.locale]: value },
  })
}

function updateWhyChooseTranslation(
  group: 'titleTranslations' | 'ctaTextTranslations',
  language: 'en' | 'zh-CN' | 'id',
  event: Event,
) {
  const target = event.target as HTMLInputElement
  emit('updateHomeWhyChoose', {
    [group]: {
      ...props.homeWhyChoose[group],
      [language]: target.value,
    },
  })
}

function updateReasonText(id: string, field: 'number' | 'title' | 'subtitle' | 'quote', event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('updateHomeWhyChooseReason', id, { [field]: target.value })
}

function updateReasonTranslation(
  reason: HomeWhyChooseReason,
  group: 'titleTranslations' | 'subtitleTranslations' | 'quoteTranslations',
  language: 'en' | 'zh-CN' | 'id',
  event: Event,
) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('updateHomeWhyChooseReason', reason.id, {
    [group]: {
      ...reason[group],
      [language]: target.value,
    },
  })
}

function updateReasonBullets(reason: HomeWhyChooseReason, language: 'en' | 'zh-CN' | 'id', event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('updateHomeWhyChooseReason', reason.id, {
    bulletTranslations: {
      ...reason.bulletTranslations,
      [language]: target.value.split('\n').map(item => item.trim()).filter(Boolean),
    },
  })
}

function updateSearchPlaceholder(event: Event) {
  const target = event.target as HTMLInputElement
  emit('updateSearchSettings', {
    ...(props.locale === 'zh-CN' ? { placeholder: target.value } : {}),
    placeholderTranslations: {
      ...(props.searchSettings.placeholderTranslations ?? {}),
      [props.locale]: target.value,
    },
  })
}

function updateHomeTextTranslation(item: HomeText, language: 'en' | 'zh-CN' | 'id', event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('updateHomeText', item.key, {
    translations: {
      ...item.translations,
      [language]: target.value,
    },
  })
}

function updateModeTranslation(
  mode: HomeProcurementMode,
  group: 'badgeTranslations' | 'titleTranslations' | 'copyTranslations' | 'actionTranslations',
  language: 'en' | 'zh-CN' | 'id',
  event: Event,
) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('updateHomeProcurementMode', mode.id, {
    [group]: {
      ...mode[group],
      [language]: target.value,
    },
  })
}

function updateModeSteps(mode: HomeProcurementMode, language: 'en' | 'zh-CN' | 'id', event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('updateHomeProcurementMode', mode.id, {
    stepTranslations: {
      ...mode.stepTranslations,
      [language]: target.value.split('\n').map(item => item.trim()).filter(Boolean),
    },
  })
}

function updateScenarioTranslation(
  scenario: HomeScenario,
  group: 'titleTranslations' | 'copyTranslations' | 'demandTranslations',
  language: 'en' | 'zh-CN' | 'id',
  event: Event,
) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('updateHomeScenario', scenario.id, {
    [group]: {
      ...scenario[group],
      [language]: target.value,
    },
  })
}

function updateSupplierTranslation(
  supplier: HomeSupplier,
  group: 'nameTranslations' | 'badgeTranslations' | 'scopeTranslations',
  language: 'en' | 'zh-CN' | 'id',
  event: Event,
) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('updateHomeSupplier', supplier.id, {
    [group]: {
      ...supplier[group],
      [language]: target.value,
    },
  })
}

function updateCategoryTranslation(category: HomeCategoryFallback, language: 'en' | 'zh-CN' | 'id', event: Event) {
  const target = event.target as HTMLInputElement
  emit('updateHomeCategoryFallback', category.slug, {
    nameTranslations: {
      ...category.nameTranslations,
      [language]: target.value,
    },
  })
}

function updateProductTranslation(
  product: HomeProductFallback,
  group: 'nameTranslations',
  language: 'en' | 'zh-CN' | 'id',
  event: Event,
) {
  const target = event.target as HTMLInputElement
  emit('updateHomeProductFallback', product.slug, {
    [group]: {
      ...product[group],
      [language]: target.value,
    },
  })
}

</script>

<template>
  <div class="home-module-editor">
    <aside class="home-module-sidebar" aria-label="首页内容模块目录">
      <button
        v-for="group in editingGroups"
        :key="group.key"
        class="home-module-tab"
        :class="{ active: activeGroup === group.key }"
        type="button"
        @click="setActiveGroup(group.key)"
      >
        <span>
          <strong>{{ group.title }}</strong>
          <small>{{ group.scope }}</small>
        </span>
        <em>{{ group.count }}</em>
      </button>
    </aside>

    <div class="home-module-workspace">
      <section v-show="activeGroup === 'order'" class="config-panel section-sorter">
      <div class="panel-header">
        <div>
          <span class="system-label">首页板块</span>
          <h2>区域板块配置</h2>
        </div>
        <p>拖拽或使用上下按钮调整首页展示顺序。Banner 固定为第一屏，Hot Products 默认为第二顺序。</p>
      </div>

      <div class="section-list">
        <article
          v-for="(section, index) in sections"
          :key="section.id"
          class="section-row"
          :class="{ disabled: !section.enabled }"
          draggable="true"
          @dragstart="startDrag(index)"
          @dragover.prevent
          @drop="dropOn(index)"
        >
          <GripVertical class="row-grip" />
          <div class="row-index">{{ String(index + 1).padStart(2, '0') }}</div>
          <div class="row-copy">
            <strong>{{ section.name }}</strong>
            <small>{{ section.anchor }}</small>
            <p>{{ section.description }}</p>
          </div>
          <div class="row-actions">
            <button class="icon-button" type="button" aria-label="上移" title="上移" @click="emit('move', section.id, -1)">
              <ArrowUp />
            </button>
            <button class="icon-button" type="button" aria-label="下移" title="下移" @click="emit('move', section.id, 1)">
              <ArrowDown />
            </button>
            <button class="icon-button" type="button" aria-label="显示或隐藏板块" title="显示/隐藏" @click="emit('toggle', section.id)">
              <Eye v-if="section.enabled" />
              <EyeOff v-else />
            </button>
          </div>
        </article>
      </div>
      </section>

      <section v-show="activeGroup === 'search'" class="config-panel feature-card-editor">
      <div class="panel-header">
        <div>
          <span class="system-label">首页搜索</span>
          <h2>搜索框文案配置</h2>
        </div>
        <p>配置对外首页搜索框的占位提示，用户点击智能匹配后进入搜索结果页。</p>
      </div>

      <div class="feature-editor-grid single">
        <article class="feature-editor-card">
          <label>
            搜索框占位文案
            <input
              :value="localized(searchSettings.placeholderTranslations, searchSettings.placeholder)"
              type="text"
              placeholder="输入应用场景、设备需求或技术参数，如：工业园区配电改造..."
              @input="updateSearchPlaceholder"
            />
          </label>
        </article>
      </div>
      </section>

      <section v-show="activeGroup === 'common'" class="config-panel feature-card-editor">
      <div class="panel-header">
        <div>
          <span class="system-label">首页通用文案</span>
          <h2>按钮、表单和模块标题</h2>
        </div>
        <p>这些字段对应首页分类侧栏、快速询盘、查看更多、供应商等固定文案。</p>
      </div>

      <div class="feature-editor-grid">
        <article v-for="item in homeText" :key="item.key" class="feature-editor-card">
          <div class="feature-editor-head">
            <strong>{{ item.label || item.key }}</strong>
          </div>
          <label>
            {{ localeName }}文案
            <textarea
              rows="2"
              :value="localized(item.translations, item.value)"
              @input="updateHomeTextTranslation(item, locale, $event)"
            ></textarea>
          </label>
        </article>
      </div>
      </section>

      <section v-show="activeGroup === 'procurement'" class="config-panel feature-card-editor">
      <div class="panel-header">
        <div>
          <span class="system-label">采购模式</span>
          <h2>模式 A / 模式 B 卡片</h2>
        </div>
        <p>模式 A 的“进入产品库选品”会跳转产品中心；多选询价由产品中心页面承接。</p>
      </div>

      <div class="feature-editor-grid">
        <article
          v-for="mode in homeProcurementModes"
          :key="mode.id"
          class="feature-editor-card"
          :class="{ disabled: !mode.enabled }"
        >
          <div class="feature-editor-head">
            <strong>{{ localized(mode.badgeTranslations, mode.badge) }} · {{ localized(mode.titleTranslations, mode.title) }}</strong>
            <button class="icon-button" type="button" aria-label="显示或隐藏采购模式" title="显示/隐藏" @click="emit('updateHomeProcurementMode', mode.id, { enabled: !mode.enabled })">
              <Eye v-if="mode.enabled" />
              <EyeOff v-else />
            </button>
          </div>
          <label v-if="locale === 'zh-CN'">
            跳转链接
            <input :value="mode.to" type="text" @input="emit('updateHomeProcurementMode', mode.id, { to: ($event.target as HTMLInputElement).value })" />
          </label>
          <label>
            {{ localeName }}标识
            <input :value="localized(mode.badgeTranslations, mode.badge)" type="text" @input="updateModeTranslation(mode, 'badgeTranslations', locale, $event)" />
          </label>
          <label>
            {{ localeName }}标题
            <input :value="localized(mode.titleTranslations, mode.title)" type="text" @input="updateModeTranslation(mode, 'titleTranslations', locale, $event)" />
          </label>
          <label>
            {{ localeName }}文案
            <textarea rows="3" :value="localized(mode.copyTranslations, mode.copy)" @input="updateModeTranslation(mode, 'copyTranslations', locale, $event)"></textarea>
          </label>
          <label>
            {{ localeName }}步骤（每行一条）
            <textarea rows="3" :value="localizedList(mode.stepTranslations, mode.steps).join('\n')" @input="updateModeSteps(mode, locale, $event)"></textarea>
          </label>
          <label>
            {{ localeName }}按钮
            <input :value="localized(mode.actionTranslations, mode.action)" type="text" @input="updateModeTranslation(mode, 'actionTranslations', locale, $event)" />
          </label>
        </article>
      </div>
      </section>

      <section v-show="activeGroup === 'platform'" class="config-panel feature-card-editor">
      <div class="panel-header">
        <div>
          <span class="system-label">首页右侧</span>
          <h2>平台卖点模块</h2>
        </div>
        <p>正在维护 {{ localeName }}内容；图标、排序和展示状态由三种语言共用。</p>
      </div>

      <div class="feature-editor-grid">
        <article
          v-for="point in platformSellingPoints"
          :key="point.id"
          class="feature-editor-card"
          :class="{ disabled: !point.enabled }"
        >
          <div class="feature-editor-head">
            <strong>{{ localized(point.titleTranslations, point.title) || '未命名卖点' }}</strong>
            <div class="row-actions compact">
              <button class="icon-button" type="button" aria-label="上移" title="上移" @click="emit('movePlatformSellingPoint', point.id, -1)">
                <ArrowUp />
              </button>
              <button class="icon-button" type="button" aria-label="下移" title="下移" @click="emit('movePlatformSellingPoint', point.id, 1)">
                <ArrowDown />
              </button>
              <button class="icon-button" type="button" aria-label="显示或隐藏平台卖点" title="显示/隐藏" @click="emit('updatePlatformSellingPoint', point.id, { enabled: !point.enabled })">
                <Eye v-if="point.enabled" />
                <EyeOff v-else />
              </button>
            </div>
          </div>
          <label v-if="locale === 'zh-CN'">
            图标
            <select :value="point.icon" @change="updatePlatformText(point.id, 'icon', $event)">
              <option value="shield">质保</option>
              <option value="headphones">服务</option>
              <option value="globe">全球网络</option>
              <option value="badge">认证</option>
              <option value="truck">运输</option>
              <option value="factory">生产</option>
            </select>
          </label>
          <label>
            {{ localeName }}标题
            <input :value="localized(point.titleTranslations, point.title)" type="text" @input="updatePlatformTranslation(point, 'titleTranslations', $event)" />
          </label>
          <label>
            {{ localeName }}文案
            <textarea rows="3" :value="localized(point.contentTranslations, point.content)" @input="updatePlatformTranslation(point, 'contentTranslations', $event)"></textarea>
          </label>
        </article>
      </div>
      </section>

      <section v-show="activeGroup === 'why'" class="config-panel feature-card-editor">
      <div class="panel-header">
        <div>
          <span class="system-label">为什么选择</span>
          <h2>首页“为什么选择 ExampleCorp”文案</h2>
        </div>
        <p>配置首页“为什么选择”模块内标题、详情按钮和所有原因卡片文案。保存后对外首页同步展示，排版保持现有样式。</p>
      </div>

      <div class="feature-editor-grid single">
        <article class="feature-editor-card">
          <div class="field-grid two">
            <label>
              {{ localeName }}模块标题
              <input :value="localized(homeWhyChoose.titleTranslations, homeWhyChoose.title)" type="text" @input="updateWhyChooseTranslation('titleTranslations', locale, $event)" />
            </label>
            <label>
              {{ localeName }}按钮文案
              <input :value="localized(homeWhyChoose.ctaTextTranslations, homeWhyChoose.ctaText)" type="text" @input="updateWhyChooseTranslation('ctaTextTranslations', locale, $event)" />
            </label>
          </div>
        </article>
      </div>

      <div class="feature-editor-grid">
        <article
          v-for="reason in homeWhyChoose.reasons"
          :key="reason.id"
          class="feature-editor-card"
          :class="{ disabled: !reason.enabled }"
        >
          <div class="feature-editor-head">
            <strong>{{ reason.number }} · {{ localized(reason.titleTranslations, reason.title) || '未命名原因' }}</strong>
            <button class="icon-button" type="button" aria-label="显示或隐藏原因卡片" title="显示/隐藏" @click="emit('updateHomeWhyChooseReason', reason.id, { enabled: !reason.enabled })">
              <Eye v-if="reason.enabled" />
              <EyeOff v-else />
            </button>
          </div>
          <label v-if="locale === 'zh-CN'">
            编号
            <input :value="reason.number" type="text" @input="updateReasonText(reason.id, 'number', $event)" />
          </label>
          <label>
            {{ localeName }}标题
            <input :value="localized(reason.titleTranslations, reason.title)" type="text" @input="updateReasonTranslation(reason, 'titleTranslations', locale, $event)" />
          </label>
          <label>
            {{ localeName }}副标题
            <input :value="localized(reason.subtitleTranslations, reason.subtitle)" type="text" @input="updateReasonTranslation(reason, 'subtitleTranslations', locale, $event)" />
          </label>
          <label>
            {{ localeName }}引语
            <textarea rows="3" :value="localized(reason.quoteTranslations, reason.quote)" @input="updateReasonTranslation(reason, 'quoteTranslations', locale, $event)"></textarea>
          </label>
          <label>
            {{ localeName }}要点（每行一条）
            <textarea rows="3" :value="localizedList(reason.bulletTranslations, reason.bullets).join('\n')" @input="updateReasonBullets(reason, locale, $event)"></textarea>
          </label>
        </article>
      </div>
      </section>

      <section v-show="activeGroup === 'scenarios'" class="config-panel feature-card-editor">
      <div class="panel-header">
        <div>
          <span class="system-label">应用场景</span>
          <h2>首页场景卡片</h2>
        </div>
        <p>场景卡片点击后会把“需求文案”写入首页快速询盘框。</p>
      </div>

      <div class="feature-editor-grid">
        <article
          v-for="scenario in homeScenarios"
          :key="scenario.id"
          class="feature-editor-card"
          :class="{ disabled: !scenario.enabled }"
        >
          <div class="feature-editor-head">
            <strong>{{ scenario.icon }} {{ localized(scenario.titleTranslations, scenario.title) }}</strong>
            <button class="icon-button" type="button" aria-label="显示或隐藏场景" title="显示/隐藏" @click="emit('updateHomeScenario', scenario.id, { enabled: !scenario.enabled })">
              <Eye v-if="scenario.enabled" />
              <EyeOff v-else />
            </button>
          </div>
          <label v-if="locale === 'zh-CN'">
            图标
            <input :value="scenario.icon" type="text" @input="emit('updateHomeScenario', scenario.id, { icon: ($event.target as HTMLInputElement).value })" />
          </label>
          <label>
            {{ localeName }}标题
            <input :value="localized(scenario.titleTranslations, scenario.title)" type="text" @input="updateScenarioTranslation(scenario, 'titleTranslations', locale, $event)" />
          </label>
          <label>
            {{ localeName }}卡片文案
            <textarea rows="3" :value="localized(scenario.copyTranslations, scenario.copy)" @input="updateScenarioTranslation(scenario, 'copyTranslations', locale, $event)"></textarea>
          </label>
          <label>
            {{ localeName }}需求文案
            <textarea rows="2" :value="localized(scenario.demandTranslations, scenario.demand)" @input="updateScenarioTranslation(scenario, 'demandTranslations', locale, $event)"></textarea>
          </label>
        </article>
      </div>
      </section>

      <section v-show="activeGroup === 'suppliers'" class="config-panel feature-card-editor">
      <div class="panel-header">
        <div>
          <span class="system-label">供应商</span>
          <h2>首页战略合作供应商</h2>
        </div>
        <p>对应首页底部供应商卡片，详情入口指向“关于我们”。</p>
      </div>

      <div class="feature-editor-grid">
        <article
          v-for="supplier in homeSuppliers"
          :key="supplier.id"
          class="feature-editor-card"
          :class="{ disabled: !supplier.enabled }"
        >
          <div class="feature-editor-head">
            <strong>{{ supplier.icon }} {{ localized(supplier.nameTranslations, supplier.name) }}</strong>
            <button class="icon-button" type="button" aria-label="显示或隐藏供应商" title="显示/隐藏" @click="emit('updateHomeSupplier', supplier.id, { enabled: !supplier.enabled })">
              <Eye v-if="supplier.enabled" />
              <EyeOff v-else />
            </button>
          </div>
          <label v-if="locale === 'zh-CN'">
            图标
            <input :value="supplier.icon" type="text" @input="emit('updateHomeSupplier', supplier.id, { icon: ($event.target as HTMLInputElement).value })" />
          </label>
          <label>
            {{ localeName }}名称
            <input :value="localized(supplier.nameTranslations, supplier.name)" type="text" @input="updateSupplierTranslation(supplier, 'nameTranslations', locale, $event)" />
          </label>
          <label>
            {{ localeName }}标记
            <input :value="localized(supplier.badgeTranslations, supplier.badge)" type="text" @input="updateSupplierTranslation(supplier, 'badgeTranslations', locale, $event)" />
          </label>
          <label>
            {{ localeName }}范围
            <input :value="localized(supplier.scopeTranslations, supplier.scope)" type="text" @input="updateSupplierTranslation(supplier, 'scopeTranslations', locale, $event)" />
          </label>
        </article>
      </div>
      </section>

      <section v-show="activeGroup === 'fallback'" class="config-panel feature-card-editor">
      <div class="panel-header">
        <div>
          <span class="system-label">兜底内容</span>
          <h2>首页分类和热品兜底数据</h2>
        </div>
        <p>当接口没有返回分类或热品时，首页使用这些后台配置的数据兜底展示。</p>
      </div>

      <div class="feature-editor-grid">
        <article
          v-for="category in homeCategoryFallback"
          :key="category.slug"
          class="feature-editor-card"
          :class="{ disabled: !category.enabled }"
        >
          <div class="feature-editor-head">
            <strong>{{ category.icon }} {{ localized(category.nameTranslations, category.name) }}</strong>
            <button class="icon-button" type="button" aria-label="显示或隐藏兜底分类" title="显示/隐藏" @click="emit('updateHomeCategoryFallback', category.slug, { enabled: !category.enabled })">
              <Eye v-if="category.enabled" />
              <EyeOff v-else />
            </button>
          </div>
          <div v-if="locale === 'zh-CN'" class="field-grid two">
            <label>
              SKU
              <input :value="category.sku" type="text" @input="emit('updateHomeCategoryFallback', category.slug, { sku: ($event.target as HTMLInputElement).value })" />
            </label>
            <label>
              图标
              <input :value="category.icon" type="text" @input="emit('updateHomeCategoryFallback', category.slug, { icon: ($event.target as HTMLInputElement).value })" />
            </label>
          </div>
          <label>
            {{ localeName }}分类名
            <input :value="localized(category.nameTranslations, category.name)" type="text" @input="updateCategoryTranslation(category, locale, $event)" />
          </label>
        </article>

        <article
          v-for="product in homeProductFallback"
          :key="product.slug"
          class="feature-editor-card"
          :class="{ disabled: !product.enabled }"
        >
          <div class="feature-editor-head">
            <strong>{{ product.icon }} {{ localized(product.nameTranslations, product.name) }}</strong>
            <button class="icon-button" type="button" aria-label="显示或隐藏兜底产品" title="显示/隐藏" @click="emit('updateHomeProductFallback', product.slug, { enabled: !product.enabled })">
              <Eye v-if="product.enabled" />
              <EyeOff v-else />
            </button>
          </div>
          <label v-if="locale === 'zh-CN'">
            分类 slug
            <input :value="product.categorySlug" type="text" @input="emit('updateHomeProductFallback', product.slug, { categorySlug: ($event.target as HTMLInputElement).value })" />
          </label>
          <label>
            {{ localeName }}名称
            <input :value="localized(product.nameTranslations, product.name)" type="text" @input="updateProductTranslation(product, 'nameTranslations', locale, $event)" />
          </label>
        </article>
      </div>
      </section>
    </div>
  </div>
</template>
