import type {
  DeliveryCaseStructuredContent,
  DeliveryChallenge,
  SolutionDocumentSection,
} from '../../types/catalog'

type EditableLocale = 'zh-CN' | 'id' | 'en'

const solutionDefinitions: Record<EditableLocale, Array<{ type: SolutionDocumentSection['type']; title: string }>> = {
  'zh-CN': [
    { type: 'paragraph', title: '详细方案描述' },
    { type: 'paragraph', title: '与印尼适配' },
    { type: 'paragraph', title: '专业规格与标准依据' },
    { type: 'table', title: '产品规格对比表' },
    { type: 'paragraph', title: '原创经验与测试数据' },
    { type: 'list', title: '曾经踩过的坑与痛点' },
    { type: 'paragraph', title: '核心参数' },
    { type: 'list', title: '我方特殊贡献' },
    { type: 'list', title: '项目收益' },
  ],
  id: [
    { type: 'paragraph', title: 'Deskripsi Lengkap Skema' },
    { type: 'paragraph', title: 'Penyesuaian Khusus untuk Pasar Indonesia' },
    { type: 'paragraph', title: 'Spesifikasi Profesional dan Acuan Standar' },
    { type: 'table', title: 'Tabel Perbandingan Spesifikasi Produk' },
    { type: 'paragraph', title: 'Pengalaman Asli dan Data Hasil Uji Coba' },
    { type: 'list', title: 'Masalah & Hambatan yang Pernah Dialami' },
    { type: 'paragraph', title: 'Parameter Inti' },
    { type: 'list', title: 'Keunggulan Khusus Kami' },
    { type: 'list', title: 'Keuntungan Proyek' },
  ],
  en: [
    { type: 'paragraph', title: 'Detailed Solution Description' },
    { type: 'paragraph', title: 'Adaptation for Indonesia' },
    { type: 'paragraph', title: 'Professional Specifications and Standards' },
    { type: 'table', title: 'Product Specification Comparison' },
    { type: 'paragraph', title: 'Original Experience and Test Data' },
    { type: 'list', title: 'Pitfalls and Pain Points' },
    { type: 'paragraph', title: 'Core Parameters' },
    { type: 'list', title: 'Our Special Contributions' },
    { type: 'list', title: 'Project Benefits' },
  ],
}

const solutionTableHeaders: Record<EditableLocale, string[]> = {
  'zh-CN': ['配置档位', '典型规格', '适用买家/场景', '采购提醒'],
  id: ['Tingkat Konfigurasi', 'Spesifikasi Khas', 'Pembeli/Skenario yang Sesuai', 'Peringatan Pengadaan'],
  en: ['Configuration Level', 'Typical Specification', 'Applicable Buyer/Scenario', 'Procurement Notes'],
}

export const deliveryCaseSectionLabels: Record<EditableLocale, Record<keyof DeliveryCaseStructuredContent, string>> = {
  'zh-CN': {
    project_overview: '项目概述',
    indonesia_fit: '与印尼适配',
    professional_configuration: '专业配置与标准',
    key_parameter_table: '关键规格对比表',
    delivery_challenges: '交付难点与解决方案',
    project_results: '项目成效',
  },
  id: {
    project_overview: 'Gambaran Umum Proyek',
    indonesia_fit: 'Sesuai Standar Indonesia',
    professional_configuration: 'Konfigurasi Profesional dan Standar',
    key_parameter_table: 'Tabel Perbandingan Spesifikasi Utama',
    delivery_challenges: 'Kesulitan Pengiriman & Solusi',
    project_results: 'Hasil Proyek',
  },
  en: {
    project_overview: 'Project Overview',
    indonesia_fit: 'Adaptation for Indonesia',
    professional_configuration: 'Professional Configuration and Standards',
    key_parameter_table: 'Key Specification Comparison',
    delivery_challenges: 'Delivery Challenges and Solutions',
    project_results: 'Project Results',
  },
}

const deliveryTableHeaders: Record<EditableLocale, string[]> = {
  'zh-CN': ['配置项', '常规做法', '优化后交付规格与价值'],
  id: ['Item Konfigurasi', 'Cara Pemasangan Biasa', 'Spesifikasi Pengiriman Setelah Optimalisasi & Manfaat'],
  en: ['Configuration Item', 'Standard Approach', 'Optimized Delivery Specification and Value'],
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char)
}

function textAsHtml(value: string) {
  const content = value.trim()
  if (!content) return ''
  if (/<\/?[a-z][\s\S]*>/i.test(content)) return content
  return content.split('\n').map(line => line.trim()).filter(Boolean).map(line => `<p>${escapeHtml(line)}</p>`).join('')
}

function tableAsHtml(rows: string[][]) {
  if (!rows.length) return ''
  const [header, ...body] = rows
  const head = `<thead><tr>${header.map(cell => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead>`
  const bodyHtml = `<tbody>${body.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`
  return `<table>${head}${bodyHtml}</table>`
}

