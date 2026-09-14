<script setup lang="ts">
import { ImagePlus, Pencil, Plus, Save, ToggleLeft, ToggleRight, Trash2, X } from '@lucide/vue'
import { computed, nextTick, shallowRef } from 'vue'
import { resolveOptimizedAssetUrl } from '../../api/client'
import type { BannerCarouselSettings, BannerConfig, WebsiteLocale } from '../../types/websiteConfig'

const props = defineProps<{
  banners: BannerConfig[]
  carousel: BannerCarouselSettings
  isSaving: boolean
  locale: WebsiteLocale
}>()

const emit = defineEmits<{
  add: []
  remove: [id: string]
  save: []
  update: [id: string, patch: Partial<BannerConfig>]
  updateCarousel: [patch: Partial<BannerCarouselSettings>]
  upload: [id: string, file: File]
}>()

const activeBannerId = shallowRef('')
const editorOpen = shallowRef(false)
const activeBanner = computed(() => props.banners.find(banner => banner.id === activeBannerId.value) ?? null)
const enabledCount = computed(() => props.banners.filter(banner => banner.enabled).length)

function bannerText(banner: BannerConfig, field: 'title' | 'subtitle') {
  const translations = field === 'title' ? banner.titleTranslations : banner.subtitleTranslations
  return translations?.[props.locale] ?? (props.locale === 'zh-CN' ? banner[field] : '')
}

function updateBannerText(banner: BannerConfig, field: 'title' | 'subtitle', event: Event) {
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
  const translationField = field === 'title' ? 'titleTranslations' : 'subtitleTranslations'
  emit('update', banner.id, {
    ...(props.locale === 'zh-CN' ? { [field]: value } : {}),
    [translationField]: { ...(banner[translationField] ?? {}), [props.locale]: value },
  })
}

