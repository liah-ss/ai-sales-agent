<script setup lang="ts">
import { FileUp, ImagePlus, Plus, Trash2 } from '@lucide/vue'
import { computed, shallowRef, watch } from 'vue'
import { resolveAssetUrl } from '../../api/client'
import type { ContentBlock, PageContentConfig, WebsiteLocale } from '../../types/websiteConfig'

const props = defineProps<{
  page: PageContentConfig
  locale: WebsiteLocale
}>()

const emit = defineEmits<{
  addBlock: [key: PageContentConfig['key']]
  updatePage: [key: PageContentConfig['key'], patch: Partial<PageContentConfig>]
  updateBlock: [key: PageContentConfig['key'], blockId: string, patch: Partial<ContentBlock>]
  removeBlock: [key: PageContentConfig['key'], blockId: string]
  uploadHero: [key: PageContentConfig['key'], file: File]
  uploadBlockImage: [key: PageContentConfig['key'], blockId: string, file: File]
  addImportFiles: [key: PageContentConfig['key'], files: File[]]
}>()

function handleHeroUpload(key: PageContentConfig['key'], event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('uploadHero', key, file)
  input.value = ''
}

function handleImport(key: PageContentConfig['key'], event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length > 0) emit('addImportFiles', key, files)
  input.value = ''
}

function handleBlockImageUpload(key: PageContentConfig['key'], blockId: string, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('uploadBlockImage', key, blockId, file)
  input.value = ''
}

const activeArea = shallowRef('basics')
const isProductTemplate = computed(() => props.page.key === 'product')
const isSolutionTemplate = computed(() => props.page.key === 'solution')
const localeLabel = computed(() => ({ 'zh-CN': '中文', id: '东南亚语', en: '英文' })[props.locale])
const pageAreas = computed(() => isSolutionTemplate.value
  ? [
      { key: 'basics', title: '顶部横幅', scope: '标题、摘要与头图', count: 3 },
      { key: 'structure', title: '方案主体结构', scope: '左侧目录、右侧方案内容来源', count: 5 },
      { key: 'modules', title: '补充内容模块', scope: '主体下方附加图文和 CTA', count: props.page.blocks.length },
      { key: 'media', title: '素材与导入', scope: '页面主图、Word 导入队列', count: props.page.imports.length },
    ]
  : isProductTemplate.value
    ? [
        { key: 'basics', title: '有效展示配置', scope: '默认头图、标题与摘要', count: 3 },
      ]
    : [
      { key: 'basics', title: '基础信息', scope: '标题与摘要', count: 2 },
      { key: 'modules', title: '图文内容模块', scope: '段落、图片、规格、CTA', count: props.page.blocks.length },
      { key: 'media', title: '头图与导入', scope: '页面主图、Word 导入队列', count: props.page.imports.length },
    ])
const solutionTemplateSources = [
  { title: '左侧场景目录', fields: '场景名称、排序、启用状态', owner: '解决方案数据' },
  { title: '右侧首屏方案卡', fields: '标题、摘要、场景图片', owner: '解决方案数据' },
  { title: '方案正文', fields: '标题、正文、表格、图片和链接', owner: '解决方案数据' },
]
const effectivePathLabel = computed(() => {
  if (isProductTemplate.value) return '产品详情页全局模板'
  return props.page.pagePath
})

function pageText(field: 'headline' | 'summary') {
  const translations = field === 'headline' ? props.page.headlineTranslations : props.page.summaryTranslations
  return translations?.[props.locale] ?? (props.locale === 'zh-CN' ? props.page[field] : '')
}

function updatePageText(field: 'headline' | 'summary', event: Event) {
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
  const translationField = field === 'headline' ? 'headlineTranslations' : 'summaryTranslations'
  emit('updatePage', props.page.key, {
    ...(props.locale === 'zh-CN' ? { [field]: value } : {}),
    [translationField]: { ...(props.page[translationField] ?? {}), [props.locale]: value },
  })
}

function blockText(block: ContentBlock, field: 'title' | 'body') {
  const translations = field === 'title' ? block.titleTranslations : block.bodyTranslations
  return translations?.[props.locale] ?? (props.locale === 'zh-CN' ? block[field] : '')
}

function updateBlockText(block: ContentBlock, field: 'title' | 'body', event: Event) {
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
  const translationField = field === 'title' ? 'titleTranslations' : 'bodyTranslations'
  emit('updateBlock', props.page.key, block.id, {
    ...(props.locale === 'zh-CN' ? { [field]: value } : {}),
    [translationField]: { ...(block[translationField] ?? {}), [props.locale]: value },
  })
}

