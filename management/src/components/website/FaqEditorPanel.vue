<script setup lang="ts">
import { CircleHelp, Plus, Trash2 } from '@lucide/vue'
import type { FaqCategory, FaqItem, FaqPageConfig, FaqPageTextKey, WebsiteLocale } from '../../types/websiteConfig'

const props = defineProps<{
  faq: FaqPageConfig
  locale: WebsiteLocale
}>()

const emit = defineEmits<{
  updatePage: [patch: Partial<FaqPageConfig>]
  updateCategory: [categoryId: string, patch: Partial<FaqCategory>]
  updateItem: [categoryId: string, itemId: string, patch: Partial<FaqItem>]
  addItem: [categoryId: string]
  removeItem: [categoryId: string, itemId: string]
}>()

const pageFields: Array<{ key: FaqPageTextKey, label: string, multiline?: boolean }> = [
  { key: 'eyebrow', label: '顶部标识' },
  { key: 'title', label: '主标题' },
  { key: 'accent', label: '标题强调词' },
  { key: 'summary', label: '页面说明', multiline: true },
  { key: 'searchPlaceholder', label: '搜索框提示' },
  { key: 'searchHint', label: '搜索示例' },
  { key: 'allLabel', label: '全部分类文案' },
  { key: 'popularLabel', label: '热门标签文案' },
  { key: 'questionUnit', label: '问题数量单位' },
  { key: 'emptyTitle', label: '无结果标题' },
  { key: 'emptyMessage', label: '无结果说明', multiline: true },
  { key: 'emptyAction', label: '无结果按钮' },
  { key: 'quickJumpLabel', label: '快捷目录标题' },
  { key: 'ctaTitle', label: '底部引导标题' },
  { key: 'ctaBody', label: '底部引导说明', multiline: true },
  { key: 'primaryAction', label: '提交需求按钮' },
  { key: 'secondaryAction', label: '浏览产品按钮' },
]

function inputValue(event: Event) {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function pageValue(field: FaqPageTextKey) {
  if (props.locale === 'zh-CN') return String(props.faq[field] ?? '')
  return props.faq.translations?.[props.locale]?.[field] ?? ''
}

function updatePageField(field: FaqPageTextKey, event: Event) {
  const value = inputValue(event)
  if (props.locale === 'zh-CN') {
    emit('updatePage', { [field]: value })
    return
  }
  emit('updatePage', {
    translations: {
      ...props.faq.translations,
      [props.locale]: {
        ...(props.faq.translations?.[props.locale] ?? {}),
        [field]: value,
      },
    },
  })
}

function categoryTitle(category: FaqCategory) {
  if (props.locale === 'zh-CN') return category.title
  return category.titleTranslations?.[props.locale] ?? ''
}

function updateCategoryTitle(category: FaqCategory, event: Event) {
  const value = inputValue(event)
  if (props.locale === 'zh-CN') {
    emit('updateCategory', category.id, { title: value })
    return
  }
  emit('updateCategory', category.id, {
    titleTranslations: { ...category.titleTranslations, [props.locale]: value },
  })
}

function itemText(item: FaqItem, field: 'question' | 'answer') {
  if (props.locale === 'zh-CN') return item[field]
  return (field === 'question' ? item.questionTranslations : item.answerTranslations)?.[props.locale] ?? ''
}

function updateItemText(categoryId: string, item: FaqItem, field: 'question' | 'answer', event: Event) {
  const value = inputValue(event)
  if (props.locale === 'zh-CN') {
    emit('updateItem', categoryId, item.id, { [field]: value })
    return
  }
  const translationField = field === 'question' ? 'questionTranslations' : 'answerTranslations'
  emit('updateItem', categoryId, item.id, {
    [translationField]: { ...item[translationField], [props.locale]: value },
  })
}

function updateItemFlag(categoryId: string, itemId: string, field: 'enabled' | 'popular', event: Event) {
  emit('updateItem', categoryId, itemId, { [field]: (event.target as HTMLInputElement).checked })
}

function removeItem(category: FaqCategory, item: FaqItem) {
  if (!window.confirm(`确认删除「${item.question || '未命名问题'}」？`)) return
  emit('removeItem', category.id, item.id)
}
</script>

<template>
  <section class="faq-editor">
    <section class="faq-copy-section">
      <div class="faq-section-heading">
        <div class="faq-section-icon"><CircleHelp /></div>
        <div>
          <h2>帮助中心页面文案</h2>
          <p>当前正在编辑{{ locale === 'zh-CN' ? '中文' : locale === 'en' ? '英文' : '东南亚语' }}版本。</p>
        </div>
      </div>

      <div class="faq-copy-grid">
        <label v-for="field in pageFields" :key="field.key" :class="{ wide: field.multiline }">
          {{ field.label }}
          <textarea
            v-if="field.multiline"
            rows="3"
            :value="pageValue(field.key)"
            @input="updatePageField(field.key, $event)"
          />
          <input v-else :value="pageValue(field.key)" @input="updatePageField(field.key, $event)" />
        </label>
      </div>
    </section>

    <section class="faq-category-section">
      <div class="faq-section-heading compact">
        <div>
          <h2>问题分类与解答</h2>
          <p>问题停用后不会在前台展示，热门问题会显示强调标签。</p>
        </div>
      </div>

      <details v-for="category in faq.categories" :key="category.id" class="faq-category" open>
        <summary>
          <strong>{{ categoryTitle(category) || category.title }}</strong>
          <span>{{ category.items.length }} 条</span>
        </summary>

        <div class="faq-category-body">
          <div class="faq-category-toolbar">
            <label>
              分类名称
              <input :value="categoryTitle(category)" @input="updateCategoryTitle(category, $event)" />
            </label>
            <label class="check-field">
              <input
                type="checkbox"
                :checked="category.enabled"
                @change="emit('updateCategory', category.id, { enabled: ($event.target as HTMLInputElement).checked })"
              />
              前台启用
            </label>
            <button class="ghost-button compact" type="button" @click="emit('addItem', category.id)">
              <Plus class="button-icon" />
              <span>新增问题</span>
            </button>
          </div>

          <div class="faq-item-list">
            <article v-for="(item, index) in category.items" :key="item.id" class="faq-item-editor">
              <header>
                <span>问题 {{ index + 1 }}</span>
                <div class="faq-item-flags">
                  <label class="check-field">
                    <input type="checkbox" :checked="item.popular" @change="updateItemFlag(category.id, item.id, 'popular', $event)" />
                    热门
                  </label>
                  <label class="check-field">
                    <input type="checkbox" :checked="item.enabled" @change="updateItemFlag(category.id, item.id, 'enabled', $event)" />
                    启用
                  </label>
                  <button class="icon-button danger" type="button" aria-label="删除问题" title="删除问题" @click="removeItem(category, item)">
                    <Trash2 />
                  </button>
                </div>
              </header>
              <label>
                问题
                <input :value="itemText(item, 'question')" @input="updateItemText(category.id, item, 'question', $event)" />
              </label>
              <label>
                解答
                <textarea rows="5" :value="itemText(item, 'answer')" @input="updateItemText(category.id, item, 'answer', $event)" />
              </label>
            </article>
          </div>
        </div>
      </details>
    </section>
  </section>
</template>

<style scoped>
.faq-editor {
  display: grid;
  gap: 28px;
}

.faq-copy-section,
.faq-category-section {
  display: grid;
  gap: 18px;
}

.faq-section-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid #dbe3ec;
  padding-bottom: 16px;
}