function normalizeBannerLink(banner: BannerConfig, event: Event) {
  const value = (event.target as HTMLInputElement).value.trim()
  if (!value) return
  if (/^https:\/\//i.test(value)) return
  const path = value.startsWith('/') ? value : `/${value}`
  emit('update', banner.id, { linkUrl: `https://example.com${path}` })
}

function handleUpload(id: string, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('upload', id, file)
  input.value = ''
}

function openEditor(id: string) {
  activeBannerId.value = id
  editorOpen.value = true
}

function closeEditor() {
  editorOpen.value = false
}

function removeBanner(banner: BannerConfig) {
  const title = bannerText(banner, 'title') || banner.title || '未命名 Banner'
  const confirmed = window.confirm(`确认删除「${title}」？此操作保存后不可恢复。`)
  if (!confirmed) return
  emit('remove', banner.id)
  emit('save')
  if (activeBannerId.value === banner.id) closeEditor()
}

function updateCarousel(patch: Partial<BannerCarouselSettings>) {
  emit('updateCarousel', patch)
  emit('save')
}

function toggleBanner(banner: BannerConfig) {
  emit('update', banner.id, { enabled: !banner.enabled })
  emit('save')
}

async function createBanner() {
  const previousIds = new Set(props.banners.map(banner => banner.id))
  emit('add')
  await nextTick()
  const newBanner = props.banners.find(banner => !previousIds.has(banner.id)) ?? props.banners.at(-1)
  if (newBanner) openEditor(newBanner.id)
}
</script>

<template>
  <section class="config-panel banner-library">
    <div class="panel-header split banner-library-header">
      <h2 class="banner-library-title">首页首屏资源</h2>
      <button class="primary-button compact" type="button" @click="createBanner">
        <Plus class="button-icon" />
        <span>新增</span>
      </button>
    </div>

    <div class="banner-library-toolbar" aria-label="轮播设置">
      <div class="banner-library-count">
        <strong>{{ banners.length }}</strong>
        <span>全部 Banner</span>
        <i aria-hidden="true"></i>
        <strong>{{ enabledCount }}</strong>
        <span>正在展示</span>
      </div>
      <label class="banner-autoplay-control">
        <input
          :checked="carousel.autoplay"
          type="checkbox"
          @change="updateCarousel({ autoplay: ($event.target as HTMLInputElement).checked })"
        />
        <span>自动轮播</span>
      </label>
      <label class="banner-interval-control">
        <span>切换间隔</span>
        <input
          min="1"
          step="1"
          type="number"
          :value="carousel.intervalSeconds"
          @change="updateCarousel({ intervalSeconds: Number(($event.target as HTMLInputElement).value) || 5 })"
        />
        <span>秒</span>
      </label>
    </div>

    <div class="data-table-wrap">
      <table class="data-table banner-data-table">
        <thead>
          <tr>
            <th>Banner</th>
            <th>标题 / 副标题</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(banner, index) in banners" :key="banner.id" :class="{ disabled: !banner.enabled }">
            <td>
              <div class="banner-table-media">
                <span class="banner-table-index">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="banner-table-thumb">
                  <img v-if="banner.imageUrl" :src="resolveOptimizedAssetUrl(banner.imageUrl, 640)" :alt="bannerText(banner, 'title')" loading="lazy" decoding="async" />
                  <ImagePlus v-else />
                </span>
              </div>
            </td>
            <td>
              <div class="banner-table-copy">
                <strong>{{ bannerText(banner, 'title') || '未命名 Banner' }}</strong>
                <span>{{ bannerText(banner, 'subtitle') || '暂无副标题' }}</span>
              </div>
            </td>
            <td>
              <span class="status-pill" :class="banner.enabled ? 'status-won' : 'status-archived'">
                {{ banner.enabled ? '展示中' : '已隐藏' }}
              </span>
            </td>
            <td>
              <div class="table-actions">
                <button class="icon-button" type="button" aria-label="编辑 Banner" title="编辑 Banner" @click="openEditor(banner.id)">
                  <Pencil />
                </button>
                <button
                  class="icon-button"
                  type="button"
                  :aria-label="banner.enabled ? '隐藏 Banner' : '展示 Banner'"
                  :title="banner.enabled ? '隐藏 Banner' : '展示 Banner'"
                  @click="toggleBanner(banner)"
                >
                  <ToggleRight v-if="banner.enabled" />
                  <ToggleLeft v-else />
                </button>
                <button
                  class="icon-button danger-icon"
                  type="button"
                  aria-label="删除 Banner"
                  title="删除 Banner"
                  @click="removeBanner(banner)"
                >
                  <Trash2 />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!banners.length">
            <td class="banner-empty-row" colspan="4">暂无 Banner，点击右上角新增。</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="editorOpen && activeBanner" class="modal-backdrop" role="presentation" @click.self="closeEditor">
      <section class="modal-panel banner-editor-modal" role="dialog" aria-modal="true" aria-label="编辑 Banner">
        <button class="icon-button modal-close" type="button" aria-label="关闭弹窗" @click="closeEditor">
          <X />
        </button>

        <div class="banner-editor-layout">
          <div class="banner-editor-media">
            <div class="banner-editor-preview">
              <img v-if="activeBanner.imageUrl" :src="resolveOptimizedAssetUrl(activeBanner.imageUrl, 1280)" :alt="bannerText(activeBanner, 'title')" decoding="async" />
              <div v-else class="banner-editor-empty">
                <ImagePlus />
                <span>尚未上传图片</span>
              </div>
            </div>
            <label class="upload-button banner-upload-button">
              <ImagePlus class="button-icon" />
              <span>更换图片</span>
              <input accept="image/*" type="file" @change="handleUpload(activeBanner.id, $event)" />
            </label>
          </div>

          <div class="banner-editor-fields">
            <label>
              标题
              <input :value="bannerText(activeBanner, 'title')" @input="updateBannerText(activeBanner, 'title', $event)" />
            </label>
            <label>
              副标题
              <textarea :value="bannerText(activeBanner, 'subtitle')" rows="4" @input="updateBannerText(activeBanner, 'subtitle', $event)" />
            </label>
            <label>
              跳转链接
              <input
                :value="activeBanner.linkUrl"
                placeholder="https://example.com/products/..."
                inputmode="url"
                type="url"
                @input="emit('update', activeBanner.id, { linkUrl: ($event.target as HTMLInputElement).value })"
                @blur="normalizeBannerLink(activeBanner, $event)"
              />
              <small class="field-hint">请输入完整的 http/https 地址，点击后可直接打开。</small>
            </label>
            <label>
              发布状态
              <select :value="activeBanner.enabled ? 'enabled' : 'disabled'" @change="emit('update', activeBanner.id, { enabled: ($event.target as HTMLSelectElement).value === 'enabled' })">
                <option value="enabled">展示中</option>
                <option value="disabled">已隐藏</option>
              </select>
            </label>
          </div>
        </div>

        <footer class="banner-editor-footer">
          <button class="ghost-button compact" type="button" @click="closeEditor">取消</button>
          <button class="primary-button compact" type="button" :disabled="isSaving" @click="emit('save')">
            <Save class="button-icon" />
            <span>{{ isSaving ? '保存中...' : '保存' }}</span>
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.banner-library {
  min-width: 0;
}

.banner-library-header {
  align-items: center;
}

.banner-library-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
}