export function normalizeSolutionSections(
  sections: SolutionDocumentSection[] | undefined,
  locale: EditableLocale,
  legacyContent = '',
): SolutionDocumentSection[] {
  const definitions = solutionDefinitions[locale]
  return definitions.map((definition, index) => {
    const source = sections?.[index]
    const title = source?.title?.trim() || definition.title
    if (definition.type === 'table') {
      const rows = source?.type === 'table' && source.rows?.length
        ? source.rows.map(row => row.map(String))
        : [solutionTableHeaders[locale]]
      return { type: 'table', title, rows }
    }
    if (definition.type === 'list') {
      const items = source?.type === 'list' ? (source.items ?? []).map(String) : []
      return { type: 'list', title, items }
    }
    const fallback = index === 0 && !sections?.length ? legacyContent : ''
    return { type: 'paragraph', title, content: source?.type === 'paragraph' ? String(source.content ?? '') : fallback }
  })
}

export function cleanSolutionSections(sections: SolutionDocumentSection[]): SolutionDocumentSection[] {
  return sections.map((section) => {
    if (section.type === 'table') {
      return {
        type: 'table',
        title: section.title.trim(),
        rows: (section.rows ?? []).map(row => row.map(cell => cell.trim())).filter(row => row.some(Boolean)),
      }
    }
    if (section.type === 'list') {
      return {
        type: 'list',
        title: section.title.trim(),
        items: (section.items ?? []).map(item => item.trim()).filter(Boolean),
      }
    }
    return { type: 'paragraph', title: section.title.trim(), content: (section.content ?? '').trim() }
  })
}

export function solutionSectionsToHtml(sections: SolutionDocumentSection[]) {
  return cleanSolutionSections(sections).map((section) => {
    const heading = `<h2>${escapeHtml(section.title)}</h2>`
    if (section.type === 'table') return `${heading}${tableAsHtml(section.rows ?? [])}`
    if (section.type === 'list') {
      const items = (section.items ?? []).map(item => `<li>${escapeHtml(item)}</li>`).join('')
      return `${heading}${items ? `<ul>${items}</ul>` : ''}`
    }
    return `${heading}${textAsHtml(section.content ?? '')}`
  }).join('')
}

export function normalizeDeliveryCaseContent(
  value: Partial<DeliveryCaseStructuredContent>,
  locale: EditableLocale,
): DeliveryCaseStructuredContent {
  return {
    project_overview: String(value.project_overview ?? ''),
    indonesia_fit: String(value.indonesia_fit ?? ''),
    professional_configuration: String(value.professional_configuration ?? ''),
    key_parameter_table: value.key_parameter_table?.length
      ? value.key_parameter_table.map(row => row.map(String))
      : [deliveryTableHeaders[locale]],
    delivery_challenges: (value.delivery_challenges ?? []).map(item => ({
      challenge: String(item.challenge ?? ''),
      solution: String(item.solution ?? ''),
    })),
    project_results: String(value.project_results ?? ''),
  }
}

export function cleanDeliveryCaseContent(value: DeliveryCaseStructuredContent): DeliveryCaseStructuredContent {
  return {
    project_overview: value.project_overview.trim(),
    indonesia_fit: value.indonesia_fit.trim(),
    professional_configuration: value.professional_configuration.trim(),
    key_parameter_table: value.key_parameter_table.map(row => row.map(cell => cell.trim())).filter(row => row.some(Boolean)),
    delivery_challenges: value.delivery_challenges
      .map(item => ({ challenge: item.challenge.trim(), solution: item.solution.trim() }))
      .filter(item => item.challenge || item.solution),
    project_results: value.project_results.trim(),
  }
}

export function deliveryCaseContentToHtml(value: DeliveryCaseStructuredContent, locale: EditableLocale) {
  const content = cleanDeliveryCaseContent(value)
  const labels = deliveryCaseSectionLabels[locale]
  const challenges = content.delivery_challenges.map((item, index) => (
    `<p>${String.fromCharCode(97 + index)}. <strong>${escapeHtml(locale === 'zh-CN' ? '难点：' : locale === 'id' ? 'Kesulitan: ' : 'Challenge: ')}</strong>${escapeHtml(item.challenge)}<br>`
    + `<strong>${escapeHtml(locale === 'zh-CN' ? '解决方案：' : locale === 'id' ? 'Solusi: ' : 'Solution: ')}</strong>${escapeHtml(item.solution)}</p>`
  )).join('')
  return [
    `<h2>${escapeHtml(labels.project_overview)}</h2>${textAsHtml(content.project_overview)}`,
    `<h2>${escapeHtml(labels.indonesia_fit)}</h2>${textAsHtml(content.indonesia_fit)}`,
    `<h2>${escapeHtml(labels.professional_configuration)}</h2>${textAsHtml(content.professional_configuration)}`,
    `<h2>${escapeHtml(labels.key_parameter_table)}</h2>${tableAsHtml(content.key_parameter_table)}`,
    `<h2>${escapeHtml(labels.delivery_challenges)}</h2>${challenges}`,
    `<h2>${escapeHtml(labels.project_results)}</h2>${textAsHtml(content.project_results)}`,
  ].join('')
}

export function cloneDeliveryChallenges(items: DeliveryChallenge[] | undefined) {
  return (items ?? []).map(item => ({ challenge: item.challenge, solution: item.solution }))
}
