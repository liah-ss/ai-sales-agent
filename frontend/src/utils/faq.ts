import type { FaqCategoryConfig, FaqItemConfig, FaqPageConfig, FaqPageTextKey, WebsiteLocale } from '../types/websiteConfig'

export function faqPageText(faq: FaqPageConfig, field: FaqPageTextKey, locale: WebsiteLocale) {
  if (locale !== 'zh-CN') {
    const translated = faq.translations?.[locale]?.[field]
    if (translated?.trim()) return translated
  }
  return String(faq[field] ?? '')
}

export function faqCategoryTitle(category: FaqCategoryConfig, locale: WebsiteLocale) {
  if (locale !== 'zh-CN') {
    const translated = category.titleTranslations?.[locale]
    if (translated?.trim()) return translated
  }
  return category.title
}

export function faqItemQuestion(item: FaqItemConfig, locale: WebsiteLocale) {
  if (locale !== 'zh-CN') {
    const translated = item.questionTranslations?.[locale]
    if (translated?.trim()) return translated
  }
  return item.question
}

export function faqItemAnswer(item: FaqItemConfig, locale: WebsiteLocale) {
  if (locale !== 'zh-CN') {
    const translated = item.answerTranslations?.[locale]
    if (translated?.trim()) return translated
  }
  return item.answer
}