.banner-library-toolbar {
  min-height: 58px;
  margin-bottom: 8px;
  border-block: 1px solid var(--border);
  padding: 10px 0;
  display: flex;
  align-items: center;
  gap: 22px;
}

.banner-library-count {
  margin-right: auto;
  display: flex;
  align-items: baseline;
  gap: 7px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}

.banner-library-count strong {
  color: var(--ink);
  font-size: 18px;
}

.banner-library-count i {
  width: 1px;
  height: 18px;
  margin: 0 5px;
  background: var(--border);
}

.banner-autoplay-control,
.banner-interval-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #344054;
  font-size: 13px;
  font-weight: 850;
}

.banner-autoplay-control input {
  width: 16px;
  height: 16px;
}

.banner-interval-control input {
  width: 72px;
  min-height: 36px;
  padding-inline: 10px;
}

.banner-data-table {
  min-width: 620px;
  table-layout: fixed;
}

.banner-data-table th:first-child,
.banner-data-table td:first-child {
  width: 144px;
}

.banner-data-table th:nth-child(2),
.banner-data-table td:nth-child(2) {
  width: auto;
}

.banner-data-table th:nth-child(3),
.banner-data-table td:nth-child(3) {
  width: 76px;
}

.banner-data-table th:last-child,
.banner-data-table td:last-child {
  width: 136px;
}

.banner-data-table tbody tr:hover td {
  background: #fbfdff;
}

.banner-table-media {
  display: flex;
  align-items: center;
  gap: 10px;
}

.banner-table-index {
  color: #98a2b3;
  font-size: 11px;
  font-weight: 950;
}

.banner-table-thumb {
  width: 90px;
  aspect-ratio: 1920 / 413;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: #eef2f6;
  color: #64748b;
}

.banner-table-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-table-thumb svg {
  width: 18px;
  height: 18px;
}

.banner-table-copy {
  min-width: 0;
}

.banner-table-copy span {
  margin-top: 5px;
  display: -webkit-box;
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.banner-data-table .status-pill {
  white-space: nowrap;
}

.banner-empty-row {
  padding-block: 34px !important;
  color: var(--muted) !important;
  text-align: center !important;
}

.banner-editor-modal {
  width: min(1040px, 100%);
}

.banner-editor-layout {
  padding-top: 40px;
  display: grid;
  grid-template-columns: minmax(320px, 0.92fr) minmax(0, 1.08fr);
  gap: 24px;
  align-items: start;
}

.banner-editor-footer {
  margin-top: 20px;
  border-top: 1px solid var(--border);
  padding-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.banner-editor-media,
.banner-editor-fields {
  display: grid;
  gap: 14px;
}

.banner-editor-preview {
  width: 100%;
  aspect-ratio: 1920 / 413;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: #eef2f6;
}

.banner-editor-preview img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.banner-editor-empty {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 9px;
  color: #64748b;
  font-size: 13px;
  font-weight: 850;
}

.banner-editor-empty svg {
  width: 28px;
  height: 28px;
}

.banner-upload-button {
  width: 100%;
  justify-content: center;
}

@media (max-width: 760px) {
  .banner-library-toolbar {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .banner-library-count {
    margin-right: 0;
  }

  .banner-editor-layout {
    grid-template-columns: 1fr;
  }

}
</style>