watch(() => props.page.key, () => {
  activeArea.value = 'basics'
})
</script>

<template>
  <section class="config-panel content-editor">
    <div v-if="page.key === 'about'" class="panel-header">
      <div>
        <span class="system-label">{{ effectivePathLabel }}</span>
        <h2>{{ page.label }}</h2>
      </div>
      <p>{{ pageText('summary') }}</p>
    </div>

    <div class="page-template-editor" :class="{ 'single-area': isProductTemplate }">
      <aside v-if="!isProductTemplate" class="home-module-sidebar" aria-label="页面模板内容目录">
        <div v-if="page.key === 'about'" class="home-module-sidebar-head">
          <span class="system-label">按页面区域编辑</span>
          <strong>{{ page.label }}</strong>
          <small>{{ effectivePathLabel }}</small>
        </div>
        <button
          v-for="area in pageAreas"
          :key="area.key"
          class="home-module-tab"
          :class="{ active: activeArea === area.key }"
          type="button"
          @click="activeArea = area.key"
        >
          <span>
            <strong>{{ area.title }}</strong>
            <small>{{ area.scope }}</small>
          </span>
          <em>{{ area.count }}</em>
        </button>
      </aside>

      <div class="template-module-workspace">
      <section v-if="isProductTemplate" v-show="activeArea === 'basics'" class="page-editor-section product-template-settings">
        <div class="section-title">
          <div>
            <span class="system-label">产品详情页有效配置</span>
            <h3>默认头图与基础文案</h3>
          </div>
          <small>产品名称、型号、价格、参数、物流和质保请在“产品库”维护；这里仅保留会影响所有产品详情页的配置。</small>
        </div>

        <div class="product-template-grid">
          <div class="product-template-fields">
            <label>
              模板标题
              <input :value="pageText('headline')" @input="updatePageText('headline', $event)" />
            </label>
            <label>
              模板摘要
              <textarea :value="pageText('summary')" rows="4" @input="updatePageText('summary', $event)" />
            </label>
          </div>

          <div class="product-template-media">
            <div class="hero-preview">
              <img v-if="page.heroImageUrl" :src="resolveAssetUrl(page.heroImageUrl)" :alt="page.label" />
              <div v-else class="empty-media">
                <ImagePlus />
                <span>上传默认头图</span>
              </div>
            </div>
            <label class="upload-button full">
              <ImagePlus class="button-icon" />
              <span>更换图片</span>
              <input accept="image/*" type="file" @change="handleHeroUpload(page.key, $event)" />
            </label>
            <p class="field-hint">用于产品详情页顶部背景，并在产品没有图片时作为图库兜底图。</p>
          </div>
        </div>
      </section>

      <section v-else v-show="activeArea === 'basics'" class="page-editor-section page-basics compact">
        <div class="section-title">
          <div>
            <span class="system-label">{{ isSolutionTemplate ? '前台 /solutions 顶部' : '页面基础' }}</span>
            <h3>{{ isSolutionTemplate ? '顶部横幅' : '基础信息' }}</h3>
          </div>
          <small>{{ isSolutionTemplate ? `编辑${localeLabel}顶部标题与摘要，主图由三种语言共用。` : `编辑${localeLabel}页面标题与摘要。` }}</small>
        </div>
        <div class="field-grid two">
          <label>
            标题
            <input :value="pageText('headline')" @input="updatePageText('headline', $event)" />
          </label>
        </div>

        <div class="field-grid two">
          <label>
            摘要
            <textarea :value="pageText('summary')" rows="4" @input="updatePageText('summary', $event)" />
          </label>
        </div>
      </section>

      <section v-if="isSolutionTemplate" v-show="activeArea === 'structure'" class="page-editor-section solution-template-section">
        <div class="section-title">
          <div>
            <span class="system-label">对外页主体映射</span>
            <h3>左侧场景目录 + 右侧方案内容</h3>
          </div>
          <small>这里说明前台每个主要区块由哪个后台模块控制，避免在通用内容模块里找不到字段。</small>
        </div>

        <div class="solution-template-preview">
          <aside>
            <strong>场景目录</strong>
            <span>工业园区配电</span>
            <span>光伏电站配套</span>
            <span>充电桩建设</span>
            <small>来源：解决方案数据列表</small>
          </aside>
          <main>
            <div class="preview-hero-line">
              <strong>当前场景解决方案</strong>
              <em>标题 / 摘要 / 场景图片</em>
            </div>
            <div class="preview-module-grid"><span>方案正文</span></div>
          </main>
        </div>

        <div class="solution-source-grid">
          <article v-for="source in solutionTemplateSources" :key="source.title">
            <strong>{{ source.title }}</strong>
            <p>{{ source.fields }}</p>
            <span>{{ source.owner }}</span>
          </article>
        </div>

        <div class="solution-template-action">
          <div>
            <strong>要修改具体场景的标题、图片和方案正文</strong>
            <p>进入管理后台“解决方案”数据管理，编辑每个场景。保存后对外网页左侧目录和右侧方案内容同步更新。</p>
          </div>
          <RouterLink class="primary-button compact" to="/solutions">去维护解决方案数据</RouterLink>
        </div>
      </section>

      <section v-show="activeArea === 'modules'" class="page-editor-section content-modules">
        <div class="content-blocks-title">
          <div>
            <span class="system-label">{{ isSolutionTemplate ? '主体下方' : '内容模块' }}</span>
            <h2>{{ isSolutionTemplate ? '补充内容模块' : '图文内容模块' }}</h2>
            <p>{{ isSolutionTemplate ? '这些模块显示在解决方案主体下方；左侧目录和右侧方案正文请在“解决方案数据”维护。' : '按展示顺序维护页面段落、图片和 CTA，保存后同步到对外网站。' }}</p>
          </div>
          <button class="primary-button compact" type="button" @click="emit('addBlock', page.key)">
            <Plus class="button-icon" />
            <span>新增</span>
          </button>
        </div>

        <div class="block-stack">
          <article v-for="(block, index) in page.blocks" :key="block.id" class="content-block">
            <div class="content-block-index">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <strong>{{ blockText(block, 'title') || '未命名模块' }}</strong>
            </div>
            <div class="content-block-meta">
              <label>
                模块格式
                <select :value="block.type" @change="emit('updateBlock', page.key, block.id, { type: ($event.target as HTMLSelectElement).value as ContentBlock['type'] })">
                  <option value="heading">标题</option>
                  <option value="paragraph">段落</option>
                  <option value="image">图片</option>
                  <option value="specs">规格</option>
                  <option value="cta">CTA</option>
                </select>
              </label>
              <label>
                模块标题
                <input :value="blockText(block, 'title')" @input="updateBlockText(block, 'title', $event)" />
              </label>
              <label v-if="block.type === 'image'" class="upload-button full">
                <ImagePlus class="button-icon" />
                <span>上传模块图片</span>
                <input accept="image/*" type="file" @change="handleBlockImageUpload(page.key, block.id, $event)" />
              </label>
            </div>
            <label class="content-block-body">
              {{ block.type === 'image' ? '图片 URL 或说明文字' : '模块内容' }}
              <textarea
                :value="block.type === 'image' ? block.body : blockText(block, 'body')"
                rows="4"
                @input="block.type === 'image' ? emit('updateBlock', page.key, block.id, { body: ($event.target as HTMLTextAreaElement).value }) : updateBlockText(block, 'body', $event)"
              />
            </label>
            <button class="ghost-button compact-danger content-block-delete" type="button" @click="emit('removeBlock', page.key, block.id)">
              <Trash2 class="button-icon" />
              <span>删除</span>
            </button>
          </article>
        </div>
      </section>

      <aside v-show="activeArea === 'media'" class="content-side">
        <div class="section-title">
          <div>
            <span class="system-label">素材工具</span>
            <h3>头图与批量导入</h3>
          </div>
        </div>
        <div class="hero-preview">
          <img v-if="page.heroImageUrl" :src="resolveAssetUrl(page.heroImageUrl)" :alt="page.label" />
          <div v-else class="empty-media">
            <ImagePlus />
            <span>上传头图</span>
          </div>
        </div>
        <label class="upload-button full">
          <ImagePlus class="button-icon" />
          <span>更换图片</span>
          <input accept="image/*" type="file" @change="handleHeroUpload(page.key, $event)" />
        </label>

        <div v-if="page.importEnabled" class="import-panel">
          <div>
            <span class="system-label">批量导入</span>
            <h3>Word 解析队列</h3>
            <p>上传 .doc 或 .docx 后进入后端解析队列，用于批量生成图文内容草稿。</p>
          </div>
          <label class="upload-button full">
            <FileUp class="button-icon" />
            <span>导入 Word 文件</span>
            <input accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple type="file" @change="handleImport(page.key, $event)" />
          </label>
          <ul v-if="page.imports.length" class="import-list">
            <li v-for="record in page.imports" :key="record.id">
              <strong>{{ record.fileName }}</strong>
              <span>{{ record.fileType }} · {{ record.fileSize }} · {{ record.status }}</span>
            </li>
          </ul>
        </div>
      </aside>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page-template-editor.single-area {
  grid-template-columns: 1fr;
}
</style>