.faq-section-heading.compact {
  align-items: flex-end;
}

.faq-section-heading h2,
.faq-section-heading p {
  margin: 0;
}

.faq-section-heading h2 {
  font-size: 20px;
}

.faq-section-heading p {
  margin-top: 4px;
  color: #617084;
  font-size: 13px;
}

.faq-section-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 6px;
  background: #e8f4f1;
  color: #0f766e;
}

.faq-section-icon svg {
  width: 20px;
}

.faq-copy-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.faq-copy-grid .wide {
  grid-column: 1 / -1;
}

.faq-category {
  overflow: hidden;
  border: 1px solid #d7e0e9;
  border-radius: 6px;
  background: #ffffff;
}

.faq-category summary {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #f5f8fa;
}

.faq-category summary span {
  color: #64748b;
  font-size: 12px;
}

.faq-category-body {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.faq-category-toolbar {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) auto auto;
  align-items: end;
  gap: 14px;
}

.faq-item-list {
  display: grid;
  gap: 12px;
}

.faq-item-editor {
  display: grid;
  gap: 12px;
  border: 1px solid #e1e7ed;
  border-left: 3px solid #0f766e;
  border-radius: 6px;
  padding: 14px;
}

.faq-item-editor header,
.faq-item-flags {
  display: flex;
  align-items: center;
}

.faq-item-editor header {
  justify-content: space-between;
}

.faq-item-editor header > span {
  color: #46566a;
  font-size: 12px;
  font-weight: 700;
}

.faq-item-flags {
  gap: 12px;
}

.faq-item-flags .icon-button {
  width: 32px;
  height: 32px;
}

.faq-item-flags .icon-button svg {
  width: 16px;
}

@media (max-width: 760px) {
  .faq-copy-grid,
  .faq-category-toolbar {
    grid-template-columns: 1fr;
  }

  .faq-copy-grid .wide {
    grid-column: auto;
  }

  .faq-item-editor header {
    align-items: flex-start;
    gap: 10px;
  }

  .faq-item-flags {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>
