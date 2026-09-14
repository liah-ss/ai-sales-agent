export type RichContentBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'labeled'; label: string; content: string }
  | { type: 'pair'; challenge: string; solution: string }
  | { type: 'parameters'; rows: Array<{ label: string; value: string }> }
  | { type: 'emphasis'; label?: string; content: string }

const SECTION_TITLES = [
  '用途',
  '使用条件',
  '结构特征',
  '技术参数',
  '产品特点',
  '执行标准',
  '安装条件',
  '维护要求',
  '项目背景',
  '项目概况',
  '应用场景',
  '现状痛点',
  '方案配置',
  '配置方案',
  '设备选型',
  '实施步骤',
  '交付难点与解决方案',
  '专业配置',
  '东南亚适配',
]

const LABELED_TITLES = new Set([
  '项目背景',
  '项目概况',
  '应用场景',
  '现状痛点',
  '方案配置',
  '配置方案',
  '设备选型',
  '核心配置',
  '专业配置',
  '东南亚适配',
  '客户需求',
  '项目周期',
  '交付范围',
])

const EMPHASIS_TITLES = new Set([
  '温馨提示',
  '提示',
  '项目成效',
  '项目结果',
  '项目成果',
  '预期价值',
  '结论',
  '总结',
])

const sectionPattern = SECTION_TITLES.map(title => title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
const inlineSectionPattern = new RegExp(
  `(?:^|\\s)(((?:\\d{1,2}|[一二三四五六七八九十])[、.．]?\\s*)(?:${sectionPattern}))(?=\\s|[:：]|$)`,
  'g',
)
const exactSectionPattern = new RegExp(
  `^(?:(?:\\d{1,2}|[一二三四五六七八九十])[、.．]?\\s*)?(?:${sectionPattern})[:：]?$`,
)
const numberedItemPattern = /^(?:\d{1,2}|[a-zA-Z])[、.．)]\s*\S+/
const bulletItemPattern = /^[•·●▪-]\s*\S+/
const structuralHtmlPattern = /<(?:h[1-6]|ul|ol|li|table|thead|tbody|tr|th|td|img|figure|blockquote|pre|iframe|div|section|article)\b/i

export function isSimpleParagraphHtml(source: string) {
  return /<p\b/i.test(source) && !structuralHtmlPattern.test(source)
}

function decodeHtml(value: string) {
  const namedEntities: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  }
  return value
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => namedEntities[name.toLowerCase()] ?? match)
}

function textFromHtml(value: string) {
  return decodeHtml(value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, ' '))
}

function splitInlineSections(paragraph: string) {
  const matches = Array.from(paragraph.matchAll(inlineSectionPattern))
  if (!matches.length) return [paragraph]

  const parts: string[] = []
  let cursor = 0
  for (const match of matches) {
    const matchIndex = match.index ?? 0
    const prefix = paragraph.slice(cursor, matchIndex).trim()
    if (prefix) parts.push(prefix)
    parts.push(match[1].trim())
    cursor = matchIndex + match[0].length
  }
  const remainder = paragraph.slice(cursor).trim()
  if (remainder) parts.push(remainder)
  return parts
}

function sourceParagraphs(source: string) {
  const rawParagraphs = isSimpleParagraphHtml(source)
    ? Array.from(source.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)).flatMap(match => textFromHtml(match[1]).split(/\n+/))
    : textFromHtml(source).split(/\n+/)

  return rawParagraphs
    .map(value => value.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .flatMap(splitInlineSections)
}

function labeledParts(value: string) {
  const match = value.match(/^([^:：]{1,24})[:：]\s*(.+)$/)
  if (!match) return null
  return { label: match[1].trim(), content: match[2].trim() }
}

function challengeContent(value: string) {
  const match = value.match(/^(?:[a-zA-Z][.．、]?\s*)?(?:难点|挑战)\s*[:：]\s*(.+)$/)
  return match?.[1].trim() ?? ''
}

function solutionContent(value: string) {
  const match = value.match(/^(?:解决方案|应对方案|方案)\s*[:：]\s*(.+)$/)
  return match?.[1].trim() ?? ''
}

function parameterRow(value: string) {
  const cells = value.split(/\s+\/\s+/).map(cell => cell.trim()).filter(Boolean)
  if (cells.length < 2 || cells[0].length > 24) return null
  return { label: cells[0], value: cells.slice(1).join(' / ') }
}

function standaloneBlock(value: string): RichContentBlock {
  if (exactSectionPattern.test(value)) return { type: 'heading', content: value }

  const labeled = labeledParts(value)
  if (labeled && EMPHASIS_TITLES.has(labeled.label)) {
    return { type: 'emphasis', label: labeled.label, content: labeled.content }
  }
  if (labeled && LABELED_TITLES.has(labeled.label)) {
    return { type: 'labeled', label: labeled.label, content: labeled.content }
  }
  if (/^(?:【?温馨提示】?|注意事项|特别说明)/.test(value)) {
    return { type: 'emphasis', content: value }
  }
  return { type: 'paragraph', content: value }
}

export function classifyRichContent(source: string): RichContentBlock[] {
  const paragraphs = sourceParagraphs(source)
  const blocks: RichContentBlock[] = []

  for (let index = 0; index < paragraphs.length;) {
    const current = paragraphs[index]
    const challenge = challengeContent(current)
    const solution = solutionContent(paragraphs[index + 1] ?? '')
    if (challenge && solution) {
      blocks.push({ type: 'pair', challenge, solution })
      index += 2
      continue
    }

    const parameterRows: Array<{ label: string; value: string }> = []
    let parameterIndex = index
    while (parameterIndex < paragraphs.length) {
      const row = parameterRow(paragraphs[parameterIndex])
      if (!row) break
      parameterRows.push(row)
      parameterIndex += 1
    }
    if (parameterRows.length >= 2) {
      blocks.push({ type: 'parameters', rows: parameterRows })
      index = parameterIndex
      continue
    }

    const ordered = numberedItemPattern.test(current)
    const unordered = bulletItemPattern.test(current)
    if (ordered || unordered) {
      const pattern = ordered ? numberedItemPattern : bulletItemPattern
      const items: string[] = []
      let listIndex = index
      while (listIndex < paragraphs.length && pattern.test(paragraphs[listIndex])) {
        items.push(paragraphs[listIndex])
        listIndex += 1
      }
      if (items.length >= 2) {
        blocks.push({ type: 'list', ordered, items })
        index = listIndex
        continue
      }
    }

    blocks.push(standaloneBlock(current))
    index += 1
  }

  return blocks
}
